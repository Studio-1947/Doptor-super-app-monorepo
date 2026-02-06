"use client";

import { useState } from 'react';
import { Card, Button } from '@doptor/shared';
import { CheckSquare, Clock, XCircle, CheckCircle2, ChevronDown, FileText } from 'lucide-react';

export function ApprovalsDashboard() {
    const [filter, setFilter] = useState<'pending' | 'history'>('pending');

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900">Approvals & Requests</h2>
                <p className="text-slate-500">Manage and track your official requests.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
                <button
                    onClick={() => setFilter('pending')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'pending'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Pending
                </button>
                <button
                    onClick={() => setFilter('history')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filter === 'history'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'}`}
                >
                    History
                </button>
            </div>

            {filter === 'pending' ? <PendingRequests /> : <HistoryRequests />}
        </div>
    );
}

function PendingRequests() {
    const requests = [
        {
            id: 1,
            type: "Leave Application",
            subject: "Medical Leave - 2 Days",
            requester: "John Doe",
            date: "Today, 10:00 AM",
            status: "pending",
            priority: "medium"
        },
        {
            id: 2,
            type: "Device Requisition",
            subject: "Request for Monitor",
            requester: "John Doe",
            date: "Yesterday",
            status: "pending",
            priority: "low"
        }
    ];

    return (
        <div className="grid gap-4">
            {requests.map(req => (
                <Card key={req.id} className="p-5 border-l-4 border-l-amber-400">
                    <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl h-fit">
                                <Clock size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold text-slate-900">{req.subject}</h3>
                                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase rounded-full">{req.type}</span>
                                </div>
                                <p className="text-sm text-slate-500 mb-2">Requested {req.date}</p>
                                <div className="flex gap-2">
                                    <Button size="sm" className="h-8 text-xs bg-slate-900 text-white hover:bg-slate-800">
                                        View Details
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-8 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300">
                                        Withdraw
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}

            {requests.length === 0 && (
                <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <CheckSquare size={48} className="mx-auto text-slate-300 mb-3" />
                    <p className="text-slate-500 font-medium">No pending approvals</p>
                </div>
            )}
        </div>
    );
}

function HistoryRequests() {
    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <tr>
                        <th className="px-6 py-3">Type</th>
                        <th className="px-6 py-3">Subject</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">Expense Claim</td>
                        <td className="px-6 py-4">Travel expenses for Conf...</td>
                        <td className="px-6 py-4 text-slate-500">Jan 12, 2026</td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold">
                                <CheckCircle2 size={12} /> Approved
                            </span>
                        </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium text-slate-900">WFH Request</td>
                        <td className="px-6 py-4">Remote work for Friday...</td>
                        <td className="px-6 py-4 text-slate-500">Jan 05, 2026</td>
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 text-red-700 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold">
                                <XCircle size={12} /> Rejected
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
