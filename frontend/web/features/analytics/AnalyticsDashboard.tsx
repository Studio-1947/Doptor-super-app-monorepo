"use client";

import { Card } from '@doptor/shared';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, PieChart, Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

// Define proper types for the API response
interface AnalyticsData {
    totalUsers: number;
    totalFiles: number;
    totalMessages: number;
    activeSessions: number;
    revenue: number;
}

export function AnalyticsDashboard() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAnalytics() {
            try {
                // In production, use env variable for base URL
                const response = await fetch('http://localhost:3000/analytics/overview');
                if (response.ok) {
                    const jsonData = await response.json();
                    setData(jsonData);
                }
            } catch (error) {
                console.error("Failed to fetch analytics:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchAnalytics();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-slate-500 animate-pulse">Loading analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Analytics Overview</h1>
                    <p className="text-slate-500">System performance and key metrics for this month.</p>
                </div>
                <div className="flex bg-white border border-slate-200 rounded-lg p-1">
                    <button className="px-3 py-1 text-sm font-medium text-slate-500 hover:text-slate-900">Weekly</button>
                    <button className="px-3 py-1 text-sm font-medium bg-secondary-50 text-secondary-900 rounded-md shadow-sm">Monthly</button>
                    <button className="px-3 py-1 text-sm font-medium text-slate-500 hover:text-slate-900">Yearly</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={`$${(data?.revenue || 0).toLocaleString()}`}
                    trend="+20.1%"
                    trendUp
                    icon={DollarSign}
                    color="text-green-600"
                    bg="bg-green-100"
                />
                <StatCard
                    title="Total Users"
                    value={data?.totalUsers.toLocaleString() || "0"}
                    trend="+15.2%"
                    trendUp
                    icon={Users}
                    color="text-blue-600"
                    bg="bg-blue-100"
                />
                <StatCard
                    title="Total Files"
                    value={data?.totalFiles.toLocaleString() || "0"}
                    trend="+5.4%"
                    trendUp
                    icon={BarChart3} // Replaced TrendingUp with generic chart icon for files
                    color="text-purple-600"
                    bg="bg-purple-100"
                />
                <StatCard
                    title="Total Messages"
                    value={data?.totalMessages.toLocaleString() || "0"}
                    trend="+2.3%"
                    trendUp
                    icon={Activity}
                    color="text-orange-600"
                    bg="bg-orange-100"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-6 min-h-[300px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-900">Revenue Growth</h3>
                        <button className="text-slate-400 hover:text-primary-600"><BarChart3 size={18} /></button>
                    </div>
                    {/* Placeholder for Chart - kept static as chart data isn't in MVP backend scope yet */}
                    <div className="h-64 flex items-end justify-between gap-2 px-4">
                        {[40, 65, 45, 90, 75, 55, 80, 95, 60, 70, 85, 50].map((h, i) => (
                            <div key={i} className="w-full bg-primary-100 rounded-t-sm hover:bg-primary-500 transition-colors relative group" style={{ height: `${h}%` }}>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    ${h * 100}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-400 px-2">
                        <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span><span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-semibold text-slate-900">Traffic Source</h3>
                        <button className="text-slate-400 hover:text-primary-600"><PieChart size={18} /></button>
                    </div>
                    <div className="space-y-4">
                        <TrafficItem label="Direct" value="45%" color="bg-primary-500" />
                        <TrafficItem label="Social Media" value="25%" color="bg-secondary-500" />
                        <TrafficItem label="Referral" value="20%" color="bg-blue-500" />
                        <TrafficItem label="Organic Search" value="10%" color="bg-green-500" />
                    </div>
                    <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Insight</h4>
                        <p className="text-xs text-slate-500">Direct traffic has increased by 15% compared to last month. Consider optimizing the landing page for better conversion.</p>
                    </div>
                </Card>
            </div>
        </div>
    );
}

function StatCard({ title, value, trend, trendUp, icon: Icon, color, bg }: any) {
    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${bg} ${color}`}>
                    <Icon size={20} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${trendUp ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend}
                </div>
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-slate-900">{value}</h3>
            </div>
        </Card>
    );
}

function TrafficItem({ label, value, color }: any) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">{label}</span>
                <span className="font-bold text-slate-900">{value}</span>
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: value }}></div>
            </div>
        </div>
    );
}
