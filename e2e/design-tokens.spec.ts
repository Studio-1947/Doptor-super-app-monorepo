import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const webRoot = path.join(repoRoot, 'frontend/web');
const CONFIG = path.join(webRoot, 'tailwind.config.ts');

/**
 * Static guards over the semantic colour tokens.
 *
 * Backlog §0 asked for the ad-hoc emerald/indigo classes to move onto "the
 * shared token system". Reading the call sites showed the premise was wrong:
 * outside `verticalTheme` those two were never vertical accents. emerald meant
 * *approved / present / active / done* — `features/office/` used it in seven
 * files, none of them about Campus — and indigo meant *primary action*.
 *
 * They moved onto semantic ramps instead, and a second pass did the same for
 * the rest of the palette:
 *
 *   success  emerald   approved, present, active, valid, done, published
 *   brand    indigo    primary action: filled button, active tab, focus ring
 *   danger   red       rejected, absent, error, delete, overdue, immediate
 *   warning  orange    pending, late, half-day, review, urgent, high
 *   info     blue      in-progress, excused, medium priority, hint panels
 *
 * success and brand were pure renames — the compiled stylesheet was identical
 * rule for rule, 964 for 964. danger, warning and success were **not**: three
 * meanings had grown two palettes each (`rose`, `amber`, `green`), and 49 sites
 * changed colour when the duplicates collapsed. `FileList`'s status map had
 * `active` in green directly above `approved` in emerald, while `office/team`
 * and `StudentList` already drew "active" in emerald. Two greens for one state
 * is drift, not design.
 *
 * Both guards exist because Tailwind fails *silently*. A class it does not
 * recognise is not an error — no rule is generated and the element renders
 * unstyled, which no type checker and no build sees. Same trap already
 * documented for dynamic class names in `app/register/page.tsx`.
 */

const TOKENS = ['success', 'brand', 'danger', 'warning', 'info'] as const;
type Token = (typeof TOKENS)[number];

const SOURCE_DIRS = ['app', 'components', 'features', 'contexts', 'hooks', 'services'];

function sourceFiles(): string[] {
  const out: string[] = [];
  for (const dir of SOURCE_DIRS) {
    const abs = path.join(webRoot, dir);
    let entries: string[];
    try {
      entries = readdirSync(abs, { recursive: true }) as string[];
    } catch {
      continue; // directory is optional
    }
    for (const rel of entries) {
      if (!/\.(tsx?|jsx?)$/.test(rel)) continue;
      out.push(path.join(abs, rel));
    }
  }
  return out;
}

/** The shades actually declared for a colour in tailwind.config.ts. */
function declaredShades(colour: string): Set<string> {
  const config = readFileSync(CONFIG, 'utf8');
  const block = new RegExp(`\\b${colour}:\\s*\\{([^}]*)\\}`, 'm').exec(config);
  if (!block) return new Set();
  return new Set([...block[1].matchAll(/(\d+):\s*["']#/g)].map((m) => m[1]));
}

test('every semantic colour token resolves to a declared shade', () => {
  const declared = {} as Record<Token, Set<string>>;
  for (const t of TOKENS) {
    declared[t] = declaredShades(t);
    expect(declared[t].size, `\`${t}\` ramp missing from tailwind.config.ts`).toBeGreaterThan(0);
  }

  const offenders: string[] = [];
  const pattern = new RegExp(`\\b(${TOKENS.join('|')})-(\\d+)\\b`, 'g');

  for (const file of sourceFiles()) {
    const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(pattern)) {
          const [, colour, shade] = m;
          if (!declared[colour as Token].has(shade)) {
            offenders.push(`${rel}:${i + 1} uses ${colour}-${shade}, which is not declared`);
          }
        }
      });
  }

  expect(
    offenders,
    `undeclared token shades render as no style at all:\n  ${offenders.join('\n  ')}`,
  ).toEqual([]);
});

/**
 * A ratchet, not a ban — except where the count is already zero.
 *
 * Raw palette colour legitimately survives in three kinds of place, and
 * forcing any of them into a semantic name would be a lie:
 *
 *   - **Token definitions.** `verticalTheme` (contexts/VerticalContext.tsx)
 *     and `TONES` (features/dashboard/DashboardPrimitives.tsx) *are* the token
 *     layer; raw values are what a token definition is made of.
 *   - **Decorative colour.** Stat-tile swatches, avatar chips, nav-card
 *     rotations, the Holiday marker, timetable cards, the join/create accents
 *     on /onboarding and /register. `tone="emerald"` sits on "Departments";
 *     `tone="indigo"` on "Pending Leave". A tile counting "Total Members" is
 *     not `brand` and one counting "Roles" is not `success`.
 *   - **Domain colour.** The "Initial Green Sheet Note" field in
 *     `FileCreateModal` is green because a green sheet is green.
 *
 * `red` and `green` are at **0** and must stay there: every use of both was a
 * state, so any reappearance is a regression rather than a judgement call.
 * `blue` is not zero because /forgot-password, /reset-password and
 * /verify-email use it as their *action* colour inside `from-blue-600
 * to-indigo-600` gradients that would flatten to one flat indigo if converted.
 * Unifying those three pages is a redesign, not a rename.
 *
 * Removing raw usages is always fine — lower the numbers when you do.
 */
test('raw palette usage does not grow', () => {
  const BASELINE: Record<string, number> = {
    emerald: 61,
    indigo: 106,
    red: 0,
    green: 0,
    rose: 1,
    orange: 7,
    amber: 6,
    blue: 60,
    teal: 3,
    sky: 1,
    violet: 8,
    purple: 11,
  };

  const families = Object.keys(BASELINE);
  const pattern = new RegExp(`\\b(${families.join('|')})-\\d+\\b`, 'g');

  const counts: Record<string, number> = Object.fromEntries(families.map((f) => [f, 0]));
  const sites: Record<string, string[]> = Object.fromEntries(families.map((f) => [f, []]));

  for (const file of sourceFiles()) {
    const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
    readFileSync(file, 'utf8')
      .split('\n')
      .forEach((line, i) => {
        for (const m of line.matchAll(pattern)) {
          counts[m[1]]++;
          sites[m[1]].push(`${rel}:${i + 1}`);
        }
      });
  }

  const grown = families.filter((f) => counts[f] > BASELINE[f]);

  const detail = grown
    .map((f) => {
      const added = counts[f] - BASELINE[f];
      const where = [...new Set(sites[f])].slice(0, 10).join('\n      ');
      return `  ${f}: ${BASELINE[f]} -> ${counts[f]} (+${added})\n      ${where}`;
    })
    .join('\n');

  expect(
    grown,
    'raw palette colour grew:\n' +
      detail +
      '\n\nIf it encodes a state or a primary action, use the semantic token:\n' +
      '  success | brand | danger | warning | info\n' +
      'If it is genuinely decorative, a token definition, or domain colour,\n' +
      'raise that baseline here and say which in the commit.',
  ).toEqual([]);
});
