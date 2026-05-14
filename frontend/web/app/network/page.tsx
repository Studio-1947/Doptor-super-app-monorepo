"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    Globe2, 
    Activity, 
    Shield, 
    Zap, 
    Plus, 
    ArrowRight,
    LayoutDashboard,
    TrendingUp,
    Map
} from 'lucide-react';

export default function NetworkDashboard() {
    const stats = [
        { label: 'Global Reach', value: '452K', change: '+12%', trend: 'up', icon: Globe2, color: 'bg-primary-500' },
        { label: 'Network Health', value: '98.2%', change: '-0.5%', trend: 'down', icon: Activity, color: 'bg-emerald-500' },
        { label: 'Security Alerts', value: '0', icon: Shield, color: 'bg-indigo-500' },
        { label: 'Growth Factor', value: '2.4x', change: '+0.8', trend: 'up', icon: TrendingUp, color: 'bg-amber-500' },
    ] as any[];

    const regions = [
        { id: 'REG-APAC', name: 'Asia Pacific', nodes: '128', status: 'Optimal', traffic: '2.4 TB/s' },
        { id: 'REG-EMEA', name: 'Europe & Middle East', nodes: '86', status: 'Optimal', traffic: '1.8 TB/s' },
        { id: 'REG-NA', name: 'North America', nodes: '154', status: 'Optimal', traffic: '3.1 TB/s' },
        { id: 'REG-SA', name: 'South America', nodes: '42', status: 'Maintenance', traffic: '0.4 TB/s' },
        { id: 'REG-AF', name: 'Africa', nodes: '31', status: 'Optimal', traffic: '0.2 TB/s' },
    ];

    return (
        <ReadyUI 
            title="Network Overview" 
            description="Global network visualization and real-time operational metrics across all regions."
            moduleName="Network"
            stats={stats}
            primaryAction={{
                label: "Deploy New Region",
                icon: Map
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Region ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Region Name</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Active Nodes</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Traffic</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {regions.map((region) => (
                            <tr key={region.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{region.id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-900">{region.name}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-slate-600">{region.nodes}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Zap size={14} className="text-primary-500" />
                                        <span className="text-xs font-bold text-slate-700">{region.traffic}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        region.status === 'Optimal' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                        'text-orange-600 border-orange-100 bg-orange-50'
                                    }`}>
                                        {region.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        Regional Map <ArrowRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </ReadyUI>
    );
}
