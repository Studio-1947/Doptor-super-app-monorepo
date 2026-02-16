import { UserRole } from '@/features/auth/RoleContext';
import { redirect } from 'next/navigation';

/**
 * Higher-Order Component for role-based page protection
 * Wraps page components to enforce access control
 */

interface WithRoleProtectionOptions {
    allowedRoles: UserRole[];
    redirectTo?: string;
}

export function withRoleProtection<P extends object>(
    Component: React.ComponentType<P>,
    options: WithRoleProtectionOptions
) {
    return function ProtectedComponent(props: P) {
        // TODO: Get actual user role from auth context
        // For now, this is a placeholder
        const userRole: UserRole = 'student'; // Replace with actual auth check

        if (!options.allowedRoles.includes(userRole)) {
            redirect(options.redirectTo || '/campus');
        }

        return <Component {...props} />;
    };
}

/**
 * Hook to check if user has access to a route
 */
export function useRouteAccess(allowedRoles: UserRole[]): boolean {
    // TODO: Get actual user role from auth context
    const userRole: UserRole = 'student'; // Replace with actual auth check

    return allowedRoles.includes(userRole);
}
