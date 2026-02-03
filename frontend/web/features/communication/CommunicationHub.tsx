"use client";

import { Card, Button } from '@doptor/shared';
import { Search, PenSquare, MessageSquare, Bell, Image as ImageIcon, Paperclip, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { useState } from 'react';

const CHANNELS = [
    { id: 1, name: 'General', type: 'channel', unread: 0 },
    { id: 2, name: 'Announcements', type: 'channel', unread: 2 },
    { id: 3, name: 'Marketing Team', type: 'channel', unread: 0 },
    { id: 4, name: 'Project Alpha', type: 'channel', unread: 5 },
];

const DMS = [
    { id: 5, name: 'John Doe', status: 'online', unread: 0 },
    { id: 6, name: 'Sarah Manager', status: 'busy', unread: 1 },
    { id: 7, name: 'Mike Designer', status: 'offline', unread: 0 },
];

const MESSAGES = [
    { id: 1, sender: 'John Doe', text: 'Hey team, just a reminder about the meeting at 2 PM.', time: '10:30 AM', isSelf: false },
    { id: 2, sender: 'You', text: 'Thanks John, I will be there.', time: '10:32 AM', isSelf: true },
    { id: 3, sender: 'Sarah Manager', text: 'Can someone bring the latest analytics report?', time: '10:45 AM', isSelf: false },
    { id: 4, sender: 'You', text: 'Sure, I have it ready. Sending it now.', time: '10:46 AM', isSelf: true },
];

export function CommunicationHub() {
    const [activeTab, setActiveTab] = useState<'chat' | 'notices'>('chat');

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Sidebar */}
            <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200">
                    <div className="flex bg-white rounded-lg p-1 border border-slate-200 mb-4">
                        <button
                            onClick={() => setActiveTab('chat')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'chat' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <MessageSquare size={16} />
                                Chat
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('notices')}
                            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'notices' ? 'bg-primary-50 text-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <div className="flex items-center justify-center gap-2">
                                <Bell size={16} />
                                Notices
                            </div>
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-6">
                    {/* Channels */}
                    <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Channels</h3>
                            <button className="text-slate-400 hover:text-primary-600"><PenSquare size={14} /></button>
                        </div>
                        <div className="space-y-1">
                            {CHANNELS.map(channel => (
                                <div key={channel.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer transition-all group">
                                    <div className="flex items-center gap-2">
                                        <span className="text-slate-400">#</span>
                                        <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{channel.name}</span>
                                    </div>
                                    {channel.unread > 0 && (
                                        <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{channel.unread}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* DMs */}
                    <div>
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Direct Messages</h3>
                            <button className="text-slate-400 hover:text-primary-600"><PenSquare size={14} /></button>
                        </div>
                        <div className="space-y-1">
                            {DMS.map(dm => (
                                <div key={dm.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer transition-all">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                            {dm.name.substring(0, 2)}
                                        </div>
                                        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-50 ${dm.status === 'online' ? 'bg-green-500' : dm.status === 'busy' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-700">{dm.name}</p>
                                    </div>
                                    {dm.unread > 0 && (
                                        <span className="bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{dm.unread}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            {activeTab === 'chat' ? (
                <div className="flex-1 flex flex-col bg-slate-50/50">
                    <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <span className="text-slate-400 font-bold text-lg">#</span>
                            </div>
                            <div>
                                <h2 className="font-bold text-slate-900">Project Alpha</h2>
                                <p className="text-xs text-slate-500">24 members • 3 online</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg"><Phone size={20} /></button>
                            <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg"><Video size={20} /></button>
                            <button className="p-2 text-slate-400 hover:text-primary-600 hover:bg-slate-50 rounded-lg"><MoreVertical size={20} /></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Messages */}
                        {MESSAGES.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 ${msg.isSelf ? 'flex-row-reverse' : ''}`}>
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">
                                    {msg.sender.substring(0, 2)}
                                </div>
                                <div className={`flex flex-col ${msg.isSelf ? 'items-end max-w-[70%]' : 'items-start max-w-[70%]'}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-900">{msg.sender}</span>
                                        <span className="text-[10px] text-slate-400">{msg.time}</span>
                                    </div>
                                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.isSelf ? 'bg-primary-600 text-white rounded-tr-none' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 bg-white border-t border-slate-200">
                        <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                            <div className="flex gap-1 pb-1">
                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><ImageIcon size={20} /></button>
                                <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"><Paperclip size={20} /></button>
                            </div>
                            <textarea
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 max-h-32 resize-none"
                                rows={1}
                            />
                            <button className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm mb-0.5">
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-8 bg-slate-50/50 flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
                            <Bell size={32} className="text-primary-500" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">Notice Board</h2>
                        <p className="text-slate-500 max-w-sm mt-2">Important announcements and office notices will appear here.</p>
                        <Button className="mt-6">Post New Notice</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
