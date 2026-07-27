"use client";

import { Building2, Users, ClipboardList, FileText } from 'lucide-react';
import { analyticsService } from '@/services/analytics.service';
import { useAsync } from './useAsync';
import {
    PageHeading, StatTile, Panel, EmptyState, ErrorNote, QuickAction,
} from './DashboardPrimitives';

/**
 * Super Admin currently sees their **own organisation's** real figures.
 *
 * This used to display invented platform-wide numbers (142 organisations,
 * 8,234 users, a 99.9% "system health", and fictional "TechCorp Solutions"
 * rows). There is no cross-organisation analytics endpoint to replace them
 * with — `/analytics/overview` is deliberately scoped to the caller's own org,
 * and adding a platform-wide one deserves its own tenancy review given that
 * unscoped platform queries are exactly what backlog C-11 was. So the honest
 * position is to show what's real and say plainly what isn't built, rather
 * than keep numbers that look authoritative and aren't.
 */
export function SuperAdminDashboard() {
    const stats = useAsync(() => analyticsService.getOverview());

    return (
        <div className="space-y-6">
            <PageHeading
                title="Super Admin Overview"
                subtitle="Figures below are for your own organisation."
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile
                    title="Users"
                    value={stats.data?.totalUsers ?? null}
                    icon={Users}
                    tone="indigo"
                    href="/office/team"
                />
                <StatTile
                    title="Departments"
                    value={stats.data?.totalDepartments ?? null}
                    icon={Building2}
                    tone="blue"
                    href="/admin/departments"
                />
                <StatTile
                    title="Open Tasks"
                    value={stats.data?.openTasks ?? null}
                    icon={ClipboardList}
                    tone="emerald"
                    href="/tasks"
                />
                <StatTile
                    title="Files"
                    value={stats.data?.totalFiles ?? null}
                    icon={FileText}
                    tone="amber"
                    href="/office/registry"
                />
            </div>

            {stats.error && <ErrorNote message={stats.error} />}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Panel title="Platform-wide metrics">
                    <EmptyState
                        message="Cross-organisation totals and system health aren't available yet — they need a platform-scoped analytics endpoint, which doesn't exist. Nothing is shown here rather than an estimate."
                    />
                </Panel>

                <Panel title="Administration">
                    <div className="grid grid-cols-2 gap-3">
                        <QuickAction label="Departments" href="/admin/departments" />
                        <QuickAction label="Roles" href="/admin/roles" />
                        <QuickAction label="Settings" href="/admin/settings" />
                        <QuickAction label="Team" href="/office/team" />
                    </div>
                </Panel>
            </div>
        </div>
    );
}
