"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Loader2 } from 'lucide-react';
import {
    notificationsService,
    AppNotification,
} from '@/services/notifications.service';

// How often the bell re-checks the unread count. Polling (rather than a socket)
// keeps this dependency-free; the office suite has no authenticated socket yet.
const POLL_MS = 60_000;

function timeAgo(iso: string): string {
    const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
    if (secs < 60) return 'just now';
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);
    const [items, setItems] = useState<AppNotification[]>([]);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const refreshCount = useCallback(() => {
        notificationsService.unreadCount().then(setUnread).catch(() => {});
    }, []);

    // Poll the unread count. Failures are ignored so a transient network blip
    // never surfaces an error in the header.
    useEffect(() => {
        refreshCount();
        const id = setInterval(refreshCount, POLL_MS);
        return () => clearInterval(id);
    }, [refreshCount]);

    // Close on outside click.
    useEffect(() => {
        if (!open) return;
        const onClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, [open]);

    const loadList = useCallback(() => {
        setLoading(true);
        notificationsService
            .list({ limit: 15 })
            .then((res) => setItems(res.data))
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, []);

    const toggle = () => {
        const next = !open;
        setOpen(next);
        if (next) loadList();
    };

    const openNotification = async (n: AppNotification) => {
        setOpen(false);
        if (!n.read_at) {
            try {
                await notificationsService.markRead(n.id);
                setUnread((u) => Math.max(0, u - 1));
                setItems((prev) =>
                    prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)),
                );
            } catch {
                /* navigation still proceeds */
            }
        }
        if (n.link) router.push(n.link);
    };

    const markAll = async () => {
        try {
            await notificationsService.markAllRead();
            setUnread(0);
            setItems((prev) => prev.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })));
        } catch {
            /* ignore */
        }
    };

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={toggle}
                aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
                className="relative p-2 text-slate-500 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-none hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800"
            >
                <Bell size={20} />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-none bg-primary-500 text-white text-[9px] font-black flex items-center justify-center">
                        {unread > 9 ? '9+' : unread}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-50 flex flex-col max-h-[70vh]">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-900 dark:text-white">
                            Notifications
                        </span>
                        {unread > 0 && (
                            <button
                                onClick={markAll}
                                className="text-[10px] font-bold uppercase tracking-wider text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                            >
                                <CheckCheck size={12} /> Mark all read
                            </button>
                        )}
                    </div>

                    <div className="overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="animate-spin text-slate-400" size={20} />
                            </div>
                        ) : items.length === 0 ? (
                            <p className="text-center text-sm text-slate-400 py-10">You&apos;re all caught up</p>
                        ) : (
                            items.map((n) => (
                                <button
                                    key={n.id}
                                    onClick={() => openNotification(n)}
                                    className={`w-full text-left px-4 py-3 border-b border-slate-50 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex gap-3 ${n.read_at ? '' : 'bg-primary-50/40 dark:bg-primary-900/10'}`}
                                >
                                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.read_at ? 'bg-transparent' : 'bg-primary-500'}`} />
                                    <span className="min-w-0 flex-1">
                                        <span className="block text-sm font-semibold text-slate-900 dark:text-white truncate">
                                            {n.title}
                                        </span>
                                        {n.body && (
                                            <span className="block text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                                                {n.body}
                                            </span>
                                        )}
                                        <span className="block text-[10px] text-slate-400 mt-0.5">
                                            {n.actor ? `${n.actor.first_name} ${n.actor.last_name} · ` : ''}{timeAgo(n.created_at)}
                                        </span>
                                    </span>
                                    {!n.read_at && <Check size={14} className="text-slate-300 shrink-0 mt-1" />}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
