"use client";

import { useCallback, useEffect, useState } from 'react';
import {
    Bell, Check, CheckCheck, CheckSquare, MessageCircle,
    Send, ThumbsUp, XCircle, Loader2, Paperclip,
    CalendarCheck, CalendarClock, CalendarX, FileCheck, FileX,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
    notificationsService,
    AppNotification,
} from '@/services/notifications.service';

const PAGE_SIZE = 20;

/** Keep in step with NotificationType; unknown kinds fall back to the bell. */
function iconFor(type: string) {
    switch (type) {
        case 'task_assigned': return <CheckSquare size={16} className="text-blue-500" />;
        case 'task_commented': return <MessageCircle size={16} className="text-purple-500" />;
        case 'task_attachment_added': return <Paperclip size={16} className="text-slate-500 dark:text-slate-400" />;
        case 'file_forwarded': return <Send size={16} className="text-indigo-500" />;
        case 'file_approved': return <ThumbsUp size={16} className="text-emerald-500" />;
        case 'file_rejected': return <XCircle size={16} className="text-red-500" />;
        case 'leave_requested': return <CalendarClock size={16} className="text-amber-500" />;
        case 'leave_approved': return <CalendarCheck size={16} className="text-emerald-500" />;
        case 'leave_rejected': return <CalendarX size={16} className="text-red-500" />;
        case 'document_approved': return <FileCheck size={16} className="text-emerald-500" />;
        case 'document_rejected': return <FileX size={16} className="text-red-500" />;
        default: return <Bell size={16} className="text-slate-500 dark:text-slate-400" />;
    }
}

/**
 * Full-page notification list (route: /notifications). The header bell shows
 * only the most recent few; this view paginates the whole history. Both read
 * from the same real notifications service.
 */
export function NotificationCenter() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [items, setItems] = useState<AppNotification[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [unread, setUnread] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = useCallback(() => {
        setLoading(true);
        Promise.all([
            notificationsService.list({ page, limit: PAGE_SIZE, unreadOnly: activeTab === 'unread' }),
            notificationsService.unreadCount(),
        ])
            .then(([list, count]) => {
                setItems(list.data);
                setTotalPages(list.totalPages);
                setUnread(count);
            })
            .catch(() => setItems([]))
            .finally(() => setLoading(false));
    }, [page, activeTab]);

    useEffect(() => { load(); }, [load]);

    const switchTab = (tab: 'all' | 'unread') => { setActiveTab(tab); setPage(1); };

    const markOne = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await notificationsService.markRead(id);
            setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
            setUnread((u) => Math.max(0, u - 1));
        } catch { /* ignore */ }
    };

    const markAll = async () => {
        try {
            await notificationsService.markAllRead();
            setUnread(0);
            if (activeTab === 'unread') load();
            else setItems((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })));
        } catch { /* ignore */ }
    };

    const open = async (n: AppNotification) => {
        if (!n.read_at) {
            try {
                await notificationsService.markRead(n.id);
                setUnread((u) => Math.max(0, u - 1));
            } catch { /* navigation proceeds regardless */ }
        }
        if (n.link) router.push(n.link);
    };

    return (
        <div className="w-full max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    Notifications
                    {unread > 0 && (
                        <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                            {unread}
                        </span>
                    )}
                </h3>
                {unread > 0 && (
                    <button onClick={markAll} className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-700 font-medium flex items-center gap-1">
                        <CheckCheck size={14} /> Mark all read
                    </button>
                )}
            </div>

            <div className="flex border-b border-slate-100 dark:border-slate-800 shrink-0">
                {(['all', 'unread'] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => switchTab(tab)}
                        className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 capitalize ${activeTab === tab ? 'text-primary-600 dark:text-primary-400 border-primary-500 bg-primary-50/50 dark:bg-primary-900/10' : 'text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        {tab}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto min-h-[300px]">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <Loader2 className="animate-spin text-slate-400" size={22} />
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 p-8 text-center">
                        <Bell size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">No notifications to show</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50 dark:divide-slate-800">
                        {items.map((n) => (
                            <div
                                key={n.id}
                                onClick={() => open(n)}
                                className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer relative group ${!n.read_at ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}
                            >
                                {!n.read_at && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary-500" />}
                                <div className="flex gap-3">
                                    <div className="mt-0.5 w-8 h-8 rounded-full border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0 bg-white dark:bg-slate-800 shadow-sm">
                                        {iconFor(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!n.read_at ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                            {n.title}
                                        </p>
                                        {n.body && (
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{n.body}</p>
                                        )}
                                        <p className="text-[10px] text-slate-400 mt-1.5">
                                            {n.actor ? `${n.actor.first_name} ${n.actor.last_name} · ` : ''}
                                            {new Date(n.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {!n.read_at && (
                                        <button
                                            onClick={(e) => markOne(n.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-all self-start"
                                            title="Mark as read"
                                        >
                                            <Check size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-primary-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            Prev
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 hover:border-primary-500 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
