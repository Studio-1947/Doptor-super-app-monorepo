"use client";

import { useRole } from '@/features/auth/RoleContext';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { OrgAdminDashboard } from './OrgAdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { StaffDashboard } from './StaffDashboard';
import { StudentDashboard } from './StudentDashboard';

export function DashboardContainer() {
    const { role } = useRole();

    switch (role) {
        case 'super_admin':
            return <SuperAdminDashboard />;
        case 'org_admin':
            return <OrgAdminDashboard />;
        case 'manager':
            return <ManagerDashboard />;
        case 'staff':
            return <StaffDashboard />;
        case 'student':
            return <StudentDashboard />;
        default:
            return <OrgAdminDashboard />;
    }
}
