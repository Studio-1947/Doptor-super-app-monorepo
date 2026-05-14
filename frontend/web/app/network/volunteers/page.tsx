"use client";

import { ReadyUI } from '@/components/ReadyUI';
import { Heart, Activity, Award, Clock, UserPlus, Mail, MapPin } from 'lucide-react';

export default function VolunteersPage() {
    const stats = [
        { label: 'Total Volunteers', value: '1,284', change: '+12%', trend: 'up', icon: Heart, color: 'bg-rose-500' },
        { label: 'Active Tasks', value: '86', change: '+5', trend: 'up', icon: Activity, color: 'bg-blue-500' },
        { label: 'Total Hours', value: '4,520', change: '8%', trend: 'up', icon: Clock, color: 'bg-amber-500' },
        { label: 'Top Rated', value: '156', icon: Award, color: 'bg-purple-500' },
    ] as any[];

    const volunteers = [
        { id: 1, name: 'Siddharth Rao', location: 'New Delhi', rating: 4.8, tasks: 24, hours: 120, email: 'sid@example.com' },
        { id: 2, name: 'Ananya Gupta', location: 'Mumbai', rating: 4.9, tasks: 42, hours: 210, email: 'ananya@example.com' },
        { id: 3, name: 'Karan Mehra', location: 'Bangalore', rating: 4.5, tasks: 12, hours: 55, email: 'karan@example.com' },
        { id: 4, name: 'Ishita Jain', location: 'Pune', rating: 4.7, tasks: 31, hours: 145, email: 'ishita@example.com' },
        { id: 5, name: 'Rohan Deshmukh', location: 'Hyderabad', rating: 4.6, tasks: 18, hours: 82, email: 'rohan@example.com' },
        { id: 6, name: 'Meera Kapoor', location: 'Chennai', rating: 5.0, tasks: 56, hours: 300, email: 'meera@example.com' },
    ];

    return (
        <ReadyUI 
            title="Volunteers Network" 
            description="Manage and track volunteer activities across your network."
            moduleName="Network"
            stats={stats}
            primaryAction={{
                label: "Add Volunteer",
                icon: UserPlus
            }}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                {volunteers.map((vol) => (
                    <div key={vol.id} className="bg-white border border-slate-200 p-6 flex flex-col group hover:border-primary-500 transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-rose-50 text-rose-600 flex items-center justify-center font-black text-sm border border-rose-100">
                                {vol.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                                    <Award size={12} />
                                    {vol.rating}
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{vol.tasks} Tasks</p>
                            </div>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mb-1">{vol.name}</h4>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                            <MapPin size={10} /> {vol.location}
                        </div>
                        <div className="flex items-center gap-2 mb-6">
                            <div className="flex-1 h-1 bg-slate-100">
                                <div className="h-full bg-primary-500" style={{ width: `${(vol.hours / 300) * 100}%` }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500">{vol.hours}H</span>
                        </div>
                        <button className="w-full py-2 bg-slate-50 text-slate-900 text-[10px] font-black uppercase tracking-widest border border-slate-200 hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center gap-2">
                            <Mail size={12} /> Contact Volunteer
                        </button>
                    </div>
                ))}
            </div>
        </ReadyUI>
    );
}
