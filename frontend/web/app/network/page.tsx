'use client';

import { motion } from 'framer-motion';
import {
    Globe2,
    Heart,
    Users,
    MessageCircle,
    Share2,
    CalendarDays,
    MapPin
} from 'lucide-react';

export default function NetworkDashboard() {
    return (
        <div className="space-y-8">
            {/* Hero Section - Community Vibe */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 p-10 text-white shadow-xl shadow-indigo-100">
                <div className="relative z-10 text-center max-w-2xl mx-auto">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-indigo-100 border border-white/20 mb-6"
                    >
                        <Globe2 size={16} />
                        <span className="font-medium text-sm">Global Network Impact</span>
                    </motion.div>
                    <h1 className="text-4xl font-bold mb-4">Empowering Communities Together</h1>
                    <p className="text-lg text-indigo-100 mb-8">
                        Track your campaigns, manage volunteers, and see the real-world impact of your initiatives.
                    </p>
                    <div className="flex justify-center gap-4">
                        <button className="bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:bg-indigo-50 transition-all transform hover:-translate-y-0.5">
                            Start Campaign
                        </button>
                        <button className="bg-indigo-700/50 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold backdrop-blur-sm border border-white/10 transition-all">
                            Invite Volunteers
                        </button>
                    </div>
                </div>
            </div>

            {/* Impact Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Volunteers', value: '2,405', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
                    { label: 'Active Campaigns', value: '18', icon: Share2, color: 'text-pink-600', bg: 'bg-pink-50' },
                    { label: 'Lives Impacted', value: '15k+', icon: Heart, color: 'text-red-500', bg: 'bg-red-50' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ y: -5 }}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4"
                    >
                        <div className={`p-4 rounded-2xl ${stat.bg}`}>
                            <stat.icon size={24} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-slate-500 font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Content Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Active Campaigns */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-slate-900">Active Campaigns</h2>
                        <a href="#" className="text-sm text-indigo-600 font-medium">View All</a>
                    </div>

                    <div className="space-y-4">
                        {[1, 2].map((i) => (
                            <div key={i} className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                <div className="h-32 bg-slate-200 relative">
                                    {/* Placeholder for Campaign Image */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                                    <div className="absolute bottom-4 left-4 text-white">
                                        <div className="flex items-center gap-1 text-xs font-semibold bg-indigo-600 px-2 py-0.5 rounded mb-1 w-fit">
                                            <MapPin size={10} /> Kolkata Region
                                        </div>
                                        <h3 className="font-bold text-lg">Education Drive 2024</h3>
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="text-sm text-slate-500 flex items-center gap-2">
                                            <CalendarDays size={16} /> Ends in 12 days
                                        </div>
                                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="w-3/4 h-full bg-indigo-500 rounded-full" />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3].map(av => (
                                                <div key={av} className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white" />
                                            ))}
                                            <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-500">+42</div>
                                        </div>
                                        <button className="text-sm font-semibold text-indigo-600 group-hover:underline">Manage Details</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Volunteer Feed / Discussion */}
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm h-fit">
                    <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <MessageCircle size={20} className="text-indigo-500" />
                        Volunteer Feed
                    </h2>

                    <div className="space-y-6">
                        {[
                            { user: 'Sarah M.', action: 'logged 5 hours', time: '2 mins ago', detail: 'Teaching at Community Center' },
                            { user: 'Rahul D.', action: 'joined campaign', time: '1 hour ago', detail: 'Clean City Initiative' },
                            { user: 'Team Alpha', action: 'posted an update', time: '3 hours ago', detail: 'Fundraising goal reached! 🎉' },
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-violet-400 to-indigo-400 shrink-0" />
                                <div>
                                    <p className="text-sm text-slate-900">
                                        <span className="font-bold">{item.user}</span> {item.action}
                                    </p>
                                    <p className="text-sm text-slate-500 mt-0.5">{item.detail}</p>
                                    <span className="text-xs text-slate-400 mt-1 block">{item.time}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <button className="w-full mt-6 py-3 rounded-xl border border-dashed border-slate-300 text-slate-500 font-medium hover:bg-slate-50 transition-colors">
                        View More Activity
                    </button>
                </div>

            </div>
        </div>
    );
}
