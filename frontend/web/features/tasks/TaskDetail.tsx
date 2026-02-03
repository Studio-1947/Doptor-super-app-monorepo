"use client";

import { Card, Button } from '@doptor/shared';
import { Calendar, Flag, User, Paperclip, MessageSquare, CheckSquare, MoreHorizontal, X, Send } from 'lucide-react';

export function TaskDetail() {
    return (
        <Card className="h-full flex flex-col overflow-hidden border-l border-slate-200 rounded-none md:rounded-xl shadow-none md:shadow-sm">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 md:hidden">
                        <X size={18} />
                    </Button>
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">TASK-1023</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">Mark Complete</Button>
                    <button className="p-2 text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {/* Title & Metadata */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-4">Fix navigation bug on mobile</h1>
                    <div className="flex flex-wrap gap-4">
                        <MetaItem icon={User} label="Assignee" value="John Doe" />
                        <MetaItem icon={Calendar} label="Due Date" value="Tomorrow" highlight />
                        <MetaItem icon={Flag} label="Priority" value="Critical" color="text-red-600" />
                        <MetaItem icon={Paperclip} label="Project" value="App Core" />
                    </div>
                </div>

                {/* Description */}
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-900 mb-2">Description</h3>
                    <div className="text-slate-600 text-sm leading-relaxed space-y-2">
                        <p>The navigation menu is not collapsing correctly on iOS devices when selecting an item. This seems to be related to the recent animation changes.</p>
                        <ul className="list-disc pl-5">
                            <li>Reproducible on iPhone 12/13/14</li>
                            <li>Only happens in Safari</li>
                            <li>Check the transition-end event listeners</li>
                        </ul>
                    </div>
                </div>

                {/* Subtasks */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-slate-900">Subtasks (2/3)</h3>
                        <button className="text-xs text-primary-600 font-medium hover:underline">+ Add Subtask</button>
                    </div>
                    <div className="space-y-2">
                        <SubtaskItem label="Debug on Simulator" completed />
                        <SubtaskItem label="Fix CSS transition conflict" completed />
                        <SubtaskItem label="Verify on physical device" />
                    </div>
                </div>

                {/* Attachments */}
                <div className="mb-8">
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">Attachments</h3>
                    <div className="flex gap-3">
                        <div className="w-24 h-24 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center relative group cursor-pointer overflow-hidden">
                            <span className="text-xs font-medium text-slate-500">screenshot.png</span>
                        </div>
                    </div>
                </div>

                {/* Activity / Comments */}
                <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4">Activity</h3>
                    <div className="space-y-4">
                        <Comment
                            user="Sarah Smith"
                            time="2 hours ago"
                            text="I noticed this too on my iPad. Might be a WebKit specific issue."
                        />
                        <Comment
                            user="John Doe"
                            time="1 hour ago"
                            text="Thanks Sarah. I'll take a look at the -webkit-transform properties."
                            isSelf
                        />
                    </div>

                    {/* Input */}
                    <div className="mt-4 flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">JD</div>
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                placeholder="Add a comment..."
                                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                            <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors">
                                <Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}

function MetaItem({ icon: Icon, label, value, highlight, color }: any) {
    return (
        <div className="flex items-center gap-2 text-sm">
            <div className="p-1.5 rounded-full bg-slate-50 text-slate-400">
                <Icon size={14} />
            </div>
            <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-medium leading-none mb-0.5 uppercase tracking-wide">{label}</span>
                <span className={`font-medium ${color || 'text-slate-700'} ${highlight ? 'text-red-600' : ''}`}>{value}</span>
            </div>
        </div>
    );
}

function SubtaskItem({ label, completed }: any) {
    return (
        <div className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg group transition-colors cursor-pointer">
            <button className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${completed ? 'bg-primary-500 border-primary-500 text-white' : 'border-slate-300 text-transparent hover:border-primary-500'}`}>
                <CheckSquare size={12} strokeWidth={3} />
            </button>
            <span className={`text-sm ${completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{label}</span>
        </div>
    );
}

function Comment({ user, time, text, isSelf }: any) {
    return (
        <div className={`flex gap-3 ${isSelf ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-indigo-700 shrink-0">JD</div>
            <div className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900">{user}</span>
                    <span className="text-[10px] text-slate-400">{time}</span>
                </div>
                <div className={`px-3 py-2 rounded-2xl text-sm ${isSelf ? 'bg-primary-50 text-slate-800 rounded-tr-none' : 'bg-slate-50 text-slate-600 rounded-tl-none'}`}>
                    {text}
                </div>
            </div>
        </div>
    );
}
