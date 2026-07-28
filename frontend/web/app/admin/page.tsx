"use client";

import Link from 'next/link';
import { Building2, Shield, Settings, Users, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAsync } from '@/features/dashboard/useAsync';
import {
    PageHeading,
    StatTile,
    Panel,
    ErrorNote,
} from '@/features/dashboard/DashboardPrimitives';
import { analyticsService } from '@/services/analytics.service';
import { roleService } from '@/services/role.service';

/**
 * The administration landing page.
 *
 * This route did not exist. `/admin/departments`, `/admin/roles` and
 * `/admin/settings` all did, and `RoleGuard` redirects a denied user to their
 * area root — so every unauthorised visit to an admin page landed on a 404
 * (backlog M-15, which recorded it only as stray prefetch noise). Next also
 * prefetches the bare root from the sidebar links, which is where the console
 * 404s came from.
 *
 * Counts come from `/analytics/overview`, the same already-real endpoint the
 * role dashboards use, so this page cannot drift into its own set of literals.
 */

function AreaCard({
    title, description, href, icon: Icon, detail,
}: {
    title: string;
    description: string;
    href: string;
    icon: LucideIcon;
    detail: string;
}) {
    return (
        <Link
            href={href}
            className="group flex items-start gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-500 transition-colors"
        >
            <div className="p-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800">
                <Icon size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{title}</h3>
                    <ChevronRight
                        size={14}
                        className="text-slate-400 group-hover:translate-x-1 transition-transform"
                    />
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{description}</p>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3">
                    {detail}
                </p>
            </div>
        </Link>
    );
}

export default function AdminHomePage() {
    const overview = useAsync(() => analyticsService.getOverview(), []);
    const roles = useAsync(() => roleService.getAll(), []);

    const stats = overview.data;
    const roleCount = roles.loading ? null : (roles.data ?? []).length;

    const countLabel = (value: number | null, singular: string, plural: string) =>
        value === null ? 'Loading…' : `${value} ${value === 1 ? singular : plural}`;

    return (
        <div className="space-y-8">
            <PageHeading
                title="Administration"
                subtitle="Organisation structure, access control and settings."
            />

            {overview.error && <ErrorNote message={overview.error} />}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatTile
                    title="Departments"
                    value={stats ? stats.totalDepartments : null}
                    icon={Building2}
                    tone="indigo"
                    href="/admin/departments"
                />
                <StatTile
                    title="Roles"
                    value={roleCount}
                    icon={Shield}
                    tone="emerald"
                    href="/admin/roles"
                />
                <StatTile
                    title="Members"
                    value={stats ? stats.totalUsers : null}
                    icon={Users}
                    tone="blue"
                    href="/office/team"
                />
                <StatTile
                    title="Open Tasks"
                    value={stats ? stats.openTasks : null}
                    icon={Settings}
                    tone="amber"
                    href="/tasks"
                />
            </div>

            <Panel title="Manage">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <AreaCard
                        title="Departments"
                        description="Structure, heads of department and task reference prefixes."
                        href="/admin/departments"
                        icon={Building2}
                        detail={countLabel(
                            stats ? stats.totalDepartments : null,
                            'department',
                            'departments',
                        )}
                    />
                    <AreaCard
                        title="Roles & Permissions"
                        description="What each role in the organisation is allowed to do."
                        href="/admin/roles"
                        icon={Shield}
                        detail={countLabel(roleCount, 'role', 'roles')}
                    />
                    <AreaCard
                        title="Organisation"
                        description="Name, slug and the verticals this organisation has enabled."
                        href="/admin/settings"
                        icon={Settings}
                        detail="Organisation record"
                    />
                </div>
            </Panel>
        </div>
    );
}
