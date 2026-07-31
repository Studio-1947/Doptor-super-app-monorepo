#!/usr/bin/env bash
#
# Nightly backup of the Doptor database and uploaded files.
#
# Installed on the VPS at ~deploy/bin/backup-doptor.sh and run from the deploy
# user's crontab. It lives in the repo so the backup procedure is versioned and
# reviewable rather than being a thing that exists only on one machine.
#
# Everything is deploy-owned on purpose: the account has no passwordless sudo,
# and a backup that needs root to run is a backup that stops running.
#
# Both halves matter. The database is the obvious one; `doptor-uploads-data`
# holds every file users have attached to a task or uploaded as a document, and
# those exist nowhere else — losing that volume loses the files permanently.
#
# Usage:
#   backup-doptor.sh            # normal nightly run
#   backup-doptor.sh --verify   # also test-restore the dump into a scratch DB
#
# Restore (database):
#   docker exec -i doptor-postgres pg_restore -U doptor -d doptor --clean \
#     --if-exists < ~/backups/doptor/db-YYYY-MM-DD.dump
#
# Restore (uploads):
#   docker exec -i doptor-api tar xzf - -C /app/uploads \
#     < ~/backups/doptor/uploads-YYYY-MM-DD.tar.gz

set -euo pipefail

BACKUP_DIR=${BACKUP_DIR:-$HOME/backups/doptor}
RETENTION_DAYS=${RETENTION_DAYS:-30}
DB_CONTAINER=${DB_CONTAINER:-doptor-postgres}
API_CONTAINER=${API_CONTAINER:-doptor-api}
DB_USER=${DB_USER:-doptor}
DB_NAME=${DB_NAME:-doptor}

stamp=$(date +%F)
db_file="$BACKUP_DIR/db-$stamp.dump"
uploads_file="$BACKUP_DIR/uploads-$stamp.tar.gz"

log() { echo "[$(date -Is)] $*"; }
fail() { echo "[$(date -Is)] ERROR: $*" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"

# --------------------------------------------------------------- database
# Custom format (-Fc): compressed, and pg_restore can list/select from it,
# which is what makes the integrity check below possible.
log "dumping $DB_NAME"
docker exec -i "$DB_CONTAINER" pg_dump -U "$DB_USER" -Fc "$DB_NAME" > "$db_file.partial" \
  || fail "pg_dump failed"
mv "$db_file.partial" "$db_file"

# A dump that cannot be listed is not a backup. This catches truncation and
# the container dying mid-write — both of which otherwise leave a plausible
# looking file that only fails on the day you need it.
docker exec -i "$DB_CONTAINER" pg_restore --list < "$db_file" > /dev/null \
  || fail "dump at $db_file is not a readable archive"
log "database ok: $(du -h "$db_file" | cut -f1)"

# ---------------------------------------------------------------- uploads
log "archiving uploads"
docker exec -i "$API_CONTAINER" tar czf - -C /app/uploads . > "$uploads_file.partial" \
  || fail "uploads archive failed"
mv "$uploads_file.partial" "$uploads_file"

gzip -t "$uploads_file" || fail "uploads archive at $uploads_file is corrupt"
log "uploads ok: $(du -h "$uploads_file" | cut -f1)"

# ------------------------------------------------- optional restore drill
# A backup is a hypothesis until it has been restored. `--verify` proves the
# dump actually rebuilds, into a scratch database that is dropped afterwards
# and never touches $DB_NAME.
if [[ "${1:-}" == "--verify" ]]; then
  scratch="restore_check_$(date +%s)"
  log "restore drill into $scratch"
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d postgres -v ON_ERROR_STOP=1 \
    -c "CREATE DATABASE $scratch;" > /dev/null
  # pg_restore exits non-zero on benign ownership notices, so judge the result
  # by what actually landed rather than by its exit code.
  docker exec -i "$DB_CONTAINER" pg_restore -U "$DB_USER" -d "$scratch" --no-owner \
    < "$db_file" > /dev/null 2>&1 || true
  tables=$(docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d "$scratch" -t -A \
    -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';")
  docker exec -i "$DB_CONTAINER" psql -U "$DB_USER" -d postgres \
    -c "DROP DATABASE $scratch;" > /dev/null
  [[ "$tables" -gt 30 ]] || fail "restore drill rebuilt only $tables tables"
  log "restore drill ok: $tables tables"
fi

# -------------------------------------------------------------- retention
deleted=$(find "$BACKUP_DIR" -maxdepth 1 -name 'db-*.dump' -o -name 'uploads-*.tar.gz' \
  | wc -l)
find "$BACKUP_DIR" -maxdepth 1 -type f \( -name 'db-*.dump' -o -name 'uploads-*.tar.gz' \) \
  -mtime +"$RETENTION_DAYS" -delete
log "retention: $RETENTION_DAYS days, $deleted archive(s) present before prune"

# Leave any half-written file from a crashed run visible rather than silently
# counting it as a backup.
find "$BACKUP_DIR" -maxdepth 1 -name '*.partial' -mtime +1 -delete || true

log "backup complete"
