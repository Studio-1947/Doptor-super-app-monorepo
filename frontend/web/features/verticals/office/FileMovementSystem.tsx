"use client";

import { Card, Button } from '@doptor/shared';
import { Search, Folder, FileText, ArrowRight, User, Calendar, Clock, Filter, Plus, ArrowUpRight, History } from 'lucide-react';
import { useState } from 'react';

const FILES = [
    { id: 'DAK-2023-1001', subject: 'Approval for Annual Sports Day Budget', sender: 'Sports Committee', holder: 'Finance Officer', status: 'Pending', priority: 'High', date: 'Oct 24, 2023' },
    { id: 'DAK-2023-1002', subject: 'Leave Application - Sarah Jones', sender: 'HR Dept', holder: 'Director', status: 'In Review', priority: 'Normal', date: 'Oct 23, 2023' },
    { id: 'DAK-2023-1003', subject: 'Procurement of Lab Equipment - Phase 2', sender: 'Science Dept', holder: 'Store Keeper', status: 'Processed', priority: 'Critical', date: 'Oct 21, 2023' },
    { id: 'DAK-2023-1004', subject: 'Maintenance Request - Block A Roof', sender: 'Estate Officer', holder: 'Civil Engineer', status: 'Pending', priority: 'Normal', date: 'Oct 20, 2023' },
];

export function FileMovementSystem() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">File Movement System (e-Dak)</h1>
                    <p className="text-slate-500">Track and manage the movement of physical files.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="secondary" className="gap-2">
                        <History size={16} />
                        History
                    </Button>
                    <Button variant="primary" className="gap-2">
                        <Plus size={16} />
                        Receive New Dak
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Incoming" value="12" icon={ArrowDownRightIcon} color="text-blue-600" bg="bg-blue-100" />
                <StatCard title="Outgoing" value="8" icon={ArrowUpRight} color="text-orange-600" bg="bg-orange-100" />
                <StatCard title="Pending" value="5" icon={Clock} color="text-amber-600" bg="bg-amber-100" />
                <StatCard title="Processed" value="145" icon={Folder} color="text-green-600" bg="bg-green-100" />
            </div>

            <Card className="p-0 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by ID, Subject or Holder..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <button className="p-2 border border-slate-200 rounded-lg hover:bg-white text-slate-500 bg-white">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3">File Number</th>
                                <th className="px-4 py-3">Subject</th>
                                <th className="px-4 py-3">Current Status</th>
                                <th className="px-4 py-3">Current Holder</th>
                                <th className="px-4 py-3">Inward Date</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {FILES.map((file) => (
                                <tr key={file.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-4 py-3 font-mono text-xs font-medium text-slate-600">{file.id}</td>
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-slate-900 line-clamp-1">{file.subject}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${file.priority === 'Critical' ? 'bg-red-50 text-red-700 border-red-100' :
                                                file.priority === 'High' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                                    'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>{file.priority}</span>
                                            <span className="text-xs text-slate-400 flex items-center gap-1">
                                                <User size={10} /> From: {file.sender}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${file.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                                            file.status === 'Processed' ? 'bg-green-50 text-green-700' :
                                                'bg-blue-50 text-blue-700'
                                            }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${file.status === 'Pending' ? 'bg-amber-500' :
                                                file.status === 'Processed' ? 'bg-green-500' :
                                                    'bg-blue-500'
                                                }`}></span>
                                            {file.status}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">
                                                {file.holder.substring(0, 2)}
                                            </div>
                                            {file.holder}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            {file.date}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Button variant="secondary" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            Forward <ArrowRight size={14} className="ml-1" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-xl ${bg} ${color}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            </div>
        </Card>
    );
}

function ArrowDownRightIcon({ size, className }: { size?: number, className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size || 24} height={size || 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m7 7 10 10" /><path d="M17 7v10H7" /></svg>
    )
}
