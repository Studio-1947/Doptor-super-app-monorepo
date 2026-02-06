"use client";

import { useMemo } from 'react';
import {
    FileText,
    Clock,
    CheckCircle2,
    Inbox,
    Send,
    Plus,
    Search
} from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { useRouter } from 'next/navigation';
import { MOCK_FILES, OfficeFile } from './office-mock.db';

export function FileDashboard() {
    const router = useRouter();

    // Mock current user ID
    const currentUserId = 'u1';

    const stats = useMemo(() => {
        const total = MOCK_FILES.length;
        const pending = MOCK_FILES.filter(f => f.status === 'pending').length;
        const approved = MOCK_FILES.filter(f => f.status === 'approved').length;
        const urgency = MOCK_FILES.filter(f => f.priority === 'urgent' || f.priority === 'immediate').length;

        return { total, pending, approved, urgency };
    }, []);

    const recentFiles = useMemo(() => {
        return [...MOCK_FILES]
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5);
    }, []);

    const getPriorityColor = (priority: OfficeFile['priority']) => {
        switch (priority) {
            case 'immediate': return 'bg-red-100 text-red-700 border-red-200';
            case 'urgent': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getStatusColor = (status: OfficeFile['status']) => {
        switch (status) {
            case 'approved': return 'bg-emerald-100 text-emerald-700';
            case 'rejected': return 'bg-red-100 text-red-700';
            case 'returned': return 'bg-amber-100 text-amber-700';
            case 'closed': return 'bg-slate-100 text-slate-700';
            default: return 'bg-blue-100 text-blue-700';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Office Dashboard</h1>
                    <p className="text-slate-500 mt-1">Overview of file movements and tasks</p>
                </div>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        onClick={() => router.push('/office/files')}
                        className="gap-2"
                    >
                        <Search size={18} />
                        Search Files
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => router.push('/office/create')}
                        className="gap-2"
                    >
                        <Plus size={18} />
                        Create File
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-4 border-slate-200 flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Total Files</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={20} />
                    </div>
                </Card>

                <Card className="p-4 border-slate-200 flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Pending</p>
                        <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats.pending}</h3>
                    </div>
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                        <Clock size={20} />
                    </div>
                </Card>

                <Card className="p-4 border-slate-200 flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Approved</p>
                        <h3 className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</h3>
                    </div>
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <CheckCircle2 size={20} />
                    </div>
                </Card>

                <Card className="p-4 border-slate-200 flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-500">Direct/Urgent</p>
                        <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.urgency}</h3>
                    </div>
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                        <Inbox size={20} />
                    </div>
                </Card>
            </div>

            {/* Recent Activity */}
            < div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="border-slate-200 overflow-hidden h-full">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-900">Recent Files</h3>
                            <Button variant="ghost" size="sm" onClick={() => router.push('/office/files')}>
                                View All
                            </Button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 text-slate-500 font-medium">
                                    <tr>
                                        <th className="px-4 py-3">File Number</th>
                                        <th className="px-4 py-3">Subject</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Last Updated</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentFiles.map(file => (
                                        <tr
                                            key={file.id}
                                            className="hover:bg-slate-50 cursor-pointer transition-colors"
                                            onClick={() => router.push(`/office/files/${file.id}`)}
                                        >
                                            <td className="px-4 py-3 font-medium text-slate-900">{file.fileNumber}</td>
                                            <td className="px-4 py-3 max-w-[200px] truncate text-slate-600">
                                                {file.subject}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(file.status)}`}>
                                                    {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {new Date(file.updatedAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions / Inbox */}
                <div className="space-y-6">
                    <Card className="p-4 border-slate-200">
                        <h3 className="font-bold text-slate-900 mb-4">Quick Links</h3>
                        <div className="space-y-2">
                            <button
                                onClick={() => router.push('/office/files?filter=inbox')}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                        <Inbox size={18} />
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-900 block">Inbox</span>
                                        <span className="text-xs text-slate-500">Files pending your action</span>
                                    </div>
                                </div>
                                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">3</span>
                            </button>

                            <button
                                onClick={() => router.push('/office/files?filter=sent')}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                                        <Send size={18} />
                                    </div>
                                    <div>
                                        <span className="font-medium text-slate-900 block">Sent</span>
                                        <span className="text-xs text-slate-500">Files initiated by you</span>
                                    </div>
                                </div>
                                <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">12</span>
                            </button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
