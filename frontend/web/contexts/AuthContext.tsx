'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, User, LoginCredentials, RegisterData, RegisterOrganisationData } from '../services/auth.service';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    registerOrganisation: (data: RegisterOrganisationData) => Promise<void>;
    acceptInvite: (token: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    hasRole: (role: string) => boolean;
    hasAnyRole: (roles: string[]) => boolean;
    hasPermission: (action: string, resource: string) => boolean;
    hasAllPermissions: (permissions: Array<{ action: string; resource: string }>) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user on mount
    useEffect(() => {
        loadUser();
    }, []);

    // The session lives in httpOnly cookies, so there is nothing readable to
    // check before asking. The server is the only thing that knows, and this is
    // how we ask it.
    //
    // A 401 here is the ordinary signed-out case — every visitor to /login hits
    // it — so it is not logged as an error. It used to be guarded by a
    // synchronous `isAuthenticated()` reading localStorage, which is exactly the
    // readable credential that has been removed.
    const loadUser = async () => {
        try {
            const currentUser = await authService.getCurrentUser();
            setUser(currentUser);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (credentials: LoginCredentials) => {
        try {
            const response = await authService.login(credentials);
            setUser(response.user);
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const register = async (data: RegisterData) => {
        try {
            const response = await authService.register(data);
            setUser(response.user);
        } catch (error) {
            console.error('Registration failed:', error);
            throw error;
        }
    };

    const registerOrganisation = async (data: RegisterOrganisationData) => {
        try {
            const response = await authService.registerOrganisation(data);
            setUser(response.user);
        } catch (error) {
            console.error('Organisation Registration failed:', error);
            throw error;
        }
    };

    const acceptInvite = async (token: string, password: string, firstName?: string, lastName?: string) => {
        try {
            const response = await authService.acceptInvite(token, password, firstName, lastName);
            setUser(response.user);
        } catch (error) {
            console.error('Accept invite failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            console.error('Logout failed:', error);
        } finally {
            setUser(null);
        }
    };

    const refreshUser = async () => {
        await loadUser();
    };

    // Role and permission helpers
    const hasRole = (role: string): boolean => {
        if (!user || !user.roles) return false;
        return user.roles.some(r => r.name === role);
    };

    const hasAnyRole = (roles: string[]): boolean => {
        if (!user || !user.roles) return false;
        return roles.some(role => user.roles!.some(r => r.name === role));
    };

    const hasPermission = (action: string, resource: string): boolean => {
        if (!user || !user.permissions) return false;
        return user.permissions.some(
            p => p.action === action && p.resource === resource
        );
    };

    const hasAllPermissions = (permissions: Array<{ action: string; resource: string }>): boolean => {
        if (!user || !user.permissions) return false;
        return permissions.every(perm =>
            user.permissions!.some(
                p => p.action === perm.action && p.resource === perm.resource
            )
        );
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        registerOrganisation,
        acceptInvite,
        logout,
        refreshUser,
        hasRole,
        hasAnyRole,
        hasPermission,
        hasAllPermissions,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
