"use client";

import Link from 'next/link';
import { Card } from '@doptor/shared';
import type { LucideIcon } from 'lucide-react';

/**
 * Shared building blocks for the role dashboards. Extracted so the Org Admin,
 * Manager and Staff dashboards share one visual language instead of each
 * re-growing its own copy of the tile markup, which is how they drifted into
 * hardcoded values the first time.
 */

export type TileTone = 'amber' | 'blue' | 'indigo' | 'emerald' | 'slate';

const TONES: Record<TileTone, { color: string; bg: string }> = {
    amber: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20' },
    blue: { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    indigo: { color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    emerald: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
    slate: { color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
};

export function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
    return (
        <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
            <p className="text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
    );
}

/**
 * A single metric. `value` is `null` while loading, which renders a skeleton
 * rather than a zero — showing "0" before the data arrives reads as real data
 * and is the failure mode this whole change exists to remove.
 */
export function StatTile({
    title, value, icon: Icon, tone = 'slate', href,
}: {
    title: string;
    value: number | string | null;
    icon: LucideIcon;
    tone?: TileTone;
    href?: string;
}) {
    const { color, bg } = TONES[tone];
    const body = (
        <Card className="p-4 h-full bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
                    {title}
                </span>
                <div className={`p-2 rounded-none ${bg} ${color} border border-current border-opacity-10`}>
                    <Icon size={14} />
                </div>
            </div>
            {value === null
                ? <div className="h-9 w-16 bg-slate-100 dark:bg-slate-800 animate-pulse" aria-label="Loading" />
                : <div className="text-3xl font-black text-slate-900 dark:text-white">{value}</div>}
        </Card>
    );

    return href
        ? <Link href={href} className="block transition-transform hover:-translate-y-0.5">{body}</Link>
        : body;
}

export function Panel({
    title, action, children, className = '',
}: {
    title: string;
    action?: { label: string; href: string };
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <Card className={`p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">{title}</h3>
                {action && (
                    <Link
                        href={action.href}
                        className="text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:underline"
                    >
                        {action.label}
                    </Link>
                )}
            </div>
            {children}
        </Card>
    );
}

/** Shown when a real query legitimately came back empty — a new org, mostly. */
export function EmptyState({ message }: { message: string }) {
    return (
        <p className="text-sm text-slate-500 dark:text-slate-400 py-6 text-center">{message}</p>
    );
}

export function LoadingRows({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-3" aria-label="Loading">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 animate-pulse" />
            ))}
        </div>
    );
}

export function ErrorNote({ message }: { message: string }) {
    return (
        <p className="text-sm text-danger-600 dark:text-danger-400 py-6 text-center">{message}</p>
    );
}

export function QuickAction({ label, href }: { label: string; href: string }) {
    return (
        <Link
            href={href}
            className="flex items-center justify-center p-3 text-center text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all"
        >
            {label}
        </Link>
    );
}
