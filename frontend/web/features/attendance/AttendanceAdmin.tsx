"use client";

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Loader2, CalendarDays, Tags } from 'lucide-react';
import { toast } from 'sonner';
import {
    attendanceService, LeaveType, Holiday,
} from '@/services/attendance.service';

/**
 * Admin surface for the two org-level calendars behind leave.
 *
 * Both APIs existed and were permission-gated on `update:attendance`, but
 * neither had a UI — admins had to allocate leave types and (once holidays
 * landed) holidays by calling the API directly, which is not something a real
 * customer can be asked to do.
 *
 * Rendered only for `update:attendance` holders; the caller decides that, since
 * a queue the user would only get a 403 from should not be rendered at all.
 */
export function AttendanceAdmin() {
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [year, setYear] = useState(() => new Date().getFullYear());
    const [loading, setLoading] = useState(true);

    const [typeName, setTypeName] = useState('');
    const [typeQuota, setTypeQuota] = useState('');
    const [savingType, setSavingType] = useState(false);

    const [holidayDate, setHolidayDate] = useState('');
    const [holidayName, setHolidayName] = useState('');
    const [savingHoliday, setSavingHoliday] = useState(false);

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([
            attendanceService.listLeaveTypes().catch(() => [] as LeaveType[]),
            attendanceService.listHolidays(year).catch(() => [] as Holiday[]),
        ])
            .then(([types, hols]) => { setLeaveTypes(types); setHolidays(hols); })
            .finally(() => setLoading(false));
    }, [year]);

    useEffect(() => { load(); }, [load]);

    const addLeaveType = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!typeName.trim()) return;
        setSavingType(true);
        try {
            await attendanceService.createLeaveType({
                name: typeName.trim(),
                default_annual_quota: Number(typeQuota) || 0,
            });
            setTypeName(''); setTypeQuota('');
            toast.success('Leave type created');
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create leave type');
        } finally {
            setSavingType(false);
        }
    };

    const removeLeaveType = async (type: LeaveType) => {
        try {
            await attendanceService.deleteLeaveType(type.id);
            toast.success(`"${type.name}" removed`);
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to remove leave type');
        }
    };

    const addHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!holidayDate || !holidayName.trim()) {
            toast.error('Pick a date and give the holiday a name');
            return;
        }
        setSavingHoliday(true);
        try {
            await attendanceService.createHoliday({
                date: holidayDate,
                name: holidayName.trim(),
            });
            setHolidayDate(''); setHolidayName('');
            toast.success('Holiday added');
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to add holiday');
        } finally {
            setSavingHoliday(false);
        }
    };

    const removeHoliday = async (holiday: Holiday) => {
        try {
            await attendanceService.deleteHoliday(holiday.id);
            toast.success(`"${holiday.name}" removed`);
            load();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to remove holiday');
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center py-10">
                <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
        );
    }

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Leave types */}
            <section className="space-y-3">
                <h3 className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    <Tags size={13} /> Leave Types
                </h3>

                <form onSubmit={addLeaveType} className="flex items-end gap-2">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Name</label>
                        <input
                            value={typeName}
                            onChange={(e) => setTypeName(e.target.value)}
                            placeholder="Casual Leave"
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800"
                        />
                    </div>
                    <div className="w-24">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Days/yr</label>
                        <input
                            type="number"
                            min={0}
                            value={typeQuota}
                            onChange={(e) => setTypeQuota(e.target.value)}
                            placeholder="12"
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={savingType || !typeName.trim()}
                        className="p-2 rounded-lg bg-primary-600 text-white disabled:opacity-40 hover:bg-primary-700 transition-colors"
                    >
                        {savingType ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    </button>
                </form>

                {leaveTypes.length === 0 ? (
                    <p className="text-sm text-slate-400">No leave types yet.</p>
                ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                        {leaveTypes.map((t) => (
                            <div key={t.id} className="p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate" style={{ color: t.color }}>
                                        {t.name}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                        {t.default_annual_quota} day(s) per year
                                        {!t.is_active && ' · inactive'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeLeaveType(t)}
                                    title="Remove"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Holidays */}
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                        <CalendarDays size={13} /> Public Holidays
                    </h3>
                    <select
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs bg-white dark:bg-slate-800"
                    >
                        {[year - 1, year, year + 1].map((y) => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                </div>

                <form onSubmit={addHoliday} className="flex items-end gap-2">
                    <div className="w-36">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Date</label>
                        <input
                            type="date"
                            value={holidayDate}
                            onChange={(e) => setHolidayDate(e.target.value)}
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Name</label>
                        <input
                            value={holidayName}
                            onChange={(e) => setHolidayName(e.target.value)}
                            placeholder="Independence Day"
                            className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-sm bg-white dark:bg-slate-800"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={savingHoliday || !holidayDate || !holidayName.trim()}
                        className="p-2 rounded-lg bg-primary-600 text-white disabled:opacity-40 hover:bg-primary-700 transition-colors"
                    >
                        {savingHoliday ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    </button>
                </form>

                <p className="text-[11px] text-slate-400">
                    Holidays are excluded from leave-day counts. Enter them per year —
                    dates that shift annually are not inferred.
                </p>

                {holidays.length === 0 ? (
                    <p className="text-sm text-slate-400">No holidays recorded for {year}.</p>
                ) : (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-100 dark:divide-slate-800">
                        {holidays.map((h) => (
                            <div key={h.id} className="p-3 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{h.name}</p>
                                    <p className="text-xs text-slate-400">
                                        {new Date(`${String(h.date).slice(0, 10)}T00:00:00`).toLocaleDateString(undefined, {
                                            weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => removeHoliday(h)}
                                    title="Remove"
                                    className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors shrink-0"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
