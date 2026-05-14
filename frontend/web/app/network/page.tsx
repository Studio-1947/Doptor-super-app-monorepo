"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    Users, 
    Heart, 
    Globe2, 
    TrendingUp, 
    Plus, 
    ArrowRight,
    HandHelping,
    MapPin,
    Smile
} from 'lucide-react';

export default function NetworkDashboard() {
    const stats = [
        { label: 'Active Volunteers', value: '4,842', change: '+124', trend: 'up', icon: Users, color: 'bg-primary-500' },
        { label: 'Impact Hours', value: '12.4K', change: '+8%', trend: 'up', icon: ClockIcon, color: 'bg-emerald-500' },
        { label: 'Communities', value: '86', change: '+5', trend: 'up', icon: Globe2, color: 'bg-indigo-500' },
        { label: 'Lives Impacted', value: '150K', icon: Heart, color: 'bg-rose-500' },
    ] as any[];

    // Local icon to avoid build issues
    function ClockIcon(props: any) {
        return (
            <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        )
    }

    const initiatives = [
        { id: 'VOL-APAC', name: 'South East Asia Outreach', volunteers: '1,280', status: 'Active', impact: 'High' },
        { id: 'VOL-EMEA', name: 'Central Europe Community', volunteers: '860', status: 'Active', impact: 'Medium' },
        { id: 'VOL-NA', name: 'North American Network', volunteers: '1,540', status: 'Active', impact: 'High' },
        { id: 'VOL-SA', name: 'Latin America Mission', volunteers: '420', status: 'Planning', impact: 'N/A' },
        { id: 'VOL-AF', name: 'Sub-Saharan Social Work', volunteers: '310', status: 'Active', impact: 'Medium' },
    ];

    return (
        <ReadyUI 
            title="Volunteer Network" 
            description="Global visualization of social impact, volunteer engagement, and community outreach initiatives."
            moduleName="Network"
            stats={stats}
            primaryAction={{
                label: "Launch Initiative",
                icon: HandHelping
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Project ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Initiative Name</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Active Volunteers</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Impact Level</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {initiatives.map((init) => (
                            <tr key={init.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{init.id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-primary-50 flex items-center justify-center text-primary-600">
                                            <MapPin size={14} />
                                        </div>
                                        <span className="text-sm font-bold text-slate-900">{init.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-slate-600">{init.volunteers}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={14} className="text-primary-500" />
                                        <span className="text-xs font-bold text-slate-700">{init.impact}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        init.status === 'Active' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                        'text-orange-600 border-orange-100 bg-orange-50'
                                    }`}>
                                        {init.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        View Details <ArrowRight size={14} />
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
