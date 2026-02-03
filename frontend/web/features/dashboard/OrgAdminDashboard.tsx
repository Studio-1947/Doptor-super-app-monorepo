"use client";

import { Card } from '@doptor/shared';
import { ClipboardList, CheckSquare, Users, TrendingUp } from 'lucide-react';

export function OrgAdminDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900">Organisation Overview</h2>
                <p className="text-slate-500">Manage your organisation's tasks, approvals, and departments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Widget title="Pending Approvals" value="24" icon={CheckSquare} color="text-amber-600" bg="bg-amber-50" />
                <Widget title="Active Tasks" value="156" icon={ClipboardList} color="text-blue-600" bg="bg-blue-50" />
                <Widget title="Total Staff" value="48" icon={Users} color="text-indigo-600" bg="bg-indigo-50" />
                <Widget title="Dept Performance" value="92%" icon={TrendingUp} color="text-emerald-600" bg="bg-emerald-50" />
            </div>

            {/* Approvals & Tasks Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6">
                    <h3 className="font-semibold text-lg mb-4">Pending Approvals</h3>
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                        JD
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm text-slate-900">Equipment Purchase Request</p>
                                        <p className="text-xs text-slate-500">John Doe • Marketing Dept</p>
                                    </div>
                                </div>
                                <button className="px-3 py-1.5 text-xs font-semibold bg-primary-50 text-primary-600 rounded-lg hover:bg-primary-100">
                                    Review
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <ActionButton label="Create User" />
                        <ActionButton label="New Dept" />
                        <ActionButton label="Assign Role" />
                        <ActionButton label="Settings" />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function Widget({ title, value, icon: Icon, color, bg }: any) {
    return (
        <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</span>
                <div className={`p-2 rounded-lg ${bg} ${color}`}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
        </Card>
    );
}

function ActionButton({ label }: { label: string }) {
    return (
        <button className="flex items-center justify-center p-3 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all">
            {label}
        </button>
    );
}
