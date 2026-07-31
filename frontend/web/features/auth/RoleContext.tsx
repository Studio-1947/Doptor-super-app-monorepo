"use client";

import { createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/services/auth.service';

export { type UserRole };

interface RoleContextType {
    role: UserRole;
    isSuperAdmin: boolean;
    isOrgAdmin: boolean;
    isManager: boolean;
    isStaff: boolean;
    isStudent: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// The backend's real RBAC role names (e.g. "Organisation Admin", "Professor")
// don't match this frontend's legacy single-role enum 1:1 — this priority
// list translates from the real `user.roles` array to the closest legacy
// value, highest-privilege first. Multi-word/varied role names (Professor,
// Principal, Volunteer, Coordinator, Field Worker, Department Head) are
// treated as generic "staff" for nav purposes until the frontend migrates
// off this shim to `hasRole`/`hasAnyRole` directly.
// The six roles every organisation actually gets are Organisation Admin,
// Manager, Department Head, Staff, Auditor and HR Manager. `hr manager` and
// `auditor` were missing here until 2026-07-31 and fell through to the generic
// fallback — which mattered for HR Manager, whose `approve:attendance` and
// `create:users` are manager-tier work, but who was shown Staff navigation
// without the approvals queue they are responsible for.
//
// Auditor is read-only everywhere. It maps to `staff` because that is the
// least-privileged bucket this legacy shim has; there is no read-only tier.
const ROLE_PRIORITY: { legacy: UserRole; matchNames: string[] }[] = [
    { legacy: 'super_admin', matchNames: ['super admin'] },
    { legacy: 'org_admin', matchNames: ['organisation admin', 'org admin'] },
    { legacy: 'manager', matchNames: ['manager', 'hr manager', 'department head'] },
    { legacy: 'staff', matchNames: ['staff', 'auditor', 'coordinator', 'field worker', 'professor', 'principal', 'volunteer'] },
    { legacy: 'student', matchNames: ['student'] },
];

function deriveLegacyRole(userRoles: Array<{ name: string }> | undefined): UserRole {
    // No roles at all — unauthenticated, an account with none assigned, or a
    // session where `/auth/me` has not resolved yet.
    //
    // This returned `'student'` until 2026-07-31, on the reasoning that it was
    // the least-privileged nav. In an office product it is not less privileged,
    // it is a *different product*: `student` routed `/` to the fabricated
    // CampusDashboard, so a roleless corporate user was shown invented campus
    // metrics. `staff` is the real floor here — the least-privileged role that
    // actually exists in an office organisation.
    if (!userRoles || userRoles.length === 0) return 'staff';

    const normalized = userRoles.map(r => r.name.toLowerCase());
    for (const { legacy, matchNames } of ROLE_PRIORITY) {
        if (matchNames.some(name => normalized.includes(name))) {
            return legacy;
        }
    }
    // A real role name that isn't in the map above (a custom/renamed org role,
    // or a new DB role added without updating ROLE_PRIORITY) should not be
    // silently treated as a student — that's a bigger privilege downgrade than
    // an unmapped name warrants. Fall back to generic staff instead.
    return 'staff';
}

export function RoleProvider({ children }: { children: any }) {
    const { user } = useAuth();
    const role = deriveLegacyRole(user?.roles);

    const value = {
        role,
        isSuperAdmin: role === 'super_admin',
        isOrgAdmin: role === 'org_admin',
        isManager: role === 'manager',
        isStaff: role === 'staff',
        isStudent: role === 'student',
    };

    return (
        <RoleContext.Provider value={value}>
            {children}
        </RoleContext.Provider>
    );
}

export function useRole() {
    const context = useContext(RoleContext);
    if (context === undefined) {
        throw new Error('useRole must be used within a RoleProvider');
    }
    return context;
}
