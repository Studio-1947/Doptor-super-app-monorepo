"use client";

import { useEffect, useState } from 'react';
import { ReadyUI } from '@/components/ReadyUI';
import { Building2, Layers, Users, CalendarDays, Save, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useAsync } from '@/features/dashboard/useAsync';
import { ErrorNote, LoadingRows } from '@/features/dashboard/DashboardPrimitives';
import { organisationService } from '@/services/organisation.service';
import { departmentService } from '@/services/department.service';
import { usersService } from '@/services/users.service';

/**
 * Organisation settings — real data.
 *
 * Previously reported "System Status: Healthy", "Active Modules: 14" and
 * "Integrations: 5" over an empty page. None of those exist: there is no module
 * registry, no integration model, and nothing measuring system health. They are
 * replaced with the organisation's actual record rather than given plausible
 * numbers.
 *
 * Renaming is wired because `PATCH /organisations/:id` exists and is now
 * org-scoped (backlog C-11 — it was previously unscoped, so anyone could rename
 * or delete any tenant). The slug is shown read-only: it is the lookup key for
 * `GET /organisations/slug/:slug`, so changing it is a migration, not a setting.
 * Vertical toggles are likewise read-only here — flipping one changes
 * navigation for every member of the organisation and deserves its own
 * confirmation flow rather than a bare switch.
 */

export default function AdminSettingsPage() {
    const { user } = useAuth();
    const orgId = user?.organisation_id;

    const org = useAsync(
        () => (orgId ? organisationService.getById(orgId) : Promise.resolve(null)),
        [orgId],
    );
    const departments = useAsync(() => departmentService.getAll(), []);
    const members = useAsync(() => usersService.list(), []);

    const [name, setName] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    // Seed the field once the record arrives; typing must not be clobbered by a
    // later reload, so this keys on the loaded id rather than the whole object.
    useEffect(() => {
        if (org.data) setName(org.data.name);
        // Depends on the id, not the object: a reload after saving returns a new
        // object every time, and depending on it would overwrite whatever the
        // user had since typed.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [org.data?.id]);

    const verticals = org.data?.enabled_verticals ?? [];
    const created = org.data?.created_at
        ? new Date(org.data.created_at).toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
          })
        : '-';

    const n = (value: number | null) => (value === null ? '-' : String(value));
    const stats = [
        {
            label: 'Verticals Enabled',
            value: n(org.loading ? null : verticals.length),
            icon: Layers,
            color: 'bg-indigo-500',
        },
        {
            label: 'Members',
            value: n(members.loading ? null : (members.data ?? []).length),
            icon: Users,
            color: 'bg-emerald-500',
        },
        {
            label: 'Departments',
            value: n(departments.loading ? null : (departments.data ?? []).length),
            icon: Building2,
            color: 'bg-blue-500',
        },
        {
            label: 'Created',
            value: org.loading ? '-' : created,
            icon: CalendarDays,
            color: 'bg-slate-500',
        },
    ] as any[];

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orgId || !name.trim() || name.trim() === org.data?.name) return;

        setSaving(true);
        setSaveError(null);
        setSaved(false);
        try {
            await organisationService.update(orgId, { name: name.trim() });
            setSaved(true);
            org.reload();
        } catch (err) {
            setSaveError(
                err instanceof Error ? err.message : 'Could not save the organisation name.',
            );
        } finally {
            setSaving(false);
        }
    };

    const dirty = !!org.data && name.trim() !== '' && name.trim() !== org.data.name;

    return (
        <ReadyUI
            title="Organisation Settings"
            description="Your organisation's record on the platform."
            moduleName="Admin"
            stats={stats}
        >
            <div className="w-full text-left">
                {org.error ? (
                    <ErrorNote message={org.error} />
                ) : org.loading ? (
                    <LoadingRows count={3} />
                ) : !org.data ? (
                    <ErrorNote message="No organisation is associated with this account." />
                ) : (
                    <div className="max-w-2xl space-y-8">
                        <form onSubmit={handleSave} className="space-y-4">
                            <label className="flex flex-col gap-2">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Organisation Name
                                </span>
                                <input
                                    value={name}
                                    onChange={(e) => {
                                        setName(e.target.value);
                                        setSaved(false);
                                    }}
                                    className="px-4 py-3 bg-white border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:border-primary-500"
                                />
                            </label>

                            {saveError && (
                                <p className="text-xs font-bold text-danger-600">{saveError}</p>
                            )}
                            {saved && !dirty && (
                                <p className="text-xs font-bold text-success-600">Saved.</p>
                            )}

                            <button
                                type="submit"
                                disabled={saving || !dirty}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-primary-700 disabled:opacity-50"
                            >
                                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                Save Changes
                            </button>
                        </form>

                        <div className="space-y-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Slug
                            </span>
                            <p className="text-sm font-bold text-slate-900">{org.data.slug}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Used to look your organisation up. Changing it is a migration, not
                                a setting.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                Enabled Verticals
                            </span>
                            <div className="flex flex-wrap gap-2">
                                {verticals.length === 0 ? (
                                    <span className="text-xs font-bold text-slate-400">None enabled.</span>
                                ) : (
                                    verticals.map((v) => (
                                        <span
                                            key={v}
                                            className="px-3 py-1.5 bg-primary-50 text-primary-700 border border-primary-100 text-[10px] font-black uppercase tracking-widest"
                                        >
                                            {v}
                                        </span>
                                    ))
                                )}
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                Chosen at signup. Turning one on or off changes navigation for
                                every member.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </ReadyUI>
    );
}
