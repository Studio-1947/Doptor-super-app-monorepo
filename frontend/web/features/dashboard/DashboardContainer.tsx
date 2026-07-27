"use client";

import { useRole } from '@/features/auth/RoleContext';
import { useVertical } from '@/contexts/VerticalContext';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { OrgAdminDashboard } from './OrgAdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { StaffDashboard } from './StaffDashboard';
import { StudentDashboard } from './StudentDashboard';

export function DashboardContainer() {
    const { role } = useRole();
    const { enabledVerticals } = useVertical();

    // Manager and Staff exist in both verticals — "Professor" and "Principal"
    // also collapse to `staff` in RoleContext. Which dashboard they get is
    // therefore a property of the organisation, not the role: an office-only
    // org must never land its staff on a campus dashboard, which is what
    // happened before (Manager/Staff/Student all returned <CampusDashboard/>).
    // Office wins when both are enabled, matching Office being the primary product.
    const hasOffice = enabledVerticals.includes('office');
    const campusOnly = !hasOffice && enabledVerticals.includes('campus');

    switch (role) {
        case 'super_admin':
            return <SuperAdminDashboard />;
        case 'org_admin':
            return <OrgAdminDashboard />;
        case 'manager':
            return campusOnly ? <StudentDashboard /> : <ManagerDashboard />;
        case 'staff':
            return campusOnly ? <StudentDashboard /> : <StaffDashboard />;
        case 'student':
            // Students are campus-only by definition; there is no office
            // equivalent to fall back to.
            return <StudentDashboard />;
        default:
            return <OrgAdminDashboard />;
    }
}
