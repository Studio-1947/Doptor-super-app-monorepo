"use client";

import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { Card } from '@doptor/shared';
import type { OverviewStats } from '@/services/analytics.service';

/**
 * First-run guidance for a new organisation (onboarding O-5).
 *
 * Deliberately **derived from real counts** rather than a stored
 * "setup_completed" flag:
 *
 * - no migration and no new persistence to keep in sync;
 * - it cannot claim a step is done when it isn't, because the step *is* the
 *   count. An org that later deletes its only department correctly sees the
 *   step reopen;
 * - it is advisory, not blocking. A blocking wizard would have to be
 *   skippable, and a skipped wizard is a stored flag again.
 *
 * The whole card unmounts once every step is satisfied, so an established org
 * never sees it.
 *
 * Step order is not arbitrary: task creation requires a `department_id`, so an
 * org genuinely cannot create a task until a department exists. Departments
 * first reflects a real dependency, not a preference.
 */

interface Step {
    label: string;
    detail: string;
    href: string;
    cta: string;
    done: boolean;
}

export function buildSteps(stats: OverviewStats): Step[] {
    return [
        {
            label: 'Create a department',
            detail: 'Tasks belong to a department — it supplies their reference number, so nothing can be created until one exists.',
            href: '/admin/departments',
            cta: 'Add department',
            done: stats.totalDepartments > 0,
        },
        {
            label: 'Invite your team',
            detail: 'Invited members get an email with a link to set their own password.',
            href: '/office/team',
            cta: 'Invite people',
            // The founding admin is already a user, so one account is not a team.
            done: stats.totalUsers > 1,
        },
        {
            label: 'Create your first task',
            detail: 'Assign work, track it on the board, and keep a full audit trail.',
            href: '/tasks',
            cta: 'Open tasks',
            done: stats.totalTasks > 0,
        },
    ];
}

export function SetupChecklist({ stats }: { stats: OverviewStats }) {
    const steps = buildSteps(stats);
    const remaining = steps.filter((s) => !s.done);

    // An org that has done everything should never see this again.
    if (remaining.length === 0) return null;

    const doneCount = steps.length - remaining.length;

    return (
        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-1">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Finish setting up</h3>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
                    {doneCount} of {steps.length} done
                </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                Your organisation is created. These are the pieces the rest of the suite builds on.
            </p>

            <div className="space-y-3">
                {steps.map((step) => (
                    <div
                        key={step.label}
                        className={`flex items-start justify-between gap-4 p-3 border rounded-none ${
                            step.done
                                ? 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10'
                                : 'border-slate-100 dark:border-slate-800'
                        }`}
                    >
                        <div className="flex items-start gap-3 min-w-0">
                            <div
                                className={`mt-0.5 w-5 h-5 shrink-0 flex items-center justify-center border ${
                                    step.done
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : 'border-slate-300 dark:border-slate-600'
                                }`}
                                aria-hidden
                            >
                                {step.done && <Check size={12} strokeWidth={3} />}
                            </div>
                            <div className="min-w-0">
                                <p className={`font-bold text-sm ${
                                    step.done
                                        ? 'text-slate-500 dark:text-slate-400 line-through'
                                        : 'text-slate-900 dark:text-white'
                                }`}>
                                    {step.label}
                                </p>
                                {!step.done && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{step.detail}</p>
                                )}
                            </div>
                        </div>

                        {!step.done && (
                            <Link
                                href={step.href}
                                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-none border border-primary-100 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all"
                            >
                                {step.cta} <ArrowRight size={12} />
                            </Link>
                        )}
                    </div>
                ))}
            </div>
        </Card>
    );
}
