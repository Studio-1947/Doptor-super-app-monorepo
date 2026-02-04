'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Users,
    Inbox,
    Search,
    Plus,
    Clock,
    FileCheck,
    Briefcase
} from 'lucide-react';
import FileInbox from '../../features/office/FileInbox';
import FileCreateModal from '../../features/office/FileCreateModal';

export default function OfficeDashboard() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleRefresh = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Office Dashboard</h1>
                    <p className="text-slate-500 mt-1">Manage files, e-Dak, and registry efficiently.</p>
                </div>
                <div className="flex space-x-3">
                    <button className="flex items-center px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium">
                        <Search size={18} className="mr-2" />
                        Search Files
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 font-medium"
                    >
                        <Plus size={18} className="mr-2" />
                        Create Note (e-Dak)
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Pending Files', value: '12', icon: Inbox, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Processesd Today', value: '45', icon: FileCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Avg Turnaround', value: '4h', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Staff', value: '28', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <stat.icon size={22} className={stat.color} />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Content Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Files - 2 Cols */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900">Recent e-Dak Files</h2>
                        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">View All</a>
                    </div>

                    {/* Real File Inbox Component */}
                    <FileInbox refreshTrigger={refreshTrigger} />
                </div>

                {/* Quick Actions / Registry - 1 Col */}
                <div className="space-y-6">
                    <h2 className="text-lg font-bold text-slate-900">Registry Quick Access</h2>

                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
                        {[
                            { label: 'Employee Directory', desc: 'Search all staff', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: 'Asset Management', desc: 'Track office assets', icon: Briefcase, color: 'text-slate-600', bg: 'bg-slate-100' },
                            { label: 'Leave Requests', desc: '3 pending approvals', icon: Clock, color: 'text-rose-600', bg: 'bg-rose-50' },
                        ].map((action, i) => (
                            <button key={i} className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group">
                                <div className={`p-3 rounded-xl ${action.bg} ${action.color} group-hover:scale-105 transition-transform`}>
                                    <action.icon size={20} />
                                </div>
                                <div>
                                    <h4 className="text-sm font-semibold text-slate-900">{action.label}</h4>
                                    <p className="text-xs text-slate-500">{action.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <FileCreateModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleRefresh}
            />
        </div>
    );
}
