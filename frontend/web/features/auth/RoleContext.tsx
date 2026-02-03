"use client";

import { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'super_admin' | 'org_admin' | 'manager' | 'staff' | 'student';

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
    // Default to super_admin for development
    const [role, setRole] = useState<UserRole>('super_admin');

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
