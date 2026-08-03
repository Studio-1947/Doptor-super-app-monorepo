"use client";

import Link from 'next/link';
import { ClipboardList, Clock, CalendarDays, LogIn, LogOut } from 'lucide-react';
import { tasksService } from '@/services/tasks.service';
import { attendanceService } from '@/services/attendance.service';
import { useAsync } from './useAsync';
import {
    PageHeading, StatTile, Panel, EmptyState, LoadingRows, ErrorNote, QuickAction,
} from './DashboardPrimitives';

/**
 * The Office staff view: my work, my punch state, my leave.
 *
 * Everything here is self-service and scoped to the caller by the API
 * (`/tasks/my-tasks`, `/attendance/today`, `/attendance/leave/my-balances`),
 * so it needs no permissions beyond a valid token.
 */
export function StaffDashboard() {
    const myTasks = useAsync(() => tasksService.getMyTasks());
    const today = useAsync(() => attendanceService.today());
    const balances = useAsync(() => attendanceService.myBalances());

    const openTasks = myTasks.data?.filter((t) => !t.is_completed && !t.is_archived) ?? [];
    const dueSoon = openTasks.filter((t) => isDueWithin(t.due_date, 7));
    const leaveLeft = balances.data
        ? balances.data.reduce((sum, b) => sum + Math.max(0, b.allocated - b.used), 0)
        : null;

    return (
        <div className="space-y-6">
            <PageHeading title="My Work" subtitle="Your tasks, attendance and leave at a glance." />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatTile
                    title="My Open Tasks"
                    value={myTasks.loading ? null : openTasks.length}
                    icon={ClipboardList}
                    tone="blue"
                    href="/tasks"
                />
                <StatTile
                    title="Due This Week"
                    value={myTasks.loading ? null : dueSoon.length}
                    icon={CalendarDays}
                    tone="amber"
                    href="/tasks"
                />
                <StatTile
                    title="Leave Days Left"
                    value={balances.loading ? null : (leaveLeft ?? 0)}
                    icon={Clock}
                    tone="emerald"
                    href="/attendance"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Panel title="My Tasks" action={{ label: 'View all', href: '/tasks' }} className="lg:col-span-2">
                    {myTasks.loading && <LoadingRows />}
                    {myTasks.error && <ErrorNote message={myTasks.error} />}
                    {!myTasks.loading && !myTasks.error && (
                        openTasks.length
                            ? (
                                <div className="space-y-3">
                                    {openTasks.slice(0, 5).map((task) => (
                                        <Link
                                            key={task.id}
                                            href="/tasks"
                                            className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                                    {task.reference ? `${task.reference} · ` : ''}{task.title}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                                    {task.due_date ? `Due ${formatDate(task.due_date)}` : 'No due date'}
                                                </p>
                                            </div>
                                            <span className="shrink-0 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-none border border-slate-200 dark:border-slate-700">
                                                {task.status}
                                            </span>
                                        </Link>
                                    ))}
                                </div>
                            )
                            : <EmptyState message="No open tasks assigned to you." />
                    )}
                </Panel>

                <div className="space-y-6">
                    <Panel title="Today" action={{ label: 'Attendance', href: '/attendance' }}>
                        {today.loading && <LoadingRows count={1} />}
                        {today.error && <ErrorNote message={today.error} />}
                        {!today.loading && !today.error && <PunchState record={today.data} />}
                    </Panel>

                    <Panel title="Quick Actions">
                        <div className="grid grid-cols-2 gap-3">
                            <QuickAction label="My Tasks" href="/tasks" />
                            <QuickAction label="Punch" href="/attendance" />
                            <QuickAction label="Leave" href="/attendance" />
                            <QuickAction label="Documents" href="/documents" />
                        </div>
                    </Panel>
                </div>
            </div>
        </div>
    );
}

/**
 * Reflects the punch record rather than offering to punch — punching needs
 * geolocation and lives on /attendance, and a second entry point would be a
 * second place for the double-punch guard to be surprised by.
 */
function PunchState({ record }: { record: import('@/services/attendance.service').AttendanceRecord | null }) {
    if (!record || !record.check_in) {
        return (
            <div className="flex items-center gap-3 py-2">
                <LogIn size={16} className="text-slate-400" />
                <span className="text-sm text-slate-500 dark:text-slate-400">Not punched in yet today.</span>
            </div>
        );
    }

    return (
        <div className="space-y-2 py-1">
            <div className="flex items-center gap-3">
                <LogIn size={16} className="text-success-600 dark:text-success-400" />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                    In at <strong>{formatTime(record.check_in)}</strong>
                </span>
            </div>
            <div className="flex items-center gap-3">
                <LogOut size={16} className={record.check_out ? 'text-slate-500' : 'text-slate-300 dark:text-slate-600'} />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                    {record.check_out ? <>Out at <strong>{formatTime(record.check_out)}</strong></> : 'Still checked in'}
                </span>
            </div>
            {record.status && (
                <span className="inline-block mt-1 px-2 py-1 text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    {record.status}
                </span>
            )}
        </div>
    );
}

function isDueWithin(dueDate: string | null, days: number): boolean {
    if (!dueDate) return false;
    const due = new Date(dueDate).getTime();
    if (Number.isNaN(due)) return false;
    return due <= Date.now() + days * 24 * 60 * 60 * 1000;
}

function formatDate(value: string): string {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
}

function formatTime(value: string): string {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
