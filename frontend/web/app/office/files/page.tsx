"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    FileText, 
    Clock, 
    CheckCircle, 
    AlertCircle, 
    Plus, 
    ArrowRight, 
    Search, 
    Filter, 
    Inbox, 
    Send,
    Loader2
} from 'lucide-react';

export default function OfficeFilesPage() {
    const stats = [
        { label: 'Total Files', value: '1,420', change: '+12', trend: 'up', icon: FileText, color: 'bg-indigo-500' },
        { label: 'Pending Action', value: '24', change: '-5', trend: 'down', icon: Clock, color: 'bg-orange-500' },
        { label: 'Approved Today', value: '86', change: '+18', trend: 'up', icon: CheckCircle, color: 'bg-emerald-500' },
        { label: 'Critical Files', value: '12', icon: AlertCircle, color: 'bg-rose-500' },
    ] as any[];

    const files = [
        { id: 'ED-9042', subject: 'Budget Proposal Q3', sender: 'Finance Dept', date: '14 May 2026', priority: 'High', status: 'Pending' },
        { id: 'ED-8921', subject: 'Staff Recruitment Plan', sender: 'HR Dept', date: '13 May 2026', priority: 'Medium', status: 'Approved' },
        { id: 'ED-8854', subject: 'Office Renovation Quote', sender: 'Operations', date: '12 May 2026', priority: 'Low', status: 'Review' },
        { id: 'ED-8742', subject: 'Annual Audit Report', sender: 'Legal', date: '10 May 2026', priority: 'Critical', status: 'Pending' },
        { id: 'ED-8631', subject: 'New Policy Draft', sender: 'Management', date: '08 May 2026', priority: 'High', status: 'Approved' },
    ];

    return (
        <ReadyUI 
            title="e-Dak Files" 
            description="Track and manage official correspondence and digital document workflows."
            moduleName="Office"
            stats={stats}
            primaryAction={{
                label: "New File Entry",
                icon: Plus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">File ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Priority</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {files.map((file) => (
                            <tr key={file.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{file.id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">{file.subject}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{file.date}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{file.sender}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-1.5 h-1.5 ${
                                            file.priority === 'Critical' ? 'bg-rose-500' :
                                            file.priority === 'High' ? 'bg-orange-500' :
                                            file.priority === 'Medium' ? 'bg-blue-500' : 'bg-slate-300'
                                        }`} />
                                        <span className="text-xs font-bold text-slate-700">{file.priority}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        file.status === 'Approved' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                        file.status === 'Pending' ? 'text-orange-600 border-orange-100 bg-orange-50' :
                                        'text-indigo-600 border-indigo-100 bg-indigo-50'
                                    }`}>
                                        {file.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        View File <ArrowRight size={14} />
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
