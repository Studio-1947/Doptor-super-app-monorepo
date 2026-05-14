"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { Users, UserCheck, UserPlus, Shield, MoreHorizontal, Mail, Phone } from 'lucide-react';

export default function TeamPage() {
    const stats = [
        { label: 'Total Members', value: '42', change: '+4', trend: 'up', icon: Users, color: 'bg-indigo-500' },
        { label: 'Active Now', value: '28', change: '12%', trend: 'up', icon: UserCheck, color: 'bg-emerald-500' },
        { label: 'Pending Invites', value: '5', change: '-2', trend: 'down', icon: UserPlus, color: 'bg-orange-500' },
        { label: 'Admins', value: '4', icon: Shield, color: 'bg-rose-500' },
    ] as any[];

    const team = [
        { id: 1, name: 'John Doe', role: 'Super Admin', dept: 'Management', status: 'Online', lastActive: 'Now' },
        { id: 2, name: 'Jane Smith', role: 'Manager', dept: 'Engineering', status: 'Away', lastActive: '12m ago' },
        { id: 3, name: 'Mike Ross', role: 'Staff', dept: 'Legal', status: 'Online', lastActive: 'Now' },
        { id: 4, name: 'Harvey Specter', role: 'Manager', dept: 'Legal', status: 'Offline', lastActive: '2h ago' },
        { id: 5, name: 'Donna Paulsen', role: 'Org Admin', dept: 'Operations', status: 'Online', lastActive: 'Now' },
    ];

    return (
        <ReadyUI 
            title="Team Management" 
            description="Manage your organization's members, roles, and permissions."
            moduleName="Office"
            stats={stats}
            primaryAction={{
                label: "Invite Member",
                icon: UserPlus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Member</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Active</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Connect</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {team.map((member) => (
                            <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-primary-600 text-white flex items-center justify-center font-black text-[10px] border border-primary-700">
                                            {member.name.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900">{member.name}</p>
                                            <p className="text-[9px] text-primary-600 font-bold uppercase tracking-tighter">ID: DPT-00{member.id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{member.role}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.dept}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        member.status === 'Online' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                        member.status === 'Away' ? 'text-orange-600 border-orange-100 bg-orange-50' :
                                        'text-slate-400 border-slate-100 bg-slate-50'
                                    }`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-500">{member.lastActive}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                                            <Mail size={14} />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                                            <Phone size={14} />
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 transition-all">
                                            <MoreHorizontal size={14} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReadyUI>
    );
}
