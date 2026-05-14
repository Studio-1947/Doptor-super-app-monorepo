"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    Building2, 
    ShieldCheck, 
    Users, 
    Key, 
    Plus, 
    ArrowRight,
    Settings,
    FileLock,
    UserCheck
} from 'lucide-react';

export default function OfficeAdminPage() {
    const stats = [
        { label: 'Active Depts', value: '18', change: '+2', trend: 'up', icon: Building2, color: 'bg-primary-500' },
        { label: 'Security Score', value: 'A+', icon: ShieldCheck, color: 'bg-emerald-500' },
        { label: 'Licensed Users', value: '1,240', change: '+124', trend: 'up', icon: Users, color: 'bg-indigo-500' },
        { label: 'Pending Keys', value: '4', icon: Key, color: 'bg-orange-500' },
    ] as any[];

    const policies = [
        { id: 'POL-001', name: 'Standard Access Control', status: 'Enforced', level: 'Level 1', scope: 'Organization' },
        { id: 'POL-002', name: 'Document Retention', status: 'Enforced', level: 'Level 2', scope: 'Office' },
        { id: 'POL-003', name: 'Employee Data Privacy', status: 'Draft', level: 'Level 3', scope: 'Global' },
        { id: 'POL-004', name: 'External Sharing Policy', status: 'Review', level: 'Level 2', scope: 'Shared' },
        { id: 'POL-005', name: 'Zero-Trust Architecture', status: 'Enforced', level: 'Level 4', scope: 'Kernel' },
    ];

    return (
        <ReadyUI 
            title="Office Administration" 
            description="Manage organizational policies, department hierarchy, and administrative access controls."
            moduleName="Office"
            stats={stats}
            primaryAction={{
                label: "Define Policy",
                icon: Plus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Policy ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Policy</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Level</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Scope</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {policies.map((policy) => (
                            <tr key={policy.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{policy.id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">{policy.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Type: Admin Config</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{policy.level}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{policy.scope}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        policy.status === 'Enforced' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                        policy.status === 'Review' ? 'text-orange-600 border-orange-100 bg-orange-50' :
                                        'text-slate-600 border-slate-100 bg-slate-50'
                                    }`}>
                                        {policy.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        Edit Policy <FileLock size={14} />
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
