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
const ROLE_PRIORITY: { legacy: UserRole; matchNames: string[] }[] = [
    { legacy: 'super_admin', matchNames: ['super admin'] },
    { legacy: 'org_admin', matchNames: ['organisation admin', 'org admin'] },
    { legacy: 'manager', matchNames: ['manager', 'department head'] },
    { legacy: 'staff', matchNames: ['staff', 'coordinator', 'field worker', 'professor', 'principal', 'volunteer'] },
    { legacy: 'student', matchNames: ['student'] },
];

function deriveLegacyRole(userRoles: Array<{ name: string }> | undefined): UserRole {
    // No roles at all (unauthenticated, or a real account with none assigned)
    // is the only case that should get the least-privileged nav.
    if (!userRoles || userRoles.length === 0) return 'student';

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
