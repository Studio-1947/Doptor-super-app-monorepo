'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { organisationService, Organisation } from '../services/organisation.service';

export type VerticalType = 'core' | 'office' | 'campus';

export interface VerticalThemeTokens {
    label: string;
    accent: string;
    textClass: string;
    bgClass: string;
    activeBgClass: string;
    borderClass: string;
}

// Lifted verbatim from the old local `verticals` array in VerticalSwitcher —
// centralized here so any component (Header, Sidebar, per-vertical layouts)
// can apply the same accent without redefining it.
export const verticalTheme: Record<VerticalType, VerticalThemeTokens> = {
    core: {
        label: 'Dashboard',
        accent: 'primary',
        textClass: 'text-primary-600 dark:text-primary-400',
        bgClass: 'bg-primary-50 dark:bg-primary-900/20',
        activeBgClass: 'bg-primary-50 dark:bg-primary-900/20',
        borderClass: 'border-primary-200 dark:border-primary-800',
    },
    office: {
        label: 'Office',
        accent: 'indigo',
        textClass: 'text-indigo-600 dark:text-indigo-400',
        bgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
        activeBgClass: 'bg-indigo-50 dark:bg-indigo-900/20',
        borderClass: 'border-indigo-200 dark:border-indigo-800',
    },
    campus: {
        label: 'Campus',
        accent: 'emerald',
        textClass: 'text-emerald-600 dark:text-emerald-400',
        bgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
        activeBgClass: 'bg-emerald-50 dark:bg-emerald-900/20',
        borderClass: 'border-emerald-200 dark:border-emerald-800',
    },
};

interface VerticalContextType {
    activeVertical: VerticalType;
    setActiveVertical: (vertical: VerticalType) => void;
    enabledVerticals: VerticalType[];
    organisation: Organisation | null;
    isLoading: boolean;
}

/**
 * The verticals that actually have a product behind them.
 *
 * This stays a whitelist rather than becoming `Object.keys(verticalTheme)`
 * because `enabled_verticals` is stored per organisation and can name things
 * this build no longer knows about. `network` is the live example: it was
 * offered on the signup form as "Volunteer management, Campaigns" while having
 * **no backend module at all**, and was deleted on 2026-07-28 (backlog M-18) —
 * but every organisation that selected it still has `"network"` sitting in its
 * row. This filter is what keeps that stale value from reaching the UI.
 *
 * Anything not listed here is dropped silently, which is the correct failure
 * mode for a value that names a product we do not ship.
 *
 * `campus` is **disabled rather than deleted** (2026-07-28): Office is the only
 * product being sold right now. Unlike `network`, Campus is real — a working
 * org-scoped backend, exams/results, timetable, its own migrations — so its
 * code, routes and tests all stay. Re-enabling it is adding one string back to
 * this array; nothing else was removed.
 */
const SHIPPABLE_VERTICALS: VerticalType[] = ['office'];

const VerticalContext = createContext<VerticalContextType | undefined>(undefined);

function verticalFromPathname(pathname: string): VerticalType {
    if (pathname.startsWith('/office')) return 'office';
    if (pathname.startsWith('/campus')) return 'campus';
    return 'core';
}

export function VerticalProvider({ children }: { children: React.ReactNode }) {
    const { user, isLoading: authLoading } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const [organisation, setOrganisation] = useState<Organisation | null>(null);
    const [enabledVerticals, setEnabledVerticals] = useState<VerticalType[]>(['core']);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Wait for auth before concluding anything.
        //
        // `user` is null on mount while AuthContext fetches /auth/me. Without
        // this branch that looked identical to "signed in, but the org has no
        // verticals": the effect below fell through to `enabledVerticals =
        // ['core']` *and cleared isLoading*, which unblocked the redirect at the
        // bottom of this file and bounced the visitor to '/'.
        //
        // The effect was that a **fresh load of any /office or /campus URL
        // redirected to the dashboard** — bookmarks, refreshes, deep links and
        // anything opened in a new tab. Clicking through the app from '/' worked,
        // because by then this provider had already resolved, which is why it
        // survived so long unnoticed. It is not reachable from an API test and
        // it is not a type error; it took driving a browser to see it.
        if (authLoading) {
            setIsLoading(true);
            return;
        }

        if (!user?.organisation_id) {
            setOrganisation(null);
            setEnabledVerticals(['core']);
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);

        organisationService.getById(user.organisation_id)
            .then((org) => {
                if (cancelled) return;
                setOrganisation(org);
                const real = (org.enabled_verticals || []).filter(
                    (v): v is VerticalType => SHIPPABLE_VERTICALS.includes(v as VerticalType),
                );
                setEnabledVerticals(['core', ...real]);
            })
            .catch(() => {
                if (cancelled) return;
                // Fail closed: only show the always-available core vertical
                // rather than silently granting access to unconfirmed ones.
                setOrganisation(null);
                setEnabledVerticals(['core']);
            })
            .finally(() => {
                if (!cancelled) setIsLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [authLoading, user?.organisation_id]);

    const activeVertical = verticalFromPathname(pathname || '/');

    // Icon rail only hides disabled verticals from the switcher — it never
    // stopped a direct URL (bookmark, typed link, stale link) from fully
    // rendering a vertical the org hasn't enabled. Bounce back to core once
    // we actually know the real enabled list (not during the initial fetch,
    // to avoid a false-positive redirect before enabledVerticals has loaded).
    useEffect(() => {
        if (isLoading) return;
        if (activeVertical !== 'core' && !enabledVerticals.includes(activeVertical)) {
            router.replace('/');
        }
    }, [activeVertical, enabledVerticals, isLoading, router]);

    const setActiveVertical = (vertical: VerticalType) => {
        router.push(vertical === 'core' ? '/' : `/${vertical}`);
    };

    const value: VerticalContextType = {
        activeVertical,
        setActiveVertical,
        enabledVerticals,
        organisation,
        isLoading,
    };

    return (
        <VerticalContext.Provider value={value}>
            {children}
        </VerticalContext.Provider>
    );
}

export function useVertical() {
    const context = useContext(VerticalContext);
    if (context === undefined) {
        throw new Error('useVertical must be used within a VerticalProvider');
    }
    return context;
}
