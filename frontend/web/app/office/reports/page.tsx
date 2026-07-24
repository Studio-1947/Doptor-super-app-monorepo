"use client";

import { useEffect, useState } from 'react';
import { ReadyUI } from '@/components/ReadyUI';
import { FileText, Clock, CheckCircle2, Archive } from 'lucide-react';
import { filesService, FileAnalytics } from '@/services/files.service';

const STATUS_LABELS: Record<string, string> = {
    active: 'Active',
    approved: 'Approved',
    rejected: 'Rejected',
    closed: 'Closed',
    archived: 'Archived',
};

export default function OfficeReportsPage() {
    const [data, setData] = useState<FileAnalytics | null>(null);

    useEffect(() => {
        filesService.getAnalytics().then(setData).catch(() => setData(null));
    }, []);

    const stats = [
        { label: 'Total Files', value: data ? String(data.totalFiles) : '-', icon: FileText, color: 'bg-primary-500' },
        { label: 'Active', value: data ? String(data.byStatus.active ?? 0) : '-', icon: Clock, color: 'bg-blue-500' },
        { label: 'Approved', value: data ? String(data.byStatus.approved ?? 0) : '-', icon: CheckCircle2, color: 'bg-emerald-500' },
        { label: 'Avg. Open File Age', value: data ? `${data.averageOpenFileAgeDays}d` : '-', icon: Archive, color: 'bg-orange-500' },
    ] as any[];

    const statusRows = data ? Object.entries(data.byStatus) : [];
    const categoryRows = data ? Object.entries(data.byCategory) : [];

    return (
        <ReadyUI
            title="File Reports"
            description="Organisation-wide breakdown of file status, category, and turnaround."
            moduleName="Office"
            stats={stats}
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                <div className="border border-slate-100 rounded-none">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">By Status</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-slate-50">
                            {statusRows.length === 0 ? (
                                <tr><td className="px-6 py-8 text-center text-sm text-slate-400">No files yet.</td></tr>
                            ) : statusRows.map(([status, count]) => (
                                <tr key={status}>
                                    <td className="px-6 py-3 text-sm font-bold text-slate-700">{STATUS_LABELS[status] ?? status}</td>
                                    <td className="px-6 py-3 text-sm font-black text-slate-900 text-right">{count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="border border-slate-100 rounded-none">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">By Category</h3>
                    </div>
                    <table className="w-full text-left border-collapse">
                        <tbody className="divide-y divide-slate-50">
                            {categoryRows.length === 0 ? (
                                <tr><td className="px-6 py-8 text-center text-sm text-slate-400">No files yet.</td></tr>
                            ) : categoryRows.map(([category, count]) => (
                                <tr key={category}>
                                    <td className="px-6 py-3 text-sm font-bold text-slate-700">{category}</td>
                                    <td className="px-6 py-3 text-sm font-black text-slate-900 text-right">{count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </ReadyUI>
    );
}
