import { test, expect } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Campus and Office must not intersect.
 *
 * Campus is **frozen, not deleted** — it is kept for a future product, and
 * must stay intact and compiling. The requirement is that the two products
 * share no surface: nothing in Office may import campus code, and no campus
 * string may reach an office screen.
 *
 * This is a static test, not a browser one. The runtime half already exists in
 * `office-only-dashboard.spec.ts`, which signs in as every real office role and
 * asserts no campus content renders at `/`. What that cannot catch is a *new*
 * import quietly reconnecting the two — which is exactly how the last defect
 * arrived: `DashboardContainer` imported `CampusDashboard`, and no test had an
 * opinion about it until a user sent a screenshot.
 */

const repoRoot = path.resolve(__dirname, '..');
// Read from the working tree, not `git show HEAD` — the point is to check what
// is about to ship, not what was last committed.
const SIDEBAR = path.join(repoRoot, 'frontend/web/components/layout/Sidebar.tsx');

/** Source files that reference campus, excluding campus's own directories. */
function nonCampusFilesReferencingCampus(): string[] {
    // `git grep` keeps this to tracked source: no node_modules, no .next build
    // artifacts (which contain generated campus route imports and would
    // otherwise produce a permanent false positive).
    let out = '';
    try {
        out = execFileSync(
            'git',
            [
                'grep', '-l', '-E',
                // Any module specifier containing "campus", in any import form.
                //
                // An earlier draft of this matched only `features/campus`, and
                // was therefore vacuous: the defect it exists to catch imported
                // `'../campus/CampusDashboard'` — a *relative* path — and sailed
                // straight through. Verified by reintroducing that exact import
                // and watching this test go red.
                "(from|import\\()\\s*['\"][^'\"]*campus",
                '--', 'frontend/web/app', 'frontend/web/components', 'frontend/web/contexts',
                'frontend/web/features', 'frontend/web/services', 'frontend/web/config',
                'frontend/web/lib',
            ],
            { cwd: repoRoot, encoding: 'utf8' },
        );
    } catch {
        // git grep exits 1 when there are no matches at all.
        return [];
    }

    return out
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean)
        .filter((f) => !f.startsWith('frontend/web/features/campus/'))
        .filter((f) => !f.startsWith('frontend/web/app/campus/'));
}

test.describe('Campus stays frozen and separate from Office', () => {
    test('no office or shared module imports campus code', () => {
        const offenders = nonCampusFilesReferencingCampus();

        // One deliberate seam: the Sidebar composes campus *navigation data* so
        // a single shell can serve either vertical. It imports no campus
        // component, service or page. Any other file appearing here means the
        // two products have been reconnected.
        const ALLOWED = ['frontend/web/components/layout/Sidebar.tsx'];

        const unexpected = offenders.filter((f) => !ALLOWED.includes(f));
        expect(
            unexpected,
            `these office/shared files reference campus code:\n${unexpected.join('\n')}`,
        ).toEqual([]);
    });

    test('the campus seam carries data only, never a component', () => {
        const sidebar = readFileSync(SIDEBAR, 'utf8');

        const campusImports = sidebar
            .split('\n')
            .filter((l) => l.includes('features/campus'));

        expect(campusImports.length, 'expected exactly one campus import').toBe(1);
        expect(
            campusImports[0],
            'the Sidebar must import only campusMenus — importing a campus component ' +
            'is how CampusDashboard reached the office home page before',
        ).toContain('campusMenus');
    });

    test('office navigation declares no student role', () => {
        const sidebar = readFileSync(SIDEBAR, 'utf8');

        // `student:` may appear only inside the campus menu module, which is a
        // different file entirely. Its presence here means an office vertical
        // has grown a student surface again.
        expect(
            sidebar.includes('student:'),
            'Sidebar.tsx declares a student menu; office verticals have no students',
        ).toBe(false);
    });
});
