"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { BarChart3, PieChart, TrendingUp, FileText, Download } from 'lucide-react';

export default function ReportsPage() {
    const stats = [
        { label: 'Total Reports', value: '124', change: '+12', trend: 'up', icon: FileText, color: 'bg-indigo-500' },
        { label: 'Monthly Growth', value: '24%', change: '4%', trend: 'up', icon: TrendingUp, color: 'bg-emerald-500' },
        { label: 'Active Datasets', value: '18', icon: BarChart3, color: 'bg-blue-500' },
        { label: 'Custom Views', value: '9', icon: PieChart, color: 'bg-orange-500' },
    ] as any[];

    return (
        <ReadyUI 
            title="Analytics & Reports" 
            description="Generate detailed insights and visualize your organization's performance."
            moduleName="Office"
            stats={stats}
            primaryAction={{
                label: "Generate Report",
                icon: Download
            }}
        />
    );
}
