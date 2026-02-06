"use client";

import { useState } from 'react';
import {
    Bell,
    Check,
    CheckCheck,
    Info,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    MessageCircle,
    X
} from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { useRouter } from 'next/navigation';
import {
    MOCK_NOTIFICATIONS,
    Notification,
    getNotifications,
    markAsRead,
    markAllAsRead
} from './notifications-mock.db';

export function NotificationCenter() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
    const [notifications, setNotifications] = useState<Notification[]>(getNotifications('u1'));
    const [isOpen, setIsOpen] = useState(false); // For dropdown mode if needed, but managing as panel/page here for now

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkRead = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        markAsRead(id);
        setNotifications([...notifications]); // Trigger re-render
    };

    const handleMarkAllRead = () => {
        markAllAsRead('u1');
        setNotifications([...notifications]);
    };

    const handleNotificationClick = (notification: Notification) => {
        if (!notification.isRead) {
            markAsRead(notification.id);
            setNotifications([...notifications]);
        }
        if (notification.link) {
            router.push(notification.link);
        }
    };

    const filteredNotifications = activeTab === 'all'
        ? notifications
        : notifications.filter(n => !n.isRead);

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'info': return <Info size={16} className="text-blue-500" />;
            case 'warning': return <AlertTriangle size={16} className="text-orange-500" />;
            case 'success': return <CheckCircle2 size={16} className="text-emerald-500" />;
            case 'error': return <XCircle size={16} className="text-red-500" />;
            case 'mention': return <MessageCircle size={16} className="text-purple-500" />;
            default: return <Bell size={16} className="text-slate-500" />;
        }
    };

    return (
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-xl shadow-lg flex flex-col h-[500px]">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    Notifications
                    {unreadCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] text-center">
                            {unreadCount}
                        </span>
                    )}
                </h3>
                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                        <CheckCheck size={14} /> Mark all read
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 shrink-0">
                <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'all'
                        ? 'text-primary-600 border-primary-500 bg-primary-50/50'
                        : 'text-slate-500 border-transparent hover:bg-slate-50'
                        }`}
                >
                    All
                </button>
                <button
                    onClick={() => setActiveTab('unread')}
                    className={`flex-1 py-2 text-xs font-semibold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'unread'
                        ? 'text-primary-600 border-primary-500 bg-primary-50/50'
                        : 'text-slate-500 border-transparent hover:bg-slate-50'
                        }`}
                >
                    Unread
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-slate-400 p-8 text-center">
                        <Bell size={32} className="mb-2 opacity-20" />
                        <p className="text-sm">No notifications to show</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {filteredNotifications.map(notification => (
                            <div
                                key={notification.id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer relative group ${!notification.isRead ? 'bg-blue-50/30' : ''
                                    }`}
                            >
                                {!notification.isRead && (
                                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary-500" />
                                )}

                                <div className="flex gap-3">
                                    <div className={`mt-0.5 w-8 h-8 rounded-full border border-slate-100 flex items-center justify-center shrink-0 bg-white shadow-sm`}>
                                        {getIcon(notification.type)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                                            {notification.title}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1.5">
                                            {new Date(notification.createdAt).toLocaleString()}
                                        </p>
                                    </div>

                                    {!notification.isRead && (
                                        <button
                                            onClick={(e) => handleMarkRead(notification.id, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-full transition-all self-start"
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
        </div>
    );
}
