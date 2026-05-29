"use client";

import { Card } from '@doptor/shared';
import { ClipboardList, CheckSquare, Users, TrendingUp } from 'lucide-react';

export function OrgAdminDashboard() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Organisation Overview</h2>
                <p className="text-slate-500 dark:text-slate-400">Manage your organisation's tasks, approvals, and departments.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Widget title="Pending Approvals" value="24" icon={CheckSquare} color="text-amber-600 dark:text-amber-400" bg="bg-amber-50 dark:bg-amber-900/20" />
                <Widget title="Active Tasks" value="156" icon={ClipboardList} color="text-blue-600 dark:text-blue-400" bg="bg-blue-50 dark:bg-blue-900/20" />
                <Widget title="Total Staff" value="48" icon={Users} color="text-indigo-600 dark:text-indigo-400" bg="bg-indigo-50 dark:bg-indigo-900/20" />
                <Widget title="Dept Performance" value="92%" icon={TrendingUp} color="text-emerald-600 dark:text-emerald-400" bg="bg-emerald-50 dark:bg-emerald-900/20" />
            </div>

            {/* Approvals & Tasks Split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Pending Approvals</h3>
                    <div className="space-y-3">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="flex items-center justify-between p-3 border border-slate-100 dark:border-slate-800 rounded-none hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-none bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400 border border-transparent dark:border-slate-700">
                                        JD
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-slate-900 dark:text-white">Equipment Purchase Request</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">John Doe • Marketing Dept</p>
                                    </div>
                                </div>
                                <button className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-none border border-primary-100 dark:border-primary-800 hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-all">
                                    Review
                                </button>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Quick Actions</h3>
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
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">{title}</span>
                <div className={`p-2 rounded-none ${bg} ${color} border border-current border-opacity-10`}>
                    <Icon size={14} />
                </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white">{value}</div>
        </Card>
    );
}

function ActionButton({ label }: { label: string }) {
    return (
        <button className="flex items-center justify-center p-3 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all">
            {label}
        </button>
    );
}
