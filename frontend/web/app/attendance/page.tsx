"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Clock, LogIn, LogOut, Loader2, Plus, Check, X, Ban,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
    attendanceService,
    AttendanceRecord,
    LeaveBalance,
    LeaveRequest,
    LeaveType,
} from "@/services/attendance.service";

const statusChip: Record<string, string> = {
    pending: "text-amber-600 border-amber-100 bg-amber-50",
    approved: "text-emerald-600 border-emerald-100 bg-emerald-50",
    rejected: "text-rose-600 border-rose-100 bg-rose-50",
    cancelled: "text-slate-500 border-slate-100 bg-slate-50",
    present: "text-emerald-600 border-emerald-100 bg-emerald-50",
    late: "text-orange-600 border-orange-100 bg-orange-50",
};

function fmtTime(iso: string | null): string {
    if (!iso) return "—";
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AttendancePage() {
    const { hasPermission } = useAuth();
    const canApprove = hasPermission("approve", "attendance");

    const [today, setToday] = useState<AttendanceRecord | null>(null);
    const [balances, setBalances] = useState<LeaveBalance[]>([]);
    const [myLeave, setMyLeave] = useState<LeaveRequest[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [queue, setQueue] = useState<LeaveRequest[]>([]);
    const [tab, setTab] = useState<"mine" | "approvals">("mine");
    const [punching, setPunching] = useState(false);
    const [loading, setLoading] = useState(true);

    // request form
    const [showForm, setShowForm] = useState(false);
    const [formType, setFormType] = useState("");
    const [formStart, setFormStart] = useState("");
    const [formEnd, setFormEnd] = useState("");
    const [formReason, setFormReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadMine = useCallback(() => {
        attendanceService.today().then(setToday).catch(() => setToday(null));
        attendanceService.myBalances().then(setBalances).catch(() => setBalances([]));
        attendanceService.myLeave().then(setMyLeave).catch(() => setMyLeave([]));
        attendanceService.listLeaveTypes().then(setLeaveTypes).catch(() => setLeaveTypes([]));
    }, []);

    const loadQueue = useCallback(() => {
        if (!canApprove) return;
        attendanceService.orgLeave("pending").then(setQueue).catch(() => setQueue([]));
    }, [canApprove]);

    useEffect(() => {
        Promise.resolve().then(loadMine).finally(() => setLoading(false));
        loadQueue();
    }, [loadMine, loadQueue]);

    const punch = async (dir: "in" | "out") => {
        setPunching(true);
        try {
            const rec = dir === "in"
                ? await attendanceService.checkIn()
                : await attendanceService.checkOut();
            setToday(rec);
            toast.success(dir === "in" ? "Checked in" : "Checked out");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || `Failed to check ${dir}`);
        } finally {
            setPunching(false);
        }
    };

    const submitLeave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formType || !formStart || !formEnd) {
            toast.error("Pick a leave type and a date range");
            return;
        }
        setSubmitting(true);
        try {
            await attendanceService.submitLeave({
                leave_type_id: formType,
                start_date: formStart,
                end_date: formEnd,
                reason: formReason || undefined,
            });
            toast.success("Leave request submitted");
            setShowForm(false);
            setFormType(""); setFormStart(""); setFormEnd(""); setFormReason("");
            loadMine();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to submit leave");
        } finally {
            setSubmitting(false);
        }
    };

    const review = async (id: string, action: "approve" | "reject") => {
        try {
            if (action === "approve") await attendanceService.approveLeave(id);
            else await attendanceService.rejectLeave(id);
            toast.success(`Request ${action}d`);
            loadQueue();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || `Failed to ${action}`);
        }
    };

    const cancelMine = async (id: string) => {
        try {
            await attendanceService.cancelLeave(id);
            toast.success("Request cancelled");
            loadMine();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to cancel");
        }
    };

    const checkedIn = Boolean(today?.check_in);
    const checkedOut = Boolean(today?.check_out);

    return (
        <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Attendance & Leave</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Punch in, track your leave, and manage requests.</p>
            </div>

            {/* Punch card */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-none bg-primary-50 dark:bg-primary-900/20 text-primary-600 flex items-center justify-center">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                            {checkedIn ? `Checked in at ${fmtTime(today!.check_in)}` : "Not checked in"}
                            {checkedOut && ` · out at ${fmtTime(today!.check_out)}`}
                        </p>
                        <p className="text-xs text-slate-400">
                            {new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
                            {today?.status && ` · ${today.status}`}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => punch("in")}
                        disabled={punching || checkedIn}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest bg-primary-600 text-white disabled:opacity-40 disabled:pointer-events-none hover:bg-primary-700 transition-colors"
                    >
                        {punching ? <Loader2 size={16} className="animate-spin" /> : <LogIn size={16} />} Check in
                    </button>
                    <button
                        onClick={() => punch("out")}
                        disabled={punching || !checkedIn || checkedOut}
                        className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white disabled:opacity-40 disabled:pointer-events-none hover:border-primary-500 transition-colors"
                    >
                        <LogOut size={16} /> Check out
                    </button>
                </div>
            </div>

            {/* Balances */}
            <div>
                <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Leave Balances</h2>
                {balances.length === 0 ? (
                    <p className="text-sm text-slate-400">No leave allocated yet.</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {balances.map((b) => (
                            <div key={b.id} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900">
                                <p className="text-xs font-bold truncate" style={{ color: b.leaveType?.color }}>
                                    {b.leaveType?.name ?? "Leave"}
                                </p>
                                <p className="text-2xl font-black text-slate-900 dark:text-white">
                                    {b.allocated - b.used}
                                    <span className="text-xs font-medium text-slate-400"> / {b.allocated}</span>
                                </p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">days left</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setTab("mine")}
                    className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 ${tab === "mine" ? "text-primary-600 border-primary-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
                >
                    My Leave
                </button>
                {canApprove && (
                    <button
                        onClick={() => setTab("approvals")}
                        className={`px-4 py-2 text-xs font-black uppercase tracking-widest border-b-2 inline-flex items-center gap-2 ${tab === "approvals" ? "text-primary-600 border-primary-500" : "text-slate-400 border-transparent hover:text-slate-600"}`}
                    >
                        Approvals
                        {queue.length > 0 && (
                            <span className="bg-primary-500 text-white text-[9px] font-black px-1.5 rounded-full">{queue.length}</span>
                        )}
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
            ) : tab === "mine" ? (
                <div className="space-y-3">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowForm((s) => !s)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-black uppercase tracking-widest bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                        >
                            <Plus size={14} /> Request leave
                        </button>
                    </div>

                    {showForm && (
                        <form onSubmit={submitLeave} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 grid sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Type</label>
                                <select value={formType} onChange={(e) => setFormType(e.target.value)}
                                    className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800">
                                    <option value="">Select…</option>
                                    {leaveTypes.map((lt) => <option key={lt.id} value={lt.id}>{lt.name}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">From</label>
                                    <input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)}
                                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">To</label>
                                    <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)}
                                        className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800" />
                                </div>
                            </div>
                            <input value={formReason} onChange={(e) => setFormReason(e.target.value)} placeholder="Reason (optional)"
                                className="sm:col-span-2 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-800" />
                            <div className="sm:col-span-2 flex justify-end">
                                <button type="submit" disabled={submitting}
                                    className="px-4 py-2 text-xs font-black uppercase tracking-widest bg-primary-600 text-white disabled:opacity-40 hover:bg-primary-700 transition-colors">
                                    {submitting ? "Submitting…" : "Submit"}
                                </button>
                            </div>
                        </form>
                    )}

                    {myLeave.length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">No leave requests yet.</p>
                    ) : (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-50 dark:divide-slate-800">
                            {myLeave.map((r) => (
                                <div key={r.id} className="p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {r.leaveType?.name ?? "Leave"} · {r.days} day(s)
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {r.start_date} → {r.end_date}{r.reason ? ` · ${r.reason}` : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 border ${statusChip[r.status] ?? ""}`}>
                                            {r.status}
                                        </span>
                                        {(r.status === "pending" || r.status === "approved") && (
                                            <button onClick={() => cancelMine(r.id)} title="Cancel"
                                                className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors">
                                                <Ban size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {queue.length === 0 ? (
                        <p className="text-sm text-slate-400 py-6 text-center">No pending requests.</p>
                    ) : (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-50 dark:divide-slate-800">
                            {queue.map((r) => (
                                <div key={r.id} className="p-3 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                            {r.user ? `${r.user.first_name} ${r.user.last_name}` : "Employee"} · {r.leaveType?.name} · {r.days} day(s)
                                        </p>
                                        <p className="text-xs text-slate-400">
                                            {r.start_date} → {r.end_date}{r.reason ? ` · ${r.reason}` : ""}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <button onClick={() => review(r.id, "approve")}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                                            <Check size={13} /> Approve
                                        </button>
                                        <button onClick={() => review(r.id, "reject")}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-rose-500 hover:text-rose-600 transition-colors">
                                            <X size={13} /> Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
