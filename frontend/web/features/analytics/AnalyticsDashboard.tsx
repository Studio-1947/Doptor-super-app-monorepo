"use client";

import {
    BarChart3, Building2, CalendarDays, CheckSquare, ClipboardList,
    FileText, FileCheck2, UserCheck, Users,
} from 'lucide-react';
import { analyticsService } from '@/services/analytics.service';
import { useAsync } from '../dashboard/useAsync';
import { PageHeading, StatTile, ErrorNote } from '../dashboard/DashboardPrimitives';

/**
 * The full read-out of `GET /analytics/overview`. The role dashboards at `/`
 * each surface a tailored subset of the same nine counts; this page is the only
 * place all nine appear together, which is the reason it exists separately.
 *
 * Every tile is a real server-side count. There is deliberately no "system
 * status" panel: the only health signal the API exposes is a static
 * `{status:"ok"}` that checks nothing, so a green light here would assert
 * something nothing measured. See the note in `services/analytics.service.ts`.
 */
export function AnalyticsDashboard() {
    const stats = useAsync(() => analyticsService.getOverview());

    // `null` while loading renders StatTile's skeleton. Passing `?? null` rather
    // than `?? 0` matters: a real zero (new org) and a pending request must not
    // look the same, and neither may look like data on failure.
    const value = (n: number | undefined) => (stats.loading ? null : n ?? null);

    return (
        <div className="space-y-6">
            <PageHeading
                title="Analytics Overview"
                subtitle="Live counts across your organisation."
            />

            {stats.error && <ErrorNote message={stats.error} />}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile
                    title="Total Members"
                    value={value(stats.data?.totalUsers)}
                    icon={Users}
                    tone="blue"
                    href="/office/team"
                />
                <StatTile
                    title="Total Tasks"
                    value={value(stats.data?.totalTasks)}
                    icon={CheckSquare}
                    tone="emerald"
                    href="/tasks"
                />
                <StatTile
                    title="Registry Files"
                    value={value(stats.data?.totalFiles)}
                    icon={BarChart3}
                    tone="indigo"
                    href="/office/files"
                />
                <StatTile
                    title="Documents"
                    value={value(stats.data?.totalDocuments)}
                    icon={FileText}
                    tone="amber"
                    href="/documents"
                />
            </div>

            <div className="space-y-4">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                    Organisation Operations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <StatTile
                        title="Departments"
                        value={value(stats.data?.totalDepartments)}
                        icon={Building2}
                        tone="slate"
                        href="/admin/departments"
                    />
                    <StatTile
                        title="Open Tasks"
                        value={value(stats.data?.openTasks)}
                        icon={ClipboardList}
                        tone="blue"
                        href="/tasks"
                    />
                    <StatTile
                        title="Pending Review"
                        value={value(stats.data?.documentsPendingReview)}
                        icon={FileCheck2}
                        tone="amber"
                        href="/documents"
                    />
                    <StatTile
                        title="Checked In Today"
                        value={value(stats.data?.currentlyCheckedIn)}
                        icon={UserCheck}
                        tone="emerald"
                        href="/attendance"
                    />
                    <StatTile
                        title="Pending Leave"
                        value={value(stats.data?.pendingLeaveRequests)}
                        icon={CalendarDays}
                        tone="indigo"
                        href="/approvals"
                    />
                </div>
            </div>
        </div>
    );
}
