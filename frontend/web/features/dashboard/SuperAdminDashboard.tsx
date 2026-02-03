"use client";

import { Card, CardHeader } from '@doptor/shared';
import { Building2, Users, Server, Activity } from 'lucide-react';

export function SuperAdminDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900">Super Admin Overview</h2>
                <p className="text-slate-500">Global system monitoring and organistion management.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard title="Total Organisations" value="142" icon={Building2} color="bg-blue-500" />
                <StatCard title="Total Users" value="8,234" icon={Users} color="bg-indigo-500" />
                <StatCard title="Active Modules" value="12" icon={Server} color="bg-violet-500" />
                <StatCard title="System Health" value="99.9%" icon={Activity} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Recent Organisations</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center">
                                        <Building2 size={20} className="text-slate-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900">TechCorp Solutions</p>
                                        <p className="text-xs text-slate-500">Enterprise Plan • Austin, TX</p>
                                    </div>
                                </div>
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full">Active</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">System Alerts</h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-lg">
                            <p className="text-sm font-semibold text-amber-800">High CP Usage (85%)</p>
                            <p className="text-xs text-amber-600 mt-1">Server US-East-1 • 10 mins ago</p>
                        </div>
                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                            <p className="text-sm font-semibold text-blue-800">New Version Deployed (v2.1.0)</p>
                            <p className="text-xs text-blue-600 mt-1">Global • 2 hours ago</p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <Card className="p-4 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-white shadow-sm`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
        </Card>
    );
}
