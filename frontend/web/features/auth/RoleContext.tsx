"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/services/auth.service';

export { type UserRole };

interface RoleContextType {
    role: UserRole;
    setRole: (role: UserRole) => void;
    isSuperAdmin: boolean;
    isOrgAdmin: boolean;
    isManager: boolean;
    isStaff: boolean;
    isStudent: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated } = useAuth();
    // Default to 'super_admin' if not authenticated or role is missing (fallback/dev mode)
    // In production, this should likely default to a 'guest' state or redirect
    const [role, setRole] = useState<UserRole>('super_admin');

    useEffect(() => {
        if (user?.role) {
            setRole(user.role);
        }
    }, [user]);

    const value = {
        role,
        setRole,
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
