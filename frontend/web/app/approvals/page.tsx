"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ReadyUI } from '@/components/ReadyUI';
import { CheckSquare, Clock, FileCheck, CalendarClock, Loader2, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAsync } from '@/features/dashboard/useAsync';
import { EmptyState, ErrorNote, LoadingRows } from '@/features/dashboard/DashboardPrimitives';
import { documentsService, OfficeDocument } from '@/services/documents.service';
import { attendanceService, LeaveRequest } from '@/services/attendance.service';

/**
 * The approvals centre — everything waiting on this user, in one place.
 *
 * Previously invented all of it: "Pending Approvals 42", "Approved Today 128",
 * "Avg. Decision Time 4.2h", and five fictional requests ("Procurement: New
 * Laptops", "Amit Kumar"). It was linked in the sidebar for three roles, so it
 * was the most-reachable fabricated page in the product.
 *
 * The real data already existed and was already surfaced in miniature by
 * `ManagerDashboard` — this page just never got wired. Two queues back it:
 * documents in `pending_review` (gated on `approve:workflows`) and leave
 * requests in `pending` (gated on `approve:attendance`).
 *
 * Gated on the permission, not the role, for the reason set out in
 * ManagerDashboard: `Manager` and `Department Head` collapse to the same legacy
 * `manager` role in RoleContext, but only Department Head can actually approve.
 * A queue the caller would only get a 403 from is not rendered at all.
 *
 * Two stats from the old page are deliberately not reproduced. "Approved Today"
 * and "Avg. Decision Time" need a decision-history query that no endpoint
 * offers — `reviewed_at` exists per row but nothing aggregates it — so they are
 * absent rather than estimated.
 */

type Busy = { id: string; action: 'approve' | 'reject' } | null;

export default function ApprovalsPage() {
    const { hasPermission } = useAuth();
    const canApproveDocs = hasPermission('approve', 'workflows');
    const canApproveLeave = hasPermission('approve', 'attendance');
    const canApproveAnything = canApproveDocs || canApproveLeave;

    const [busy, setBusy] = useState<Busy>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const docs = useAsync<OfficeDocument[]>(
        () => (canApproveDocs ? documentsService.list({ status: 'pending_review' }) : Promise.resolve([])),
        [canApproveDocs],
    );
    const leave = useAsync<LeaveRequest[]>(
        () => (canApproveLeave ? attendanceService.orgLeave('pending') : Promise.resolve([])),
        [canApproveLeave],
    );

    const docCount = canApproveDocs ? docs.data?.length ?? null : null;
    const leaveCount = canApproveLeave ? leave.data?.length ?? null : null;
    const loading = docs.loading || leave.loading;
    const total =
        docCount === null && leaveCount === null ? null : (docCount ?? 0) + (leaveCount ?? 0);

    const act = async (
        kind: 'document' | 'leave',
        id: string,
        action: 'approve' | 'reject',
    ) => {
        setBusy({ id, action });
        setActionError(null);
        try {
            if (kind === 'document') {
                await (action === 'approve'
                    ? documentsService.approve(id)
                    : documentsService.reject(id));
                docs.reload();
            } else {
                await (action === 'approve'
                    ? attendanceService.approveLeave(id)
                    : attendanceService.rejectLeave(id));
                leave.reload();
            }
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : `Could not ${action} this request.`,
            );
        } finally {
            setBusy(null);
        }
    };

    const n = (value: number | null) => (value === null ? '-' : String(value));
    const stats = [
        {
            label: 'Waiting On You',
            value: n(loading ? null : total),
            icon: Clock,
            color: 'bg-orange-500',
        },
        {
            label: 'Documents',
            value: canApproveDocs ? n(docs.loading ? null : docCount) : 'n/a',
            icon: FileCheck,
            color: 'bg-indigo-500',
        },
        {
            label: 'Leave Requests',
            value: canApproveLeave ? n(leave.loading ? null : leaveCount) : 'n/a',
            icon: CalendarClock,
            color: 'bg-emerald-500',
        },
        {
            label: 'Your Approval Rights',
            value: [canApproveDocs && 'Docs', canApproveLeave && 'Leave']
                .filter(Boolean)
                .join(' + ') || 'None',
            icon: CheckSquare,
            color: 'bg-slate-500',
        },
    ] as any[];

    return (
        <ReadyUI
            title="Approvals"
            description="Documents and leave requests waiting on your decision."
            moduleName="Office"
            stats={stats}
        >
            <div className="w-full text-left space-y-8">
                {!canApproveAnything ? (
                    <div className="flex flex-col items-center gap-3 py-12 text-center">
                        <Lock size={24} className="text-slate-400" />
                        <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            You don&apos;t hold any approval permissions.
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                            Approving documents needs <code>approve:workflows</code> and approving
                            leave needs <code>approve:attendance</code>. A Department Head or
                            Organisation Admin can grant these from Roles &amp; Permissions.
                        </p>
                    </div>
                ) : (
                    <>
                        {actionError && <ErrorNote message={actionError} />}

                        {canApproveDocs && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        Documents Pending Review
                                    </h3>
                                    <Link
                                        href="/documents"
                                        className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        All documents
                                    </Link>
                                </div>

                                {docs.error ? (
                                    <ErrorNote message={docs.error} />
                                ) : docs.loading ? (
                                    <LoadingRows count={2} />
                                ) : !docs.data?.length ? (
                                    <EmptyState message="No documents are waiting for review." />
                                ) : (
                                    <div className="divide-y divide-slate-100 border border-slate-200 dark:border-slate-700">
                                        {docs.data.map((doc) => (
                                            <Row
                                                key={doc.id}
                                                title={doc.name}
                                                subtitle={[
                                                    doc.uploadedBy
                                                        ? `${doc.uploadedBy.first_name ?? ''} ${doc.uploadedBy.last_name ?? ''}`.trim()
                                                          || doc.uploadedBy.email
                                                        : 'Unknown uploader',
                                                    doc.category,
                                                    doc.submitted_at
                                                        ? new Date(doc.submitted_at).toLocaleDateString()
                                                        : null,
                                                ].filter(Boolean).join(' · ')}
                                                busy={busy?.id === doc.id ? busy.action : null}
                                                onApprove={() => act('document', doc.id, 'approve')}
                                                onReject={() => act('document', doc.id, 'reject')}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}

                        {canApproveLeave && (
                            <section className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                        Leave Requests Pending
                                    </h3>
                                    <Link
                                        href="/attendance"
                                        className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:underline"
                                    >
                                        Attendance
                                    </Link>
                                </div>

                                {leave.error ? (
                                    <ErrorNote message={leave.error} />
                                ) : leave.loading ? (
                                    <LoadingRows count={2} />
                                ) : !leave.data?.length ? (
                                    <EmptyState message="No leave requests are waiting." />
                                ) : (
                                    <div className="divide-y divide-slate-100 border border-slate-200 dark:border-slate-700">
                                        {leave.data.map((req) => (
                                            <Row
                                                key={req.id}
                                                title={
                                                    req.user
                                                        ? `${req.user.first_name ?? ''} ${req.user.last_name ?? ''}`.trim()
                                                          || req.user.email
                                                        : 'Unknown member'
                                                }
                                                subtitle={[
                                                    req.leaveType?.name,
                                                    `${req.days} ${req.days === 1 ? 'day' : 'days'}`,
                                                    `${req.start_date} → ${req.end_date}`,
                                                    req.reason,
                                                ].filter(Boolean).join(' · ')}
                                                busy={busy?.id === req.id ? busy.action : null}
                                                onApprove={() => act('leave', req.id, 'approve')}
                                                onReject={() => act('leave', req.id, 'reject')}
                                            />
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </div>
        </ReadyUI>
    );
}

function Row({
    title, subtitle, busy, onApprove, onReject,
}: {
    title: string;
    subtitle: string;
    busy: 'approve' | 'reject' | null;
    onApprove: () => void;
    onReject: () => void;
}) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
            <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">{title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <button
                    onClick={onReject}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                >
                    {busy === 'reject' && <Loader2 size={12} className="animate-spin" />}
                    Reject
                </button>
                <button
                    onClick={onApprove}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 disabled:opacity-50"
                >
                    {busy === 'approve' && <Loader2 size={12} className="animate-spin" />}
                    Approve
                </button>
            </div>
        </div>
    );
}
