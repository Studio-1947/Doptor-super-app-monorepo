"use client";

import { Card, Button } from '@doptor/shared';
import { Search, PenSquare, MessageSquare, Bell, Image as ImageIcon, Paperclip, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

// Types (should ideally be shared or imported from types file)
type Message = {
    id: string;
    senderId: string;
    content: string;
    createdAt: string;
    isSelf?: boolean; // Derived on frontend
    sender?: {
        name?: string; // Optional depending on how populate works
    }
};

type Conversation = {
    id: string;
    name: string;
    type: string;
    unread?: number;
};

// Placeholder for current user ID - in real app this comes from Auth Context
const CURRENT_USER_ID = "user-uuid-placeholder";

export function CommunicationHub() {
    const [activeTab, setActiveTab] = useState<'chat' | 'notices'>('chat');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isConnected, setIsConnected] = useState(false);

    // For now, hardcoding a conversation ID to join on mount
    const [activeConversationId, setActiveConversationId] = useState<string>("default-room-id");

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        // Connect to Socket.IO Server
        // URL should effectively be env variable, assuming localhost:3000 for now or wherever backend runs
        const newSocket = io('http://localhost:3000/communication', {
            transports: ['websocket'],
        });

        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to WebSocket');
            setIsConnected(true);
            // Join the default room
            newSocket.emit('joinRoom', activeConversationId);
        });

        newSocket.on('disconnect', () => {
            console.log('Disconnected');
            setIsConnected(false);
        });

        newSocket.on('newMessage', (message: Message) => {
            console.log('New message received:', message);
            setMessages((prev) => [...prev, {
                ...message,
                isSelf: message.senderId === CURRENT_USER_ID, // Use senderId to check ownership
            }]);
            scrollToBottom();
        });

        return () => {
            newSocket.disconnect();
        };
    }, [activeConversationId]);

    // Fetch initial messages (Mocking API call for now, but structure is there)
    useEffect(() => {
        // In a real scenario: fetch(`/api/communication/conversations/${activeConversationId}/messages`)
        // .then(res => res.json())
        // .then(data => setMessages(data));

        // Setting empty for now until real API is hit or real messages arrive
    }, [activeConversationId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !socket) return;

        const payload = {
            conversationId: activeConversationId,
            content: inputValue,
            userId: CURRENT_USER_ID,
        };

        // Optimistic update can happen here
        // setMessages(prev => [...prev, { ...tempMessage }]); if desired

        socket.emit('sendMessage', payload);
        setInputValue("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            {/* Sidebar (simplified for now to focus on chat) */}
            <div className="w-80 border-r border-slate-100 flex flex-col bg-slate-50/30">
                <div className="p-4 border-b border-slate-100">
                    <h2 className="font-semibold text-slate-800 text-sm tracking-tight">Channels</h2>
                </div>
                <div className="p-4">
                    <div className="text-sm text-slate-500">
                        Sidebar content (Channels/DMs) will be populated here.
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            {activeTab === 'chat' ? (
                <div className="flex-1 flex flex-col bg-white">
                    <div className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center">
                                <span className="text-slate-400 font-bold text-lg">#</span>
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-800 text-sm">General</h2>
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">{isConnected ? 'Online' : 'Reconnecting...'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                                <MessageSquare size={32} className="opacity-20" />
                                <p className="text-sm">No messages yet. Say hello!</p>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex gap-3 group ${msg.isSelf ? 'flex-row-reverse' : ''}`}>
                                <div className="w-8 h-8 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                                    {(msg.sender?.name || 'U').substring(0, 2)}
                                </div>
                                <div className={`flex flex-col ${msg.isSelf ? 'items-end' : 'items-start'} max-w-[70%]`}>
                                    <div className="flex items-center gap-2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-[11px] font-semibold text-slate-700">{msg.sender?.name || 'User'}</span>
                                        <span className="text-[10px] text-slate-400">
                                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm border ${msg.isSelf ? 'bg-slate-900 text-white border-slate-900 rounded-2xl rounded-tr-sm' : 'bg-white text-slate-700 border-slate-200 rounded-2xl rounded-tl-sm'}`}>
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="p-4 bg-white border-t border-slate-100">
                        <div className="flex items-end gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 focus-within:ring-1 focus-within:ring-slate-300 focus-within:border-slate-300 transition-all">
                            <textarea
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Type a message..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2.5 max-h-32 resize-none placeholder:text-slate-400 text-slate-700"
                                rows={1}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!inputValue.trim()}
                                className="p-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition-colors shadow-sm mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 p-8 bg-slate-50/50 flex items-center justify-center">
                    <div>Notice Board Placeholder</div>
                </div>
            )}
        </div>
    );
}
