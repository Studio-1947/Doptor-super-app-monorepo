"use client";

import { useCallback, useEffect, useState } from 'react';

interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
    reload: () => void;
}

/**
 * Loads dashboard data once on mount, with an explicit error state.
 *
 * The dashboards deliberately distinguish "still loading" from "loaded and
 * genuinely zero" — a new organisation has real zeros everywhere, and those
 * must be shown as zeros rather than hidden behind a spinner or, worse,
 * replaced with a plausible-looking placeholder.
 */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [nonce, setNonce] = useState(0);

    const reload = useCallback(() => setNonce((n) => n + 1), []);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);

        fn()
            .then((result) => { if (!cancelled) setData(result); })
            .catch((err: unknown) => {
                if (cancelled) return;
                const message = err instanceof Error ? err.message : 'Could not load this data.';
                setError(message);
            })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, nonce]);

    return { data, loading, error, reload };
}
