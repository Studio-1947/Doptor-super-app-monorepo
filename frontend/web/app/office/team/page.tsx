"use client";

import { useEffect, useState } from 'react';
import { ReadyUI } from '@/components/ReadyUI';
import { Users, UserCheck, UserPlus, Shield, Mail, RefreshCw } from 'lucide-react';
import { InviteMemberDialog } from '@/features/office/InviteMemberDialog';
import { usersService, UserListItem } from '@/services/users.service';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function TeamPage() {
    const { user } = useAuth();
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [members, setMembers] = useState<UserListItem[] | null>(null);

    const loadMembers = () => {
        if (!user?.organisation_id) return;
        usersService
            .list({ organisationId: user.organisation_id })
            .then(setMembers)
            .catch(() => setMembers([]));
    };

    useEffect(() => {
        loadMembers();
    }, [user?.organisation_id]);

    const handleResend = async (id: string) => {
        try {
            await usersService.resendInvite(id);
            toast.success('Invitation resent');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to resend invitation');
        }
    };

    const totalMembers = members?.length ?? 0;
    const activeMembers = members?.filter((m) => m.status === 'active').length ?? 0;
    const pendingInvites = members?.filter((m) => m.status === 'invited').length ?? 0;
    const admins = members?.filter((m) => m.role?.name?.toLowerCase().includes('admin')).length ?? 0;

    const stats = [
        { label: 'Total Members', value: members === null ? '-' : String(totalMembers), icon: Users, color: 'bg-indigo-500' },
        { label: 'Active', value: members === null ? '-' : String(activeMembers), icon: UserCheck, color: 'bg-emerald-500' },
        { label: 'Pending Invites', value: members === null ? '-' : String(pendingInvites), icon: UserPlus, color: 'bg-orange-500' },
        { label: 'Admins', value: members === null ? '-' : String(admins), icon: Shield, color: 'bg-rose-500' },
    ] as any[];

    return (
        <>
        {showInviteDialog && (
            <InviteMemberDialog
                onClose={() => setShowInviteDialog(false)}
                onInvited={loadMembers}
            />
        )}
        <ReadyUI
            title="Team Management"
            description="Manage your organization's members, roles, and permissions."
            moduleName="Office"
            stats={stats}
            primaryAction={{
                label: "Invite Member",
                icon: UserPlus,
                onClick: () => setShowInviteDialog(true)
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
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {(members ?? []).map((member) => {
                            const name = [member.first_name, member.last_name].filter(Boolean).join(' ') || member.email;
                            return (
                                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-primary-600 text-white flex items-center justify-center font-black text-[10px] border border-primary-700">
                                                {name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{name}</p>
                                                <p className="text-[9px] text-primary-600 font-bold uppercase tracking-tighter">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-600">{member.role?.name ?? '—'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{member.department?.name ?? '—'}</span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                            member.status === 'active' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                            'text-orange-600 border-orange-100 bg-orange-50'
                                        }`}>
                                            {member.status === 'active' ? 'Active' : 'Invited'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-bold text-slate-500">
                                            {member.created_at ? new Date(member.created_at).toLocaleDateString() : '—'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {member.status === 'invited' && (
                                                <button
                                                    onClick={() => handleResend(member.id)}
                                                    title="Resend invitation"
                                                    className="p-2 text-slate-400 hover:text-primary-600 hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                                                >
                                                    <RefreshCw size={14} />
                                                </button>
                                            )}
                                            <a
                                                href={`mailto:${member.email}`}
                                                className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent hover:border-slate-100 transition-all"
                                            >
                                                <Mail size={14} />
                                            </a>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {members !== null && members.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">
                                    No team members yet. Invite your first member to get started.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </ReadyUI>
        </>
    );
}
