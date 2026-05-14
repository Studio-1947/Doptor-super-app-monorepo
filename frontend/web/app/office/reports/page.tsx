"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    BarChart3, 
    TrendingUp, 
    PieChart, 
    Download, 
    ArrowRight,
    FileText,
    Calendar,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

export default function OfficeReportsPage() {
    const stats = [
        { label: 'Generated Reports', value: '156', change: '+12', trend: 'up', icon: FileText, color: 'bg-primary-500' },
        { label: 'System Efficiency', value: '94%', change: '+2%', trend: 'up', icon: TrendingUp, color: 'bg-emerald-500' },
        { label: 'Data Accuracy', value: '99.9%', icon: CheckCircle2Icon, color: 'bg-indigo-500' },
        { label: 'Report Downloads', value: '420', icon: Download, color: 'bg-orange-500' },
    ] as any[];

    // Using a local icon component to avoid build issues
    function CheckCircle2Icon(props: any) {
        return (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
        )
    }

    const reports = [
        { id: 'REP-101', name: 'Monthly Department Attendance', category: 'HR', date: '01 May 2026', format: 'PDF', status: 'Generated' },
        { id: 'REP-102', name: 'Quarterly Budget Utilization', category: 'Finance', date: '15 Apr 2026', format: 'XLSX', status: 'Generated' },
        { id: 'REP-103', name: 'Office Resource Allocation', category: 'Operations', date: '10 May 2026', format: 'PDF', status: 'Pending' },
        { id: 'REP-104', name: 'Employee Performance Summary', category: 'HR', date: '05 May 2026', format: 'PDF', status: 'Generated' },
        { id: 'REP-105', name: 'Infrastructure Maintenance Log', category: 'Admin', date: '02 May 2026', format: 'CSV', status: 'Scheduled' },
    ];

    return (
        <ReadyUI 
            title="Analytics & Reports" 
            description="Access real-time organizational metrics and generate detailed administrative reports."
            moduleName="Office"
            stats={stats}
            primaryAction={{
                label: "Generate Custom Report",
                icon: BarChart3
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Report Name</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Generated On</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {reports.map((report) => (
                            <tr key={report.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{report.id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">{report.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Format: {report.format}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{report.category}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-500">{report.date}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        report.status === 'Generated' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                        report.status === 'Pending' ? 'text-orange-600 border-orange-100 bg-orange-50' :
                                        'text-indigo-600 border-indigo-100 bg-indigo-50'
                                    }`}>
                                        {report.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        Download <Download size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReadyUI>
    );
}
