"use client";

import { Card, Button } from '@doptor/shared';
import { GraduationCap, Users, Calendar, ArrowRight, Plus } from 'lucide-react';
import TimeTable from './TimeTable';
import { useState, useEffect } from 'react';
import { CampusClass, campusService } from '../../services/campus.service';
import { useRouter } from 'next/navigation';
import { useRole } from '@/features/auth/RoleContext';



export function CampusDashboard() {
    const router = useRouter();
    const [classes, setClasses] = useState<CampusClass[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchClasses() {
            try {
                const data = await campusService.getClasses();
                setClasses(data);
            } catch (error) {
                console.error("Failed to fetch classes:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchClasses();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-none"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-none border border-slate-200 dark:border-slate-700"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 h-[400px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none"></div>
                    <div className="h-[400px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Campus Overview</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Manage academic schedules, attendance, and student performance.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Active Students"
                    value="1,245"
                    icon={Users}
                    color="text-emerald-600 dark:text-emerald-400"
                    bg="bg-emerald-50 dark:bg-emerald-900/20"
                />
                <StatCard
                    title="Faculty Members"
                    value="84"
                    icon={GraduationCap}
                    color="text-blue-600 dark:text-blue-400"
                    bg="bg-blue-50 dark:bg-blue-900/20"
                />
                <StatCard
                    title="Classes Today"
                    value="12"
                    icon={Calendar}
                    color="text-indigo-600 dark:text-indigo-400"
                    bg="bg-indigo-50 dark:bg-indigo-900/20"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timetable Widget */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white uppercase tracking-tight">Weekly Schedule</h3>
                        <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary-600 dark:text-primary-400 hover:underline" onClick={() => router.push('/campus/timetable')}>
                            Full Schedule <ArrowRight size={14} />
                        </button>
                    </div>
                    <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
                        <TimeTable classes={classes} onClassClick={(cls) => console.log('Clicked', cls)} />
                    </div>
                </div>

                {/* Quick Actions & Recent */}
                <div className="space-y-6">
                    <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-sm mb-4 text-slate-900 dark:text-white uppercase tracking-widest">Quick Actions</h3>
                        <div className="space-y-2">
                            <ActionButton label="Mark Attendance" onClick={() => router.push('/campus/attendance/mark')} />
                            <ActionButton label="Student Directory" onClick={() => router.push('/campus/students')} />
                            <ActionButton label="Faculty Directory" onClick={() => router.push('/campus/faculty')} />
                            <ActionButton label="Attendance Reports" onClick={() => router.push('/campus/attendance/reports')} />
                        </div>
                    </Card>

                    <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <h3 className="font-bold text-sm mb-4 text-slate-900 dark:text-white uppercase tracking-widest">Next Class</h3>
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-none border border-indigo-100 dark:border-indigo-800/50">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-black text-indigo-900 dark:text-indigo-300">CS101</p>
                                    <p className="text-xs text-indigo-700 dark:text-indigo-400">Intro to Computer Science</p>
                                </div>
                                <span className="bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 text-[10px] font-black px-2 py-1 rounded-none border border-indigo-100 dark:border-indigo-700 shadow-sm">
                                    10:00 AM
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mt-4 uppercase tracking-wider">
                                <div className="flex items-center gap-1">
                                    <Users size={12} />
                                    <span>45 Students</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Calendar size={12} />
                                    <span>Room 101</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color, bg }: any) {
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

function ActionButton({ label, icon: Icon, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-3 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-none hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-all group"
        >
            <span>{label}</span>
            {Icon ? <Icon size={14} className="text-slate-400 group-hover:text-slate-600" /> : <ArrowRight size={14} className="text-slate-400 group-hover:text-slate-600" />}
        </button>
    );
}
