"use client";

import { useState } from 'react';
import { Card, Button } from '@doptor/shared'; // Assuming shared components exist
import { Megaphone, Mail, Search, Paperclip, Clock, ChevronRight } from 'lucide-react';

export function CommunicationDashboard() {
    const [activeTab, setActiveTab] = useState<'announcements' | 'messages'>('announcements');

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900">Communication Center</h2>
                <p className="text-slate-500">Stay updated with campus news and direct messages.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('announcements')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'announcements'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Megaphone size={16} />
                    Announcements
                </button>
                <button
                    onClick={() => setActiveTab('messages')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'messages'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <Mail size={16} />
                    Messages
                </button>
            </div>

            {activeTab === 'announcements' ? <AnnouncementsList /> : <MessagesList />}
        </div>
    );
}

function AnnouncementsList() {
    const announcements = [
        {
            id: 1,
            title: "Annual Sports Meet Registration Open",
            category: "Events",
            date: "2 hours ago",
            preview: "Registration for the annual inter-department sports meet is now open. All students are encouraged to participate...",
            important: true
        },
        {
            id: 2,
            title: "Library Maintenance Schedule",
            category: "Facility",
            date: "Yesterday",
            preview: "The central library will be closed for maintenance this Sunday. Please plan your study hours accordingly...",
            important: false
        },
        {
            id: 3,
            title: "Guest Lecture: AI in Healthcare",
            category: "Academic",
            date: "2 days ago",
            preview: "Join us for an insightful session with Dr. Alan Grant on the impact of Artificial Intelligence in modern diagnostics...",
            important: false
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search announcements..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
            </div>

            {announcements.map((item) => (
                <Card key={item.id} className="p-4 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${item.important ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                            <Megaphone size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                                <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                                <span className="text-xs text-slate-500 whitespace-nowrap">{item.date}</span>
                            </div>
                            <p className="text-slate-600 text-sm mb-2 line-clamp-2">{item.preview}</p>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                                    {item.category}
                                </span>
                                {item.important && (
                                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold uppercase tracking-wider">
                                        Important
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}

function MessagesList() {
    const messages = [
        {
            id: 1,
            sender: "Dr. Sarah Smith",
            subject: "Project Submission Verification",
            preview: "I have reviewed your draft and have a few comments regarding the methodology section...",
            time: "10:30 AM",
            hasAttachment: true,
            unread: true
        },
        {
            id: 2,
            sender: "Registrar Office",
            subject: "Fee Payment Confirmation",
            preview: "This is to acknowledge the receipt of your semester fees. Please find the receipt attached...",
            time: "Yesterday",
            hasAttachment: true,
            unread: false
        },
        {
            id: 3,
            sender: "Class Representative",
            subject: "Notes for History 101",
            preview: "Hey, here are the notes from yesterday's lecture in case you missed it...",
            time: "Mon",
            hasAttachment: false,
            unread: false
        }
    ];

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search messages..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    Compose
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {messages.map((msg) => (
                    <div key={msg.id} className={`p-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors ${msg.unread ? 'bg-indigo-50/30' : ''}`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {msg.sender.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <h4 className={`text-sm ${msg.unread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                                    {msg.sender}
                                </h4>
                                <span className="text-xs text-slate-500">{msg.time}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-800 mb-0.5 truncate">{msg.subject}</p>
                            <p className="text-xs text-slate-500 truncate flex items-center gap-2">
                                {msg.preview}
                                {msg.hasAttachment && <Paperclip size={12} className="text-slate-400" />}
                            </p>
                        </div>
                        {msg.unread && (
                            <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
