'use client';

import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { VerticalProvider } from '../contexts/VerticalContext';
import { RoleProvider } from '@/features/auth/RoleContext';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <VerticalProvider>
                <RoleProvider>
                    {children}
                </RoleProvider>
            </VerticalProvider>
        </AuthProvider>
    );
}
