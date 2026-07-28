"use client";

import { useMemo } from 'react';
import { ReadyUI } from '@/components/ReadyUI';
import { Shield, Lock, UserCheck, Users } from 'lucide-react';
import { useAsync } from '@/features/dashboard/useAsync';
import { EmptyState, ErrorNote, LoadingRows } from '@/features/dashboard/DashboardPrimitives';
import { roleService, permissionService, Role } from '@/services/role.service';
import { usersService } from '@/services/users.service';

/**
 * Roles & permissions — real data.
 *
 * Previously invented everything: "Total Roles 12", "Active Users 156", and
 * five fictional roles including a "Project Lead" with 109 users. A real
 * organisation gets six roles at registration (Phase 2.5), so the fake list
 * did not even resemble what the product creates.
 *
 * Two columns are dropped rather than wired. There is no `type` column
 * distinguishing "System" from "Custom" roles and no `status` column — every
 * role a registration creates is equally real and equally active. Inventing a
 * value for a column with no backing model is the failure this page is being
 * fixed for, so the columns go instead.
 *
 * Editing is deliberately not added here: granting permissions is the exact
 * surface that backlog C-11 found exploitable, and a write UI for it deserves
 * its own pass rather than riding along with a de-mocking change.
 */

interface RoleRow extends Role {
    permissionCount: number;
}

export default function RolesPage() {
    // Permission counts are per-role and there is no bulk endpoint, so this
    // fans out one request per role. Fine at six-ish roles; if an organisation
    // ever grows dozens, this wants a server-side count instead.
    const roles = useAsync<RoleRow[]>(async () => {
        const list = await roleService.getAll();
        return Promise.all(
            list.map(async (role) => {
                try {
                    const perms = await roleService.getRolePermissions(role.id);
                    return { ...role, permissionCount: perms.length };
                } catch {
                    // One unreadable role must not blank the whole table.
                    return { ...role, permissionCount: 0 };
                }
            }),
        );
    }, []);

    const members = useAsync(() => usersService.list(), []);
    const permissions = useAsync(() => permissionService.getAll(), []);

    const countByRoleId = useMemo(() => {
        const map = new Map<string, number>();
        for (const m of members.data ?? []) {
            if (!m.role?.id) continue;
            map.set(m.role.id, (map.get(m.role.id) ?? 0) + 1);
        }
        return map;
    }, [members.data]);

    const rows = roles.data ?? [];
    const rolesInUse = rows.filter((r) => (countByRoleId.get(r.id) ?? 0) > 0).length;

    const n = (value: number | null) => (value === null ? '-' : String(value));
    const stats = [
        {
            label: 'Roles',
            value: n(roles.loading ? null : rows.length),
            icon: Shield,
            color: 'bg-indigo-500',
        },
        {
            label: 'Roles In Use',
            value: n(roles.loading || members.loading ? null : rolesInUse),
            icon: UserCheck,
            color: 'bg-emerald-500',
        },
        {
            label: 'Permissions Defined',
            value: n(permissions.loading ? null : (permissions.data ?? []).length),
            icon: Lock,
            color: 'bg-blue-500',
        },
        {
            label: 'Members',
            value: n(members.loading ? null : (members.data ?? []).length),
            icon: Users,
            color: 'bg-slate-500',
        },
    ] as any[];

    return (
        <ReadyUI
            title="Roles & Permissions"
            description="The roles in your organisation and how much access each one carries."
            moduleName="Admin"
            stats={stats}
        >
            <div className="w-full">
                {roles.error ? (
                    <ErrorNote message={roles.error} />
                ) : roles.loading ? (
                    <LoadingRows count={6} />
                ) : rows.length === 0 ? (
                    <EmptyState message="No roles found for this organisation." />
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Permissions</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Members</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rows.map((role) => (
                                    <tr key={role.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-xs border border-primary-100">
                                                    {role.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{role.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-xs text-slate-500 max-w-md">
                                                {role.description || '—'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1">
                                                {role.permissionCount}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-500">
                                                {members.loading ? '—' : countByRoleId.get(role.id) ?? 0}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ReadyUI>
    );
}
