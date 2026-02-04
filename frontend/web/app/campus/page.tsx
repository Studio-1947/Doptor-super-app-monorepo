'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, BookOpen, Clock, CalendarDays, Users } from 'lucide-react';
import { campusService, CampusClass } from '../../services/campus.service';
import TimeTable from '../../features/campus/TimeTable';
import AttendanceTracker from '../../features/campus/AttendanceTracker';
import { DashboardHeader } from '../../components/dashboard/DashboardHeader';

export default function CampusDashboard() {
    const [loading, setLoading] = useState(true);
    const [role, setRole] = useState<'faculty' | 'student'>('student');
    const [classes, setClasses] = useState<CampusClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<CampusClass | null>(null);

    useEffect(() => {
        loadCampusData();
    }, []);

    const loadCampusData = async () => {
        try {
            setLoading(true);
            const data = await campusService.getMyClasses();
            setRole(data.role);
            setClasses(data.classes);
        } catch (error) {
            console.error("Failed to load campus data", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <DashboardHeader
                title="Campus Life"
                subtitle={`Welcome to your academic hub, ${role === 'faculty' ? 'Professor' : 'Student'}.`}
                action={
                    role === 'faculty' ? (
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition w-full sm:w-auto flex items-center justify-center gap-2">
                            <CalendarDays size={18} />
                            Manage Schedule
                        </button>
                    ) : undefined
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area: TimeTable */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Stats Row */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                    <BookOpen size={20} />
                                </div>
                                <span className="text-2xl font-bold text-slate-900">{classes.length}</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-2 font-medium">Active Courses</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                                    <Clock size={20} />
                                </div>
                                <span className="text-2xl font-bold text-slate-900">12</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-2 font-medium">Weekly Hours</p>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                                    <GraduationCap size={20} />
                                </div>
                                <span className="text-2xl font-bold text-slate-900">3.8</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-2 font-medium">Current GPA</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                            <CalendarDays size={20} className="text-indigo-600" />
                            Your Schedule
                        </h2>
                        {loading ? (
                            <div className="h-64 bg-slate-100 animate-pulse rounded-xl"></div>
                        ) : (
                            <TimeTable classes={classes} onClassClick={setSelectedClass} />
                        )}
                    </div>
                </div>

                {/* Right Sidebar: Quick Actions & Attendance */}
                <div className="space-y-6">
                    {role === 'faculty' && selectedClass ? (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <AttendanceTracker
                                classId={selectedClass.id}
                                className={selectedClass.course.name}
                                onClose={() => setSelectedClass(null)}
                            />
                        </motion.div>
                    ) : (
                        <>
                            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                                <h3 className="text-lg font-bold mb-2">Quick Actions</h3>
                                <p className="text-indigo-100 text-sm mb-6">Select a class from the timetable to manage attendance, assignments, and grades.</p>

                                <div className="space-y-3">
                                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 px-4 transition-colors">
                                        <Users size={18} />
                                        <span className="font-medium">Student Directory</span>
                                    </button>
                                    <button className="w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl flex items-center gap-3 px-4 transition-colors">
                                        <BookOpen size={18} />
                                        <span className="font-medium">Course Materials</span>
                                    </button>
                                </div>
                            </div>

                            {/* Upcoming / Recent Activity */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                    <Clock size={18} className="text-slate-400" />
                                    Upcoming Deadlines
                                </h3>
                                <div className="space-y-3">
                                    {[1, 2, 3].map((_, i) => (
                                        <div key={i} className="flex gap-3 items-start p-2 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                                            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex flex-col items-center justify-center shrink-0 border border-orange-100">
                                                <span className="text-[10px] font-bold uppercase">Oct</span>
                                                <span className="text-sm font-bold">{12 + i}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900 line-clamp-1">Assignment {i + 1}: Data Structures</p>
                                                <p className="text-xs text-slate-500">CS101 • 11:59 PM</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-4 py-2 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-lg transition-colors">
                                    View All Assignments
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
