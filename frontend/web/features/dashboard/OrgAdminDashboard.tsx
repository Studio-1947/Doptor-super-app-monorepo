"use client";

import Link from 'next/link';
import { ClipboardList, CheckSquare, Users, Building2 } from 'lucide-react';
import { analyticsService } from '@/services/analytics.service';
import { documentsService } from '@/services/documents.service';
import { useAsync } from './useAsync';
import { SetupChecklist } from './SetupChecklist';
import {
    PageHeading, StatTile, Panel, EmptyState, LoadingRows, ErrorNote, QuickAction,
} from './DashboardPrimitives';

export function OrgAdminDashboard() {
    const stats = useAsync(() => analyticsService.getOverview());
    const pending = useAsync(() => documentsService.list({ status: 'pending_review' }));

    return (
        <div className="space-y-6">
            <PageHeading
                title="Organisation Overview"
                subtitle="Manage your organisation's tasks, approvals, and departments."
            />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatTile
                    title="Pending Approvals"
                    value={stats.data?.documentsPendingReview ?? null}
                    icon={CheckSquare}
                    tone="amber"
                    href="/documents"
                />
                <StatTile
                    title="Open Tasks"
                    value={stats.data?.openTasks ?? null}
                    icon={ClipboardList}
                    tone="blue"
                    href="/tasks"
                />
                <StatTile
                    title="Total Staff"
                    value={stats.data?.totalUsers ?? null}
                    icon={Users}
                    tone="indigo"
                    href="/office/team"
                />
                <StatTile
                    title="Departments"
                    value={stats.data?.totalDepartments ?? null}
                    icon={Building2}
                    tone="emerald"
                    href="/admin/departments"
                />
            </div>

            {stats.error && <ErrorNote message={stats.error} />}

            {/* Renders only while a step is outstanding, so it disappears by itself. */}
            {stats.data && <SetupChecklist stats={stats.data} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Panel
                    title="Pending Approvals"
                    action={{ label: 'View all', href: '/documents' }}
                    className="lg:col-span-2"
                >
                    {pending.loading && <LoadingRows />}
                    {pending.error && <ErrorNote message={pending.error} />}
                    {!pending.loading && !pending.error && (
                        pending.data?.length
                            ? (
                                <div className="space-y-3">
                                    {pending.data.slice(0, 5).map((doc) => (
                                        <Link
                                            key={doc.id}
                                            href="/documents"
                                            className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="w-10 h-10 shrink-0 rounded-none bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 border border-transparent dark:border-slate-700">
                                                    {initials(doc.uploadedBy)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                        {doc.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                        {fullName(doc.uploadedBy)}
                                                        {doc.category ? ` • ${doc.category}` : ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-none border border-primary-100 dark:border-primary-800">
                                                Review
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )
                            : <EmptyState message="Nothing is waiting for approval." />
                    )}
                </Panel>

                <Panel title="Quick Actions">
                    <div className="grid grid-cols-2 gap-3">
                        <QuickAction label="Invite User" href="/office/team" />
                        <QuickAction label="New Dept" href="/admin/departments" />
                        <QuickAction label="Roles" href="/admin/roles" />
                        <QuickAction label="Settings" href="/admin/settings" />
                    </div>
                </Panel>
            </div>
        </div>
    );
}

function fullName(user?: { first_name: string; last_name: string } | null): string {
    if (!user) return 'Unknown user';
    return `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'Unknown user';
}

function initials(user?: { first_name: string; last_name: string } | null): string {
    if (!user) return '—';
    const value = `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
    return value || '—';
}
