import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(__dirname, '..');
const webRoot = path.join(repoRoot, 'frontend/web');
const CONFIG = path.join(webRoot, 'tailwind.config.ts');

/**
 * Static guards over the semantic colour tokens (`success`, `brand`).
 *
 * Backlog §0 asked for the ad-hoc emerald/indigo classes to move onto "the
 * shared token system". Reading the call sites showed the premise was wrong:
 * outside `verticalTheme` those two colours were never vertical accents.
 * emerald meant *approved / present / active / done* — `features/office/`
 * used it in seven files, none of them about Campus — and indigo meant
 * *primary action*. Moving them onto the vertical accent map would have made
 * every "Approved" badge change colour with the active vertical.
 *
 * So they moved onto two new semantic ramps instead, defined in
 * `tailwind.config.ts` as exact copies of Tailwind's emerald and indigo. That
 * made the migration a pure rename with a provably empty visual diff: renaming
 * success->emerald and brand->indigo in the compiled stylesheet reproduced the
 * pre-migration one rule for rule, 964 for 964.
 *
 * Both guards below exist because Tailwind fails *silently*. A class it does
 * not recognise is not an error — no rule is generated and the element simply
 * renders unstyled, which no type checker and no build sees. That is the same
 * trap already documented for dynamic class names in `app/register/page.tsx`.
 */

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
  const declared = {
    success: declaredShades('success'),
    brand: declaredShades('brand'),
  };

  expect(declared.success.size, '`success` ramp missing from tailwind.config.ts').toBeGreaterThan(0);
  expect(declared.brand.size, '`brand` ramp missing from tailwind.config.ts').toBeGreaterThan(0);

  const offenders: string[] = [];

  for (const file of sourceFiles()) {
    const src = readFileSync(file, 'utf8');
    const rel = path.relative(repoRoot, file).replace(/\\/g, '/');

    src.split('\n').forEach((line, i) => {
      for (const m of line.matchAll(/\b(success|brand)-(\d+)\b/g)) {
        const [, colour, shade] = m;
        if (!declared[colour as 'success' | 'brand'].has(shade)) {
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
 * A ratchet, not a ban.
 *
 * Raw emerald and indigo legitimately survive in three places, and forcing
 * them into a semantic name would be a lie in every one:
 *
 *   - **Token definitions.** `verticalTheme` (contexts/VerticalContext.tsx)
 *     and `TONES` (features/dashboard/DashboardPrimitives.tsx) *are* the token
 *     layer; raw values are what a token definition is made of.
 *   - **Decorative colour.** Stat-tile swatches, avatar-initial chips and the
 *     join/create accents on /onboarding and /register carry no state. A tile
 *     counting "Total Members" is not `brand`, and one counting "Departments"
 *     is not `success`.
 *   - **Domain colour.** The "Initial Green Sheet Note" field in
 *     `FileCreateModal.tsx` is green because a green sheet is green.
 *
 * What must not happen is a *new* status badge or primary button reaching for
 * the raw palette again. Pinning the count catches that without an allow-list
 * that would need editing every time a decorative chip moves. Removing raw
 * usages is always fine — lower the numbers when you do.
 */
test('raw emerald/indigo usage does not grow', () => {
  const BASELINE = { emerald: 61, indigo: 106 };

  const counts = { emerald: 0, indigo: 0 };
  const perFile: Record<string, number> = {};

  for (const file of sourceFiles()) {
    const src = readFileSync(file, 'utf8');
    const rel = path.relative(repoRoot, file).replace(/\\/g, '/');
    const found = [...src.matchAll(/\b(emerald|indigo)-\d+\b/g)];
    for (const m of found) counts[m[1] as 'emerald' | 'indigo']++;
    if (found.length) perFile[rel] = found.length;
  }

  const worst = Object.entries(perFile)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([f, n]) => `${n.toString().padStart(3)}  ${f}`)
    .join('\n  ');

  for (const colour of ['emerald', 'indigo'] as const) {
    expect(
      counts[colour],
      `raw ${colour} grew from ${BASELINE[colour]} to ${counts[colour]}.\n` +
        `If this is a status or a primary action, use success-*/brand-* instead.\n` +
        `If it is genuinely decorative, raise the baseline in this test.\n` +
        `Heaviest files:\n  ${worst}`,
    ).toBeLessThanOrEqual(BASELINE[colour]);
  }
});
