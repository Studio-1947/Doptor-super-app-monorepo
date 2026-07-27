/*
 * Shared transport for the smoke suites: HTTP to the API, SQL to its database.
 *
 * Only the transport lives here. Each suite keeps its own `check`/reporting block,
 * because those genuinely differ (06-tenancy reports findings by severity rather
 * than pass/fail) and forcing one shape on them would obscure more than it saves.
 */
const { execSync } = require("child_process");

const BASE = process.env.SMOKE_BASE_URL || "http://127.0.0.1:3001";

/**
 * Override to seed against a remote environment, e.g.
 *   SMOKE_PSQL_CMD="ssh deploy@host docker exec -i doptor-postgres psql -U doptor -d doptor"
 * `docker exec` needs `-i` so stdin reaches psql.
 */
const PSQL_CMD = process.env.SMOKE_PSQL_CMD
  || "docker exec -i doptor-postgres psql -U doptor -d doptor";

async function req(method, path, { token, body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

/**
 * Run one statement and return every output row.
 *
 * SQL goes in over stdin (`-f -`) rather than `-c "..."`, so it needs no quote
 * escaping and survives being tunnelled through ssh.
 */
const sqlRows = (q) => execSync(`${PSQL_CMD} -t -A -f -`, { input: q, encoding: "utf8" })
  .trim().split("\n").map((s) => s.trim()).filter(Boolean);

/**
 * Run one statement and return its first output row — the common case.
 * Only the first line is taken because psql appends the command status
 * (e.g. "INSERT 0 1"). Use `sqlRows` when the query returns a set.
 */
const sql = (q) => sqlRows(q)[0] || "";

module.exports = { BASE, PSQL_CMD, req, sql, sqlRows };
