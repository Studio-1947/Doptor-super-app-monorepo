"use client";

import { useMemo, useState } from 'react';
import { ReadyUI } from '@/components/ReadyUI';
import { Building2, Users, Hash, UserCheck, Plus, Loader2 } from 'lucide-react';
import { useAsync } from '@/features/dashboard/useAsync';
import { EmptyState, ErrorNote, LoadingRows } from '@/features/dashboard/DashboardPrimitives';
import { departmentService } from '@/services/department.service';
import { usersService } from '@/services/users.service';

/**
 * Departments — real data.
 *
 * This page previously rendered five invented departments with invented heads
 * ("Amit Sharma"), invented headcounts and invented budgets. Two of those
 * columns had no backing model at all: there is no budget and no sub-unit
 * anywhere in the schema. They are dropped rather than wired, on the same
 * reasoning that replaced the fictional "policies" and "reports" concepts in
 * backlog H-3/H-4 — a column with nothing behind it can only ever be a lie.
 *
 * Creating a department has to work here: the onboarding SetupChecklist sends a
 * new organisation to this page for step one, and a task cannot be created
 * without a department, so a read-only page would dead-end onboarding.
 */

interface NewDepartment {
    name: string;
    code: string;
    task_prefix: string;
}

const EMPTY_FORM: NewDepartment = { name: '', code: '', task_prefix: '' };

export default function DepartmentsPage() {
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState<NewDepartment>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // One fetch of each: departments carry head_of_dept_id but not the head's
    // name, and no endpoint reports per-department headcount, so both are
    // derived from the member list rather than guessed at.
    const departments = useAsync(() => departmentService.getAll(), []);
    const members = useAsync(() => usersService.list(), []);

    const headsById = useMemo(() => {
        const map = new Map<string, string>();
        for (const m of members.data ?? []) {
            map.set(m.id, `${m.first_name ?? ''} ${m.last_name ?? ''}`.trim() || m.email);
        }
        return map;
    }, [members.data]);

    const countByDeptName = useMemo(() => {
        const map = new Map<string, number>();
        for (const m of members.data ?? []) {
            const name = m.department?.name;
            if (!name) continue;
            map.set(name, (map.get(name) ?? 0) + 1);
        }
        return map;
    }, [members.data]);

    const rows = departments.data ?? [];
    const assignedCount = useMemo(
        () => (members.data ?? []).filter((m) => m.department?.name).length,
        [members.data],
    );
    const headsAssigned = rows.filter((d) => d.head_of_dept_id).length;

    // `null` while loading so the shell renders a dash rather than a zero that
    // reads as real data.
    const n = (value: number | null) => (value === null ? '-' : String(value));
    const stats = [
        {
            label: 'Departments',
            value: n(departments.loading ? null : rows.length),
            icon: Building2,
            color: 'bg-indigo-500',
        },
        {
            label: 'Members',
            value: n(members.loading ? null : (members.data ?? []).length),
            icon: Users,
            color: 'bg-emerald-500',
        },
        {
            label: 'In a Department',
            value: n(members.loading ? null : assignedCount),
            icon: UserCheck,
            color: 'bg-blue-500',
        },
        {
            label: 'Heads Assigned',
            value: n(departments.loading ? null : headsAssigned),
            icon: Hash,
            color: 'bg-orange-500',
        },
    ] as any[];

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim()) return;

        setSaving(true);
        setSaveError(null);
        try {
            await departmentService.create({
                name: form.name.trim(),
                // Optional on the API; sending "" would store an empty string
                // rather than leaving the column null.
                code: form.code.trim() || undefined,
                task_prefix: form.task_prefix.trim().toUpperCase() || undefined,
            });
            setForm(EMPTY_FORM);
            setShowForm(false);
            departments.reload();
            members.reload();
        } catch (err) {
            setSaveError(
                err instanceof Error ? err.message : 'Could not create the department.',
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <ReadyUI
            title="Departments"
            description="Your organisation's departments. Task references are numbered per department."
            moduleName="Admin"
            stats={stats}
            primaryAction={{
                label: showForm ? 'Close Form' : 'Add Department',
                icon: Plus,
                onClick: () => setShowForm((open) => !open),
            }}
        >
            <div className="w-full">
                {showForm && (
                    <form
                        onSubmit={handleCreate}
                        className="mb-6 p-6 bg-slate-50 border border-slate-200 text-left"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Name <span className="text-rose-500">*</span>
                                </span>
                                <input
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    required
                                    placeholder="Engineering"
                                    className="px-4 py-3 bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-primary-500"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Code
                                </span>
                                <input
                                    value={form.code}
                                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                                    placeholder="ENG"
                                    className="px-4 py-3 bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-primary-500"
                                />
                            </label>
                            <label className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Task Prefix
                                </span>
                                <input
                                    value={form.task_prefix}
                                    onChange={(e) => setForm({ ...form, task_prefix: e.target.value })}
                                    placeholder="ENG"
                                    className="px-4 py-3 bg-white border border-slate-200 text-xs font-bold text-slate-900 uppercase focus:outline-none focus:border-primary-500"
                                />
                            </label>
                        </div>
                        <p className="mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            The task prefix builds references like ENG-12. It cannot be changed
                            once tasks exist.
                        </p>
                        {saveError && (
                            <p className="mt-3 text-xs font-bold text-rose-600">{saveError}</p>
                        )}
                        <button
                            type="submit"
                            disabled={saving || !form.name.trim()}
                            className="mt-4 inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 disabled:opacity-50"
                        >
                            {saving && <Loader2 size={14} className="animate-spin" />}
                            Create Department
                        </button>
                    </form>
                )}

                {departments.error ? (
                    <ErrorNote message={departments.error} />
                ) : departments.loading ? (
                    <LoadingRows count={4} />
                ) : rows.length === 0 ? (
                    <EmptyState message="No departments yet. Add the first one to start creating tasks." />
                ) : (
                    <div className="w-full overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 bg-slate-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Department</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Task Ref</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Head of Dept</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Members</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {rows.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] border border-indigo-100 uppercase">
                                                    {dept.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-slate-900">{dept.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-500">{dept.code || '—'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {dept.task_prefix ? (
                                                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1">
                                                    {dept.task_prefix}-{(dept.task_seq ?? 0) + 1}
                                                </span>
                                            ) : (
                                                <span className="text-xs font-bold text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-slate-600">
                                                {dept.head_of_dept_id
                                                    ? headsById.get(dept.head_of_dept_id) ?? 'Unknown member'
                                                    : 'Not assigned'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1">
                                                {countByDeptName.get(dept.name) ?? 0}
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
