"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { Clock, Calendar, UserCheck, AlertCircle, Plus, ArrowRight } from 'lucide-react';

export default function CoreAttendancePage() {
    const stats = [
        { label: 'Present Today', value: '38/42', change: '90%', trend: 'up', icon: UserCheck, color: 'bg-emerald-500' },
        { label: 'On Leave', value: '4', change: '+1', trend: 'up', icon: Calendar, color: 'bg-blue-500' },
        { label: 'Late Arrival', value: '2', change: '-3', trend: 'down', icon: Clock, color: 'bg-orange-500' },
        { label: 'Missing Logs', value: '1', icon: AlertCircle, color: 'bg-rose-500' },
    ] as any[];

    const attendanceData = [
        { id: 1, name: 'Amit Sharma', role: 'Developer', checkIn: '09:15 AM', checkOut: '06:30 PM', status: 'Present', mode: 'Office' },
        { id: 2, name: 'Priya Patel', role: 'Designer', checkIn: '09:45 AM', checkOut: '06:00 PM', status: 'Late', mode: 'Remote' },
        { id: 3, name: 'Rahul Verma', role: 'Manager', checkIn: '09:05 AM', checkOut: '07:15 PM', status: 'Present', mode: 'Office' },
        { id: 4, name: 'Sonia Gill', role: 'DevOps', checkIn: '-', checkOut: '-', status: 'On Leave', mode: '-' },
        { id: 5, name: 'Vikram Singh', role: 'Support', checkIn: '10:15 AM', checkOut: '07:00 PM', status: 'Late', mode: 'Office' },
    ];

    return (
        <ReadyUI 
            title="Organization Attendance" 
            description="Track daily attendance, leaves, and work hours for your team."
            moduleName="HR"
            stats={stats}
            primaryAction={{
                label: "Mark Attendance",
                icon: Plus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Employee</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock In</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Clock Out</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {attendanceData.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-[10px] border border-slate-200 uppercase">
                                            {log.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{log.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">{log.role}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{log.checkIn}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{log.checkOut}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 border ${
                                        log.status === 'Present' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                        log.status === 'Late' ? 'text-orange-600 border-orange-100 bg-orange-50' :
                                        'text-rose-600 border-rose-100 bg-rose-50'
                                    }`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{log.mode}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-primary-600 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-2 transition-all">
                                        View Log <ArrowRight size={12} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 border-t border-slate-100 bg-slate-50/30">
                    <button className="w-full py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] border-2 border-dashed border-slate-200 hover:border-primary-500 hover:text-primary-600 transition-all">
                        Synchronize All Logs
                    </button>
                </div>
            </div>
        </ReadyUI>
    );
}
