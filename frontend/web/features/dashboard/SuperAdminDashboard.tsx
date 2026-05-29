"use client";

import { Card, CardHeader } from '@doptor/shared';
import { Building2, Users, Server, Activity } from 'lucide-react';

export function SuperAdminDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Super Admin Overview</h2>
                <p className="text-slate-500 dark:text-slate-400">Global system monitoring and organisation management.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Organisations" value="142" icon={Building2} color="bg-blue-500" />
                <StatCard title="Total Users" value="8,234" icon={Users} color="bg-indigo-500" />
                <StatCard title="Active Modules" value="12" icon={Server} color="bg-violet-500" />
                <StatCard title="System Health" value="99.9%" icon={Activity} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Recent Organisations</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-none border border-transparent dark:border-slate-800">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-none bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                                        <Building2 size={20} className="text-slate-400 dark:text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">TechCorp Solutions</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">Enterprise Plan • Austin, TX</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 text-xs font-black uppercase bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-none border border-green-200 dark:border-green-800">Active</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">System Alerts</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/50 rounded-none">
                            <p className="text-sm font-bold text-amber-800 dark:text-amber-400 uppercase tracking-tight">High CPU Usage (85%)</p>
                            <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">Server US-East-1 • 10 mins ago</p>
                        </div>
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-none">
                            <p className="text-sm font-bold text-blue-800 dark:text-blue-400 uppercase tracking-tight">New Version Deployed (v2.1.0)</p>
                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">Global • 2 hours ago</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className="p-4 flex items-center gap-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className={`w-12 h-12 rounded-none ${color} flex items-center justify-center text-white shadow-sm`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{title}</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
            </div>
        </Card>
    );
}
