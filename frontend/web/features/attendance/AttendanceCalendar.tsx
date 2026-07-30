"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import {
    attendanceService, AttendanceRecord, Holiday,
} from '@/services/attendance.service';

/**
 * Month view of the caller's own attendance.
 *
 * `GET /attendance/me` has served this data since Phase 4 — only the
 * visualisation was missing. Holidays are overlaid from the same calendar that
 * drives leave-day arithmetic, so a day that costs no leave also reads as
 * non-working here rather than as an unexplained absence.
 */

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/** Local YYYY-MM-DD — must not go through toISOString(), which shifts to UTC. */
function isoDate(d: Date): string {
    const m = `${d.getMonth() + 1}`.padStart(2, '0');
    const day = `${d.getDate()}`.padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

/** Monday-based weekday index (0 = Mon … 6 = Sun) to match WEEKDAY_LABELS. */
function mondayIndex(d: Date): number {
    return (d.getDay() + 6) % 7;
}

function fmtTime(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const statusDot: Record<string, string> = {
    present: 'bg-emerald-500',
    late: 'bg-orange-500',
    absent: 'bg-rose-500',
    half_day: 'bg-amber-500',
};

export function AttendanceCalendar() {
    const [cursor, setCursor] = useState(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);

    const monthStart = useMemo(
        () => new Date(cursor.getFullYear(), cursor.getMonth(), 1),
        [cursor],
    );
    const monthEnd = useMemo(
        () => new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0),
        [cursor],
    );

    const load = useCallback(() => {
        setLoading(true);
        const from = isoDate(monthStart);
        const to = isoDate(monthEnd);
        Promise.all([
            attendanceService.myRecords(from, to).catch(() => [] as AttendanceRecord[]),
            attendanceService.listHolidays(monthStart.getFullYear()).catch(() => [] as Holiday[]),
        ])
            .then(([recs, hols]) => { setRecords(recs); setHolidays(hols); })
            .finally(() => setLoading(false));
    }, [monthStart, monthEnd]);

    useEffect(() => { load(); }, [load]);

    /** work_date may arrive as a full ISO timestamp; key on the date part only. */
    const byDate = useMemo(() => {
        const map = new Map<string, AttendanceRecord>();
        for (const r of records) map.set(String(r.work_date).slice(0, 10), r);
        return map;
    }, [records]);

    const holidayByDate = useMemo(() => {
        const map = new Map<string, Holiday>();
        for (const h of holidays) map.set(String(h.date).slice(0, 10), h);
        return map;
    }, [holidays]);

    // Leading blanks so the 1st lands under its weekday column.
    const cells: (Date | null)[] = [
        ...Array.from({ length: mondayIndex(monthStart) }, () => null),
        ...Array.from(
            { length: monthEnd.getDate() },
            (_, i) => new Date(cursor.getFullYear(), cursor.getMonth(), i + 1),
        ),
    ];

    const todayIso = isoDate(new Date());
    const presentCount = records.filter((r) => r.check_in).length;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                        className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm font-bold text-slate-900 dark:text-white min-w-[9rem] text-center">
                        {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </span>
                    <button
                        onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                        className="p-1.5 border border-slate-200 rounded-lg text-slate-500 hover:border-primary-500 hover:text-primary-600 transition-colors"
                        aria-label="Next month"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
                <span className="text-xs text-slate-400">
                    {loading ? <Loader2 size={14} className="animate-spin" /> : `${presentCount} day(s) attended`}
                </span>
            </div>

            <div className="grid grid-cols-7 gap-1">
                {WEEKDAY_LABELS.map((d) => (
                    <div key={d} className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center py-1">
                        {d}
                    </div>
                ))}

                {cells.map((date, i) => {
                    if (!date) return <div key={`blank-${i}`} />;

                    const iso = isoDate(date);
                    const record = byDate.get(iso);
                    const holiday = holidayByDate.get(iso);
                    const weekend = mondayIndex(date) >= 5;
                    const isToday = iso === todayIso;

                    return (
                        <div
                            key={iso}
                            title={
                                holiday ? holiday.name
                                    : record ? `In ${fmtTime(record.check_in)} · Out ${fmtTime(record.check_out)}`
                                        : undefined
                            }
                            className={`min-h-[4.5rem] p-1.5 border rounded-lg flex flex-col gap-1 ${isToday ? 'border-primary-500' : 'border-slate-200 dark:border-slate-800'
                                } ${holiday ? 'bg-indigo-50 dark:bg-indigo-900/10'
                                    : weekend ? 'bg-slate-50 dark:bg-slate-900/40'
                                        : 'bg-white dark:bg-slate-900'}`}
                        >
                            <span className={`text-[11px] font-bold ${isToday ? 'text-primary-600' : 'text-slate-500'}`}>
                                {date.getDate()}
                            </span>

                            {holiday ? (
                                <span className="text-[9px] font-semibold text-indigo-600 leading-tight line-clamp-2">
                                    {holiday.name}
                                </span>
                            ) : record ? (
                                <>
                                    <span className="inline-flex items-center gap-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot[record.status] ?? 'bg-slate-400'}`} />
                                        <span className="text-[9px] text-slate-500 capitalize">
                                            {record.status.replace('_', ' ')}
                                        </span>
                                    </span>
                                    <span className="text-[9px] text-slate-400 leading-tight">
                                        {fmtTime(record.check_in)}
                                    </span>
                                </>
                            ) : null}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
                <Legend className="bg-emerald-500" label="Present" />
                <Legend className="bg-orange-500" label="Late" />
                <Legend className="bg-indigo-400" label="Holiday" />
                <span>Weekends are shaded. Empty weekdays have no punch recorded.</span>
            </div>
        </div>
    );
}

function Legend({ className, label }: { className: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1">
            <span className={`w-2 h-2 rounded-full ${className}`} /> {label}
        </span>
    );
}
