"use client";

import { Card } from '@doptor/shared';
import { BarChart3, Users, FileText, CheckSquare, Building2, UserCheck, CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { analyticsService, OverviewStats } from '../../services/analytics.service';

export function AnalyticsDashboard() {
    const [data, setData] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                const stats = await analyticsService.getOverview();
                setData(stats);
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-500 dark:text-slate-400 animate-pulse">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics Overview</h1>
                    <p className="text-slate-500 dark:text-slate-400">Real-time system performance and key metrics across your organization.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Members"
                    value={data?.totalUsers.toLocaleString() || "0"}
                    subtitle={`${data?.totalDepartments || 0} Departments`}
                    icon={Users}
                    color="text-blue-600 dark:text-blue-400"
                    bg="bg-blue-100 dark:bg-blue-900/30"
                />
                <StatCard
                    title="Total Tasks"
                    value={data?.totalTasks.toLocaleString() || "0"}
                    subtitle={`${data?.openTasks || 0} Open Tasks`}
                    icon={CheckSquare}
                    color="text-emerald-600 dark:text-emerald-400"
                    bg="bg-emerald-100 dark:bg-emerald-900/30"
                />
                <StatCard
                    title="Registry Files"
                    value={data?.totalFiles.toLocaleString() || "0"}
                    subtitle="Org-wide ledger"
                    icon={BarChart3}
                    color="text-purple-600 dark:text-purple-400"
                    bg="bg-purple-100 dark:bg-purple-900/30"
                />
                <StatCard
                    title="Documents"
                    value={data?.totalDocuments.toLocaleString() || "0"}
                    subtitle={`${data?.documentsPendingReview || 0} Pending Review`}
                    icon={FileText}
                    color="text-amber-600 dark:text-amber-400"
                    bg="bg-amber-100 dark:bg-amber-900/30"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-900 dark:text-white">Organization Operations Breakdown</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <MetricBlock
                            icon={Building2}
                            label="Departments"
                            value={data?.totalDepartments || 0}
                            description="Active functional departments"
                        />
                        <MetricBlock
                            icon={UserCheck}
                            label="Currently Checked In"
                            value={data?.currentlyCheckedIn || 0}
                            description="Staff present today"
                        />
                        <MetricBlock
                            icon={CalendarDays}
                            label="Pending Leave Requests"
                            value={data?.pendingLeaveRequests || 0}
                            description="Awaiting approval"
                        />
                        <MetricBlock
                            icon={FileText}
                            label="Documents Pending Review"
                            value={data?.documentsPendingReview || 0}
                            description="Requires decision"
                        />
                    </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-900 dark:text-white">System Status</h3>
                    </div>
                    <div className="space-y-4">
                        <StatusItem label="API & Service Layer" status="Operational" active />
                        <StatusItem label="Database & Multi-tenancy" status="Connected" active />
                        <StatusItem label="RBAC & Route Protection" status="Active" active />
                        <StatusItem label="Notifications Engine" status="Active" active />
                    </div>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon: Icon, color, bg }: {
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    color: string;
    bg: string;
}) {
    return (
        <Card className="p-4 hover:shadow-md transition-shadow bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
                    <Icon size={20} />
                </div>
            </div>
            <div>
                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
            </div>
        </Card>
    );
}

function MetricBlock({ icon: Icon, label, value, description }: {
    icon: any;
    label: string;
    value: number;
    description: string;
}) {
    return (
        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-start gap-3">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 border border-slate-200 dark:border-slate-700">
                <Icon size={20} />
            </div>
            <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white my-0.5">{value}</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500">{description}</p>
            </div>
        </div>
    );
}

function StatusItem({ label, status, active }: { label: string; status: string; active: boolean }) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
            <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span className="text-xs font-semibold text-slate-900 dark:text-white">{status}</span>
            </div>
        </div>
    );
}

