"use client";

import { useRole } from '@/features/auth/RoleContext';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { OrgAdminDashboard } from './OrgAdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { StaffDashboard } from './StaffDashboard';

/**
 * Picks the dashboard for `/`. **Every branch is an Office dashboard**, because
 * Office is the only product that ships — Doptor is an office-management suite
 * for corporates and other working offices, and there are no students in it.
 *
 * This used to route `student` (and Manager/Staff in a campus-only org) to
 * `CampusDashboard`, which is a fabricated page: hardcoded "Attendance Health
 * 92% / Exam Readiness 78% / Enrollment Rate 84%" and three invented campus
 * alerts. An office user could land on it and see a page of numbers that came
 * from nowhere.
 *
 * Two things let that happen, and both are now closed:
 *   1. `deriveLegacyRole()` returned `'student'` for any account whose roles
 *      had not loaded or were empty — so a *roleless* office user got another
 *      product's home page. It now falls back to `staff`.
 *   2. This switch treated `student` as campus-by-definition and skipped the
 *      `enabledVerticals` check that guarded every other role.
 *
 * There is no `student` role in the database. Across every organisation the
 * roles are Organisation Admin, Manager, Department Head, Staff, Auditor and
 * HR Manager — `'student'` only ever existed in the frontend's legacy role
 * shim. Route-blocking `/campus` did not help here either: the *route* is
 * gated, but this rendered the campus *component* at `/`.
 *
 * If Campus is ever un-frozen, the vertical split goes back here — read
 * `enabledVerticals` and branch, rather than inferring a product from a role.
 */
export function DashboardContainer() {
    const { role } = useRole();

    switch (role) {
        case 'super_admin':
            return <SuperAdminDashboard />;
        case 'org_admin':
            return <OrgAdminDashboard />;
        case 'manager':
            return <ManagerDashboard />;
        default:
            // Staff, and anything unmapped. Deliberately the least-privileged
            // *office* dashboard rather than an error page: its panels ask for
            // the caller's own tasks and attendance, so a user with thin
            // permissions sees an honest empty or error state, not a 404.
            return <StaffDashboard />;
    }
}
