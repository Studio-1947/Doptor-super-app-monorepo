"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    Shield, 
    Users, 
    HandHelping, 
    Award, 
    Plus, 
    ArrowRight,
    Settings,
    Briefcase,
    UserCheck
} from 'lucide-react';

export default function NetworkAdminPage() {
    const stats = [
        { label: 'Admin Moderators', value: '24', change: '+2', trend: 'up', icon: Shield, color: 'bg-primary-500' },
        { label: 'Verified Vols', value: '3.2K', icon: UserCheck, color: 'bg-emerald-500' },
        { label: 'Open Positions', value: '142', change: '+15', trend: 'up', icon: Briefcase, color: 'bg-indigo-500' },
        { label: 'Badges Issued', value: '8.4K', icon: Award, color: 'bg-amber-500' },
    ] as any[];

    const roles = [
        { id: 'ROLE-001', name: 'Regional Lead', volunteers: '12', permissions: 'Full Access', status: 'Active' },
        { id: 'ROLE-002', name: 'Community Moderator', volunteers: '45', permissions: 'Moderation', status: 'Active' },
        { id: 'ROLE-003', name: 'Event Coordinator', volunteers: '82', permissions: 'Scheduling', status: 'Active' },
        { id: 'ROLE-004', name: 'Data Analyst', volunteers: '8', permissions: 'Reports Only', status: 'Active' },
        { id: 'ROLE-005', name: 'Field Supervisor', volunteers: '124', permissions: 'Field Ops', status: 'Active' },
    ];

    return (
        <ReadyUI 
            title="Network Administration" 
            description="Manage volunteer roles, administrative permissions, and global community standards."
            moduleName="Network"
            stats={stats}
            primaryAction={{
                label: "Assign Admin Role",
                icon: Plus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Role</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Permission Level</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Staff</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {roles.map((role) => (
                            <tr key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{role.id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-900">{role.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{role.permissions}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex -space-x-2">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="w-6 h-6 bg-slate-200 border-2 border-white rounded-none flex items-center justify-center text-[8px] font-black">
                                                U{i}
                                            </div>
                                        ))}
                                        <div className="w-6 h-6 bg-primary-50 border-2 border-white rounded-none flex items-center justify-center text-[8px] font-black text-primary-600">
                                            +{role.volunteers}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        role.status === 'Active' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' : 'text-orange-600 border-orange-100 bg-orange-50'
                                    }`}>
                                        {role.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        Edit Permissions <Settings size={14} />
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
