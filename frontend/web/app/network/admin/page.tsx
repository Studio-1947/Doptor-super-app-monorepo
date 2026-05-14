"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    Shield, 
    Globe2, 
    Users, 
    Zap, 
    Plus, 
    ArrowRight,
    Settings,
    Server,
    Database
} from 'lucide-react';

export default function NetworkAdminPage() {
    const stats = [
        { label: 'Active Regions', value: '42', change: '+2', trend: 'up', icon: Globe2, color: 'bg-primary-500' },
        { label: 'Node Health', value: '99.8%', icon: Server, color: 'bg-emerald-500' },
        { label: 'Total Connections', value: '1.2M', change: '+15%', trend: 'up', icon: Zap, color: 'bg-indigo-500' },
        { label: 'System Uptime', value: '365d', icon: Database, color: 'bg-amber-500' },
    ] as any[];

    const configurations = [
        { id: 'NET-001', name: 'Global Traffic Controller', status: 'Optimal', version: 'v4.2.1', load: '24%', location: 'Multi-Region' },
        { id: 'NET-002', name: 'Edge Security Gateway', status: 'Active', version: 'v4.1.9', load: '12%', location: 'Regional' },
        { id: 'NET-003', name: 'Identity Resolver', status: 'Optimal', version: 'v2.0.4', load: '08%', location: 'Global' },
        { id: 'NET-004', name: 'Data Sync Engine', status: 'Syncing', version: 'v3.5.1', load: '45%', location: 'Cluster' },
        { id: 'NET-005', name: 'Notification Hub', status: 'Active', version: 'v1.2.0', load: '05%', location: 'Dedicated' },
    ];

    return (
        <ReadyUI 
            title="Network Administration" 
            description="Control global network parameters, node health, and infrastructure configurations."
            moduleName="Network"
            stats={stats}
            primaryAction={{
                label: "Provision Node",
                icon: Plus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Config ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Network Service</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Version</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Utilization</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {configurations.map((config) => (
                            <tr key={config.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{config.id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">{config.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{config.location}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{config.version}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-24 h-1 bg-slate-100 mt-2">
                                        <div className="h-full bg-primary-500" style={{ width: config.load }} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 block">{config.load} Load</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        config.status === 'Optimal' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                        config.status === 'Active' ? 'text-indigo-600 border-indigo-100 bg-indigo-50' :
                                        'text-orange-600 border-orange-100 bg-orange-50'
                                    }`}>
                                        {config.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        Configure <Settings size={14} />
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
