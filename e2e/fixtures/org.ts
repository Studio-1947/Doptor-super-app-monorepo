import { execFileSync } from 'node:child_process';
import path from 'node:path';
import type { APIRequestContext } from '@playwright/test';

export const API_URL = process.env.E2E_API_URL ?? 'https://api.dev.doptor.in';

/** Shared by every seeded account. Meets the API's complexity rules. */
export const PASSWORD = 'Passw0rd!23';

export interface SeededOrg {
  email: string;
  password: string;
  orgId: string;
  slug: string;
  orgName: string;
  /** Bearer token for the founding Organisation Admin, for API-side setup. */
  token: string;
}

/**
 * Registers a throwaway organisation over the API.
 *
 * Same approach as `backend/api/test/smoke` — a `Date.now()`-suffixed org per
 * run, so specs never collide and no long-lived fixture account has to be
 * maintained (or kept in sync when onboarding changes). The founding user is
 * an Organisation Admin holding every permission.
 */
export async function registerOrg(
  request: APIRequestContext,
  tag: string,
  verticals: string[] = ['office'],
): Promise<SeededOrg> {
  const uniq = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `${tag}+${uniq}@verify.test`;
  const orgName = `E2E ${tag} ${uniq}`;
  const slug = `e2e-${tag}-${uniq}`;

  const res = await request.post(`${API_URL}/auth/register-organisation`, {
    data: {
      organisation_name: orgName,
      slug,
      email,
      password: PASSWORD,
      enabled_verticals: verticals,
    },
  });

  if (!res.ok()) {
    throw new Error(`register-organisation failed: ${res.status()} ${await res.text()}`);
  }

  const body = await res.json();
  const orgId = sql(`select organisation_id from users where email = '${email}'`);

  return {
    email,
    password: PASSWORD,
    orgId,
    slug,
    orgName,
    token: body?.access_token ?? '',
  };
}

/**
 * Whether database-backed seeding is available.
 *
 * Seeding a *non-admin* user needs the database: the only way to create one
 * over the API is the invite flow, and the invitation token is emailed rather
 * than returned, so there is no way to set a password from a test. Specs that
 * need a Staff or Manager account skip themselves when this is false rather
 * than failing, so the suite stays runnable without database access.
 */
export function hasDb(): boolean {
  return Boolean(process.env.E2E_PSQL_CMD);
}

/** Runs one statement and returns the first column of the first row. */
export function sql(query: string): string {
  const cmd = process.env.E2E_PSQL_CMD;
  if (!cmd) return '';

  const [bin, ...args] = cmd.split(' ');
  const out = execFileSync(bin, [...args, '-t', '-A', '-f', '-'], {
    input: query,
    encoding: 'utf8',
  });
  return out.trim().split('\n')[0]?.trim() ?? '';
}

/**
 * Hashes with the API's own bcrypt rather than adding the dependency here.
 *
 * `bcrypt` is a native module and already installed for the backend workspace,
 * so it is borrowed from there instead of compiled twice.
 */
function bcryptHash(plain: string): string {
  const apiDir = path.resolve(__dirname, '../../backend/api');
  return execFileSync(
    process.execPath,
    ['-e', `process.stdout.write(require('bcrypt').hashSync(process.argv[1], 10))`, plain],
    { cwd: apiDir, encoding: 'utf8' },
  ).trim();
}

/**
 * Creates a user holding one of the organisation's standard roles.
 *
 * Only callable when {@link hasDb} is true.
 */
export function seedUserWithRole(
  orgId: string,
  roleName: string,
  tag: string,
): { email: string; password: string } {
  const uniq = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
  const email = `${tag}+${uniq}@verify.test`;
  const hash = bcryptHash(PASSWORD);

  const roleId = sql(
    `select id from roles where organisation_id = '${orgId}' and name = '${roleName}'`,
  );
  if (!roleId) throw new Error(`role "${roleName}" not found in org ${orgId}`);

  const userId = sql(
    `insert into users (email, password_hash, organisation_id, email_verified, first_name, last_name)
     values ('${email}', '${hash}', '${orgId}', true, '${tag}', 'User') returning id`,
  );
  sql(`insert into user_roles (user_id, role_id) values ('${userId}', '${roleId}')`);

  return { email, password: PASSWORD };
}
