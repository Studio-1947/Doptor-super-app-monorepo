"use client";

import { Card, Button } from '@doptor/shared';
import { Search, Filter, Clock, CheckCircle2, XCircle, AlertCircle, FileText } from 'lucide-react';

const APPROVALS = [
    { id: 1, title: 'Equipment Purchase Request', applicant: 'John Doe', dept: 'Marketing', amount: '$2,400', date: '2 hours ago', status: 'Pending', type: 'Purchase' },
    { id: 2, title: 'Leave Application - Sick Leave', applicant: 'Sarah Smith', dept: 'Engineering', amount: '2 Days', date: 'Yesterday', status: 'Pending', type: 'Leave' },
    { id: 3, title: 'Q3 Marketing Budget', applicant: 'Mike Jones', dept: 'Marketing', amount: '$50,000', date: 'Oct 12', status: 'Approved', type: 'Budget' },
    { id: 4, title: 'New Hire Requisition', applicant: 'Jane Doe', dept: 'HR', amount: 'Senior Designer', date: 'Oct 10', status: 'Rejected', type: 'Hiring' },
];

export function ApprovalInbox() {
    return (
        <div className="flex flex-col h-full">
            {/* Header Actions */}
            <div className="flex items-center justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Approvals</h1>

                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search requests..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {APPROVALS.map((item) => (
                    <Card key={item.id} className="p-4 hover:shadow-md transition-all cursor-pointer group border-slate-200 hover:border-primary-200">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'Purchase' ? 'bg-blue-100 text-blue-600' :
                                    item.type === 'Leave' ? 'bg-green-100 text-green-600' :
                                        item.type === 'Budget' ? 'bg-purple-100 text-purple-600' :
                                            'bg-orange-100 text-orange-600'
                                }`}>
                                <FileText size={20} />
                            </div>

                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-medium text-slate-900">{item.title}</h3>
                                        <p className="text-sm text-slate-500">{item.applicant} • {item.dept}</p>
                                    </div>
                                    <StatusBadge status={item.status} />
                                </div>
                            </div>

                            <div className="text-right">
                                <p className="font-bold text-slate-900">{item.amount}</p>
                                <p className="text-xs text-slate-400">{item.date}</p>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        'Pending': 'bg-amber-50 text-amber-700 border-amber-100',
        'Approved': 'bg-green-50 text-green-700 border-green-100',
        'Rejected': 'bg-red-50 text-red-700 border-red-100',
    }[status] || 'bg-slate-50 text-slate-600';

    const icon = {
        'Pending': <Clock size={12} />,
        'Approved': <CheckCircle2 size={12} />,
        'Rejected': <XCircle size={12} />,
    }[status];

    return (
        <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full border ${styles}`}>
            {icon}
            {status}
        </span>
    );
}
