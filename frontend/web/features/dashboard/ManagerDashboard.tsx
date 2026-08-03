"use client";

import Link from 'next/link';
import { ClipboardList, Users, CalendarClock, CheckSquare } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analytics.service';
import { tasksService } from '@/services/tasks.service';
import { documentsService } from '@/services/documents.service';
import { attendanceService } from '@/services/attendance.service';
import { useAsync } from './useAsync';
import {
    PageHeading, StatTile, Panel, EmptyState, LoadingRows, ErrorNote, QuickAction,
} from './DashboardPrimitives';

/**
 * The Office manager view: the team's work, plus an approvals queue for those
 * who can actually act on it.
 *
 * `Manager` and `Department Head` both collapse to the legacy `manager` role in
 * RoleContext, but they differ where it matters — Department Head holds
 * `approve:workflows`/`approve:attendance` and Manager deliberately does not.
 * So the approval panel is gated on the permission, not the role, and a plain
 * Manager never sees a queue they'd only get a 403 from.
 */
export function ManagerDashboard() {
    const { hasPermission } = useAuth();
    const canApproveDocs = hasPermission('approve', 'workflows');
    const canApproveLeave = hasPermission('approve', 'attendance');
    const canApprove = canApproveDocs || canApproveLeave;

    const stats = useAsync(() => analyticsService.getOverview());
    const teamTasks = useAsync(() => tasksService.list({ limit: 5, sort: 'created_at', order: 'desc' }));
    const pendingDocs = useAsync(
        () => (canApproveDocs ? documentsService.list({ status: 'pending_review' }) : Promise.resolve([])),
        [canApproveDocs],
    );
    const pendingLeave = useAsync(
        () => (canApproveLeave ? attendanceService.orgLeave('pending') : Promise.resolve([])),
        [canApproveLeave],
    );

    return (
        <div className="space-y-6">
            <PageHeading title="Team Overview" subtitle="Your team's work and what's waiting on you." />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatTile
                    title="Open Tasks"
                    value={stats.data?.openTasks ?? null}
                    icon={ClipboardList}
                    tone="blue"
                    href="/tasks"
                />
                <StatTile
                    title="Team Members"
                    value={stats.data?.totalUsers ?? null}
                    icon={Users}
                    tone="indigo"
                    href="/office/team"
                />
                <StatTile
                    title="Checked In Today"
                    value={stats.data?.currentlyCheckedIn ?? null}
                    icon={CalendarClock}
                    tone="emerald"
                    href="/attendance"
                />
                <StatTile
                    title={canApprove ? 'Awaiting Approval' : 'Pending Review'}
                    value={
                        stats.data
                            ? stats.data.documentsPendingReview + stats.data.pendingLeaveRequests
                            : null
                    }
                    icon={CheckSquare}
                    tone="amber"
                    href="/documents"
                />
            </div>

            {stats.error && <ErrorNote message={stats.error} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Panel title="Recent Tasks" action={{ label: 'View all', href: '/tasks' }} className="lg:col-span-2">
                    {teamTasks.loading && <LoadingRows />}
                    {teamTasks.error && <ErrorNote message={teamTasks.error} />}
                    {!teamTasks.loading && !teamTasks.error && (
                        teamTasks.data?.data.length
                            ? (
                                <div className="space-y-3">
                                    {teamTasks.data.data.map((task) => (
                                        <Link
                                            key={task.id}
                                            href="/tasks"
                                            className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                    {task.reference ? `${task.reference} · ` : ''}{task.title}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                    {task.assignees.length
                                                        ? task.assignees.map((a) => `${a.first_name} ${a.last_name}`.trim()).join(', ')
                                                        : 'Unassigned'}
                                                </p>
                                            </div>
                                            <span className="shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-none border border-slate-200 dark:border-slate-700">
                                                {task.status}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )
                            : <EmptyState message="No tasks yet." />
                    )}
                </Panel>

                <div className="space-y-6">
                    {canApprove && (
                        <Panel title="Awaiting You">
                            {(pendingDocs.loading || pendingLeave.loading) && <LoadingRows count={2} />}
                            {!pendingDocs.loading && !pendingLeave.loading && (
                                <ApprovalQueue
                                    docs={canApproveDocs ? (pendingDocs.data?.length ?? 0) : null}
                                    leave={canApproveLeave ? (pendingLeave.data?.length ?? 0) : null}
                                />
                            )}
                        </Panel>
                    )}

                    <Panel title="Quick Actions">
                        <div className="grid grid-cols-2 gap-3">
                            <QuickAction label="Tasks" href="/tasks" />
                            <QuickAction label="Team" href="/office/team" />
                            <QuickAction label="Files" href="/office/files" />
                            <QuickAction label="Documents" href="/documents" />
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
}

function ApprovalQueue({ docs, leave }: { docs: number | null; leave: number | null }) {
    if (!docs && !leave) {
        return <EmptyState message="Nothing is waiting on you." />;
    }

    return (
        <div className="space-y-3">
            {docs !== null && docs > 0 && (
                <QueueRow label="Documents to review" count={docs} href="/documents" />
            )}
            {leave !== null && leave > 0 && (
                <QueueRow label="Leave requests" count={leave} href="/attendance" />
            )}
        </div>
    );
}

function QueueRow({ label, count, href }: { label: string; count: number; href: string }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
            <span className="text-sm font-bold text-slate-900 dark:text-white">{label}</span>
            <span className="px-2.5 py-1 text-[10px] font-black bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400 border border-warning-100 dark:border-warning-800">
                {count}
            </span>
        </Link>
    );
}
