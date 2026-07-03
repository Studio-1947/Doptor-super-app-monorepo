'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';
import { organisationService, Organisation } from '../services/organisation.service';

export type VerticalType = 'core' | 'office' | 'campus' | 'network';

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
    network: {
        label: 'Network',
        accent: 'rose',
        textClass: 'text-rose-600 dark:text-rose-400',
        bgClass: 'bg-rose-50 dark:bg-rose-900/20',
        activeBgClass: 'bg-rose-50 dark:bg-rose-900/20',
        borderClass: 'border-rose-200 dark:border-rose-800',
    },
};

interface VerticalContextType {
    activeVertical: VerticalType;
    setActiveVertical: (vertical: VerticalType) => void;
    enabledVerticals: VerticalType[];
    organisation: Organisation | null;
    isLoading: boolean;
}

const VerticalContext = createContext<VerticalContextType | undefined>(undefined);

function verticalFromPathname(pathname: string): VerticalType {
    if (pathname.startsWith('/office')) return 'office';
    if (pathname.startsWith('/campus')) return 'campus';
    if (pathname.startsWith('/network')) return 'network';
    return 'core';
}

export function VerticalProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const pathname = usePathname();
    const router = useRouter();

    const [organisation, setOrganisation] = useState<Organisation | null>(null);
    const [enabledVerticals, setEnabledVerticals] = useState<VerticalType[]>(['core']);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
                    (v): v is VerticalType => v === 'office' || v === 'campus' || v === 'network',
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
    }, [user?.organisation_id]);

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
