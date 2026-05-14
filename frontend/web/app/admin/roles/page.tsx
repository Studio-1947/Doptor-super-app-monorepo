"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { Shield, Lock, UserCheck, Settings, Plus, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';

export default function RolesPage() {
    const stats = [
        { label: 'Total Roles', value: '12', icon: Shield, color: 'bg-indigo-500' },
        { label: 'Active Users', value: '156', change: '+8', trend: 'up', icon: UserCheck, color: 'bg-emerald-500' },
        { label: 'Permissions', value: '48', icon: Lock, color: 'bg-blue-500' },
        { label: 'System Roles', value: '3', icon: Settings, color: 'bg-slate-500' },
    ] as any[];

    const roles = [
        { id: 1, name: 'Super Admin', description: 'Full system access with all permissions enabled.', users: 3, type: 'System', status: 'Active' },
        { id: 2, name: 'Org Admin', description: 'Organization-wide management and configuration.', users: 8, type: 'System', status: 'Active' },
        { id: 3, name: 'HR Manager', description: 'Manage employees, attendance, and recruitment.', users: 12, type: 'Custom', status: 'Active' },
        { id: 4, name: 'Project Lead', description: 'Oversee tasks, files, and team communication.', users: 24, type: 'Custom', status: 'Active' },
        { id: 5, name: 'Standard User', description: 'General access to basic platform features.', users: 109, type: 'System', status: 'Active' },
    ];

    return (
        <ReadyUI 
            title="Roles & Permissions" 
            description="Define user roles and manage granular access controls for your organization."
            moduleName="Admin"
            stats={stats}
            primaryAction={{
                label: "Create Role",
                icon: Plus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role Name</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Users</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {roles.map((role) => (
                            <tr key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs border border-primary-100">
                                            {role.name[0]}
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{role.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-xs text-slate-500 max-w-xs truncate">{role.description}</p>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1">{role.users}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border ${
                                        role.type === 'System' ? 'text-indigo-600 border-indigo-100 bg-indigo-50' : 'text-slate-600 border-slate-100 bg-slate-50'
                                    }`}>
                                        {role.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-emerald-500" />
                                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">{role.status}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white transition-all border border-transparent hover:border-slate-100 shadow-sm">
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white transition-all border border-transparent hover:border-slate-100 shadow-sm">
                                            <Trash2 size={14} />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white transition-all border border-transparent hover:border-slate-100 shadow-sm">
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Showing {roles.length} of 12 system roles</p>
                    <div className="flex items-center gap-2">
                        <button className="px-3 py-1 text-[10px] font-bold uppercase border border-slate-200 bg-white text-slate-400 cursor-not-allowed">Prev</button>
                        <button className="px-3 py-1 text-[10px] font-bold uppercase border border-slate-200 bg-white text-slate-900 hover:bg-slate-50">Next</button>
                    </div>
                </div>
            </div>
        </ReadyUI>
    );
}
