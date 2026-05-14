"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    CheckSquare, 
    Clock, 
    AlertCircle, 
    ArrowRight,
    UserCheck,
    FileCheck,
    ShieldAlert,
    Loader2
} from 'lucide-react';

export default function ApprovalsPage() {
    const stats = [
        { label: 'Pending Approvals', value: '42', change: '+5', trend: 'up', icon: Clock, color: 'bg-orange-500' },
        { label: 'Approved Today', value: '128', change: '+22', trend: 'up', icon: FileCheck, color: 'bg-emerald-500' },
        { label: 'Rejected', value: '8', change: '-2', trend: 'down', icon: ShieldAlert, color: 'bg-rose-500' },
        { label: 'Avg. Decision Time', value: '4.2h', icon: UserCheck, color: 'bg-indigo-500' },
    ] as any[];

    const approvals = [
        { id: 'APP-902', request: 'Leave Application - Annual', requester: 'Amit Kumar', date: '14 May 2026', priority: 'High', type: 'HR' },
        { id: 'APP-895', request: 'Procurement: New Laptops', requester: 'Sarah Jones', date: '13 May 2026', priority: 'Critical', type: 'Finance' },
        { id: 'APP-881', request: 'Travel Request: Mumbai', requester: 'Rajesh Patil', date: '12 May 2026', priority: 'Medium', type: 'Admin' },
        { id: 'APP-874', request: 'Budget Allocation: Q4', requester: 'Finance Dept', date: '10 May 2026', priority: 'High', type: 'Finance' },
        { id: 'APP-862', request: 'Project "Zenith" Charter', requester: 'Project PMO', date: '08 May 2026', priority: 'Low', type: 'Operations' },
    ];

    return (
        <ReadyUI 
            title="Approvals Center" 
            description="Manage and process pending requests across all organizational departments."
            moduleName="Core"
            stats={stats}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Request ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Request Details</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Requester</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Priority</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {approvals.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{req.id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">{req.request}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{req.date}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{req.requester}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{req.type}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        req.priority === 'Critical' ? 'text-rose-600 border-rose-100 bg-rose-50' :
                                        req.priority === 'High' ? 'text-orange-600 border-orange-100 bg-orange-50' :
                                        'text-slate-600 border-slate-100 bg-slate-50'
                                    }`}>
                                        {req.priority}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        Review <ArrowRight size={14} />
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
