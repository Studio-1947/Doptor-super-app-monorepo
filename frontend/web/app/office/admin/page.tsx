"use client";

import { useEffect, useState } from 'react';
import { ReadyUI } from '@/components/ReadyUI';
import {
    Building2,
    ShieldCheck,
    Users,
    UserPlus,
    FileLock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { departmentService } from '@/services/department.service';
import { roleService, Role } from '@/services/role.service';
import { usersService } from '@/services/users.service';

interface RoleRow extends Role {
    permissionCount: number;
}

export default function OfficeAdminPage() {
    const { user } = useAuth();
    const [deptCount, setDeptCount] = useState<number | null>(null);
    const [userCount, setUserCount] = useState<number | null>(null);
    const [pendingInviteCount, setPendingInviteCount] = useState<number | null>(null);
    const [roleRows, setRoleRows] = useState<RoleRow[] | null>(null);

    useEffect(() => {
        if (!user?.organisation_id) return;
        const orgId = user.organisation_id;

        // Scoped server-side from the authenticated user; no org filter needed.
        departmentService.getAll().then((d) => setDeptCount(d.length)).catch(() => setDeptCount(null));
        usersService.list({ organisationId: orgId }).then((members) => {
            setUserCount(members.length);
            setPendingInviteCount(members.filter((m) => m.status === 'invited').length);
        }).catch(() => {
            setUserCount(null);
            setPendingInviteCount(null);
        });

        roleService.getAll(orgId).then(async (roleList) => {
            const withCounts = await Promise.all(
                roleList.map(async (role) => {
                    try {
                        const perms = await roleService.getRolePermissions(role.id);
                        return { ...role, permissionCount: perms.length };
                    } catch {
                        return { ...role, permissionCount: 0 };
                    }
                })
            );
            setRoleRows(withCounts);
        }).catch(() => setRoleRows([]));
    }, [user?.organisation_id]);

    const stats = [
        { label: 'Departments', value: deptCount === null ? '-' : String(deptCount), icon: Building2, color: 'bg-primary-500' },
        { label: 'Roles Configured', value: roleRows === null ? '-' : String(roleRows.length), icon: ShieldCheck, color: 'bg-emerald-500' },
        { label: 'Total Members', value: userCount === null ? '-' : String(userCount), icon: Users, color: 'bg-indigo-500' },
        { label: 'Pending Invites', value: pendingInviteCount === null ? '-' : String(pendingInviteCount), icon: UserPlus, color: 'bg-orange-500' },
    ] as any[];

    return (
        <ReadyUI
            title="Office Administration"
            description="Manage organizational roles, department hierarchy, and access controls."
            moduleName="Office"
            stats={stats}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Permissions Granted</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {(roleRows ?? []).map((role) => (
                            <tr key={role.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-900">{role.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{role.permissionCount} permission{role.permissionCount === 1 ? '' : 's'}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <a href="/admin/roles" className="text-[10px] font-black text-slate-900 uppercase tracking-widest inline-flex items-center gap-1 group-hover:gap-3 transition-all hover:text-primary-600">
                                        Manage <FileLock size={14} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                        {roleRows !== null && roleRows.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-sm text-slate-400">
                                    No roles configured for this organisation yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </ReadyUI>
    );
}
