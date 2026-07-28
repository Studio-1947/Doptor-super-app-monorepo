'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useRole } from '@/features/auth/RoleContext';
import { findVerticalRoot, isRouteAllowed } from '@/lib/route-access';

/**
 * Route-level role gating for the protected verticals.
 *
 * Renders inside AuthGuard, so the user is already loaded and authenticated by
 * the time this runs — the role it reads is the real one derived from the
 * signed-in user, not a guess.
 */
export function RoleGuard({ children }: { children: React.ReactNode }) {
    const { role } = useRole();
    const pathname = usePathname();
    const router = useRouter();

    const allowed = isRouteAllowed(pathname, role);

    useEffect(() => {
        if (allowed) return;

        // Falling back to the area root is only right when the user may
        // actually see it. Sending a staff member denied at /admin/roles to
        // /admin would deny them again and redirect to the same place — an
        // infinite loop. Before /admin was gated it was worse but quieter:
        // /admin has no page, so the denial landed on a 404.
        const root = findVerticalRoot(pathname);
        const canSeeRoot = root && root !== pathname && isRouteAllowed(root, role);
        router.replace(canSeeRoot ? root : '/');
    }, [allowed, pathname, role, router]);

    // Render nothing while the redirect is in flight rather than flashing a
    // page the user isn't allowed to see. The surrounding chrome stays put.
    if (!allowed) return null;

    return <>{children}</>;
}
