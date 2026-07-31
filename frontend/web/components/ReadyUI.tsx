"use client";

import React, { useState } from 'react';
import { Search, Filter, Download, LucideIcon, X } from 'lucide-react';

/**
 * The shared page shell: heading, stat strip, optional controls, content.
 *
 * ## The rule this component now follows
 *
 * **It only renders a control the page can actually honour.** Every control is
 * driven by a handler prop, and absent a handler the control is not drawn.
 *
 * That rule exists because the previous version broke it everywhere, and it was
 * used by fifteen pages including ones wired to real data (backlog M-17). It
 * rendered:
 *
 *  - a search box that only raised a toast reading "Search engine is
 *    initializing..." — on all fifteen pages, none of which had any search;
 *  - an Export button on all fifteen, **not one of which ever passed
 *    `onExport`**;
 *  - a "More options" button whose entire behaviour was a toast saying options
 *    were "restricted in preview";
 *  - clickable stat tiles that toasted "synchronization in progress";
 *  - a footer claiming "Real-time Link Active" and "Authorized Session"
 *    unconditionally, with nothing behind either — there is no socket;
 *  - a primary action button that, given no `onClick`, toasted "feature is
 *    coming soon!". Seven pages shipped a button in exactly that state.
 *
 * `primaryAction.onClick` is therefore **required**. A page that wants the
 * button must make it do something; the alternative is not shipping the button,
 * which is what the campus and network pages now do.
 *
 * The elaborate "Ready for Production Data — connect a live data source"
 * placeholder is gone too. It implied a module was finished and merely
 * unplugged, and by the time it was removed every page passed real children, so
 * it could not render at all.
 *
 * The artificial 600ms delay that used to wrap every action is also gone. It
 * existed to make a fake action feel like work.
 */

interface Stat {
    label: string;
    value: string;
    change?: string;
    trend?: 'up' | 'down';
    icon: LucideIcon;
    color: string;
}

interface ReadyUIProps {
    title: string;
    description: string;
    moduleName?: string;
    stats?: Stat[];
    children: React.ReactNode;
    /** Rendered only when it can do something — `onClick` is not optional. */
    primaryAction?: {
        label: string;
        icon?: LucideIcon;
        onClick: () => void;
    };
    /** Omit and no search box is drawn. Called on submit and on clear. */
    onSearch?: (query: string) => void;
    searchPlaceholder?: string;
    /** Omit and no Filter button is drawn. */
    onFilter?: () => void;
    /** Omit and no Export button is drawn. */
    onExport?: () => void;
}

export function ReadyUI({
    title,
    description,
    moduleName,
    stats = [],
    children,
    primaryAction,
    onSearch,
    searchPlaceholder,
    onFilter,
    onExport,
}: ReadyUIProps) {
    const [query, setQuery] = useState('');

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch?.(query.trim());
    };

    const clearSearch = () => {
        setQuery('');
        onSearch?.('');
    };

    const showControls = Boolean(onSearch || onFilter);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 relative">
            <div className="flex flex-col gap-6 mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                    <div className="space-y-1">
                        {moduleName && (
                            <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-primary-600 bg-primary-50 px-2 py-0.5 border border-primary-100">
                                {moduleName}
                            </span>
                        )}
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{title}</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 dark:text-slate-400 font-medium">{description}</p>
                    </div>

                    {(onExport || primaryAction) && (
                        <div className="flex items-center gap-2">
                            {onExport && (
                                <button
                                    type="button"
                                    onClick={onExport}
                                    className="inline-flex items-center justify-center h-10 px-5 text-[10px] font-bold uppercase tracking-widest rounded-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95"
                                >
                                    <Download size={14} className="mr-2" />
                                    Export
                                </button>
                            )}
                            {primaryAction && (
                                <button
                                    type="button"
                                    onClick={primaryAction.onClick}
                                    className="inline-flex items-center justify-center h-10 px-6 text-[10px] font-bold uppercase tracking-widest rounded-none bg-primary-600 text-white hover:bg-primary-700 shadow-lg shadow-primary-500/20 border border-transparent transition-all active:scale-95"
                                >
                                    {primaryAction.icon && <primaryAction.icon size={16} className="mr-2" />}
                                    {primaryAction.label}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {stats.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border border-slate-100 dark:border-slate-800">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className={`p-8 bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 relative overflow-hidden ${
                                    index !== stats.length - 1 ? 'lg:border-r' : ''
                                } ${index >= 2 ? 'md:border-t lg:border-t-0' : ''}`}
                            >
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`p-3 ${stat.color} bg-opacity-[0.08] border border-current border-opacity-20`}>
                                        <stat.icon className={`w-6 h-6 ${stat.color.replace('bg-', 'text-')}`} strokeWidth={2.5} />
                                    </div>
                                    {stat.change && (
                                        <div className={`text-[11px] font-black ${
                                            stat.trend === 'up' ? 'text-emerald-600' : 'text-rose-600'
                                        }`}>
                                            {stat.change}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
                                    <h3 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tighter">{stat.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showControls && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
                    {onSearch && (
                        <form onSubmit={submitSearch} className="relative w-full sm:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-400" size={18} />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                aria-label={`Search ${title.toLowerCase()}`}
                                placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}...`}
                                className="w-full pl-11 pr-10 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500/10 focus:border-primary-500 transition-all placeholder:text-slate-400 dark:text-slate-400 uppercase tracking-wider"
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    aria-label="Clear search"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </form>
                    )}
                    {onFilter && (
                        <button
                            type="button"
                            onClick={onFilter}
                            className="inline-flex items-center justify-center h-11 px-6 text-[10px] font-bold uppercase tracking-widest rounded-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm transition-all active:scale-95"
                        >
                            <Filter size={16} className="mr-2" />
                            Filter
                        </button>
                    )}
                </div>
            )}

            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <div className="relative h-full p-6">{children}</div>
            </div>
        </div>
    );
}
