"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { 
    Zap, 
    Target, 
    Users, 
    TrendingUp, 
    Plus, 
    ArrowRight,
    Megaphone,
    Share2,
    CheckCircle2
} from 'lucide-react';

export default function CampaignsPage() {
    const stats = [
        { label: 'Active Campaigns', value: '12', change: '+2', trend: 'up', icon: Megaphone, color: 'bg-primary-500' },
        { label: 'Total Reach', value: '45.2K', change: '+12%', trend: 'up', icon: Target, color: 'bg-emerald-500' },
        { label: 'Conversions', value: '1,240', change: '+8%', trend: 'up', icon: TrendingUp, color: 'bg-indigo-500' },
        { label: 'Volunteers', value: '842', icon: Users, color: 'bg-rose-500' },
    ] as any[];

    const campaigns = [
        { id: 'CAMP-001', name: 'Summer Volunteer Drive', status: 'Active', reach: '12,500', budget: '₹45,000', deadline: '30 Jun 2026' },
        { id: 'CAMP-002', name: 'Digital Literacy Workshop', status: 'Paused', reach: '4,200', budget: '₹12,000', deadline: '15 Jul 2026' },
        { id: 'CAMP-003', name: 'Clean City Initiative', status: 'Active', reach: '28,000', budget: '₹85,000', deadline: '22 Jun 2026' },
        { id: 'CAMP-004', name: 'Blood Donation Camp', status: 'Completed', reach: '8,400', budget: '₹5,000', deadline: '10 May 2026' },
        { id: 'CAMP-005', name: 'Rural Outreach Program', status: 'Active', reach: '15,600', budget: '₹32,000', deadline: '05 Aug 2026' },
    ];

    return (
        <ReadyUI 
            title="Campaigns Management" 
            description="Launch, track, and optimize network outreach campaigns and volunteer activities."
            moduleName="Network"
            stats={stats}
            primaryAction={{
                label: "Create Campaign",
                icon: Plus
            }}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign ID</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Name</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Reach</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Deadline</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {campaigns.map((camp) => (
                            <tr key={camp.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{camp.id}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold text-slate-900">{camp.name}</span>
                                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Budget: {camp.budget}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">{camp.reach} users</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-500">{camp.deadline}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${
                                        camp.status === 'Active' ? 'text-emerald-600 border-emerald-100 bg-emerald-50' :
                                        camp.status === 'Completed' ? 'text-indigo-600 border-indigo-100 bg-indigo-50' :
                                        'text-orange-600 border-orange-100 bg-orange-50'
                                    }`}>
                                        {camp.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-1 ml-auto group-hover:gap-3 transition-all hover:text-primary-600">
                                        Analytics <ArrowRight size={14} />
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
