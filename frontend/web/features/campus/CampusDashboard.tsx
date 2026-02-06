"use client";

import { Card, Button } from '@doptor/shared';
import { GraduationCap, Users, Calendar, ArrowRight, Plus } from 'lucide-react';
import TimeTable from './TimeTable';
import { useState, useEffect } from 'react';
import { CampusClass, campusService } from '../../services/campus.service';
import { useRouter } from 'next/navigation';

// Mock data for display until connected to real backend
const MOCK_CLASSES: CampusClass[] = [
    {
        id: '1',
        course: { id: 'c1', code: 'CS101', name: 'Intro to Computer Science', credits: 3 },
        instructor: { id: 'i1', first_name: 'Dr.', last_name: 'Smith', email: 'smith@uni.edu', role: 'staff' },
        schedule: [
            { day: 'Monday', startTime: '09:00', endTime: '10:30', roomId: '101' },
            { day: 'Wednesday', startTime: '09:00', endTime: '10:30', roomId: '101' }
        ],
        location: 'Room 101',
        studentCount: 45
    },
    {
        id: '2',
        course: { id: 'c2', code: 'MATH201', name: 'Calculus II', credits: 4 },
        instructor: { id: 'i2', first_name: 'Prof.', last_name: 'Johnson', email: 'johnson@uni.edu', role: 'staff' },
        schedule: [
            { day: 'Tuesday', startTime: '11:00', endTime: '12:30', roomId: '204' },
            { day: 'Thursday', startTime: '11:00', endTime: '12:30', roomId: '204' }
        ],
        location: 'Room 204',
        studentCount: 38
    }
];

export function CampusDashboard() {
    const router = useRouter();
    const [classes] = useState<CampusClass[]>(MOCK_CLASSES);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900">Campus Overview</h2>
                <p className="text-slate-500">Manage academic schedules, attendance, and student performance.</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard
                    title="Active Students"
                    value="1,245"
                    icon={Users}
                    color="text-emerald-600"
                    bg="bg-emerald-50"
                />
                <StatCard
                    title="Faculty Members"
                    value="84"
                    icon={GraduationCap}
                    color="text-blue-600"
                    bg="bg-blue-50"
                />
                <StatCard
                    title="Classes Today"
                    value="12"
                    icon={Calendar}
                    color="text-indigo-600"
                    bg="bg-indigo-50"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Timetable Widget */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-slate-900">Weekly Schedule</h3>
                        <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => router.push('/campus/timetable')}>
                            View Full Schedule <ArrowRight size={16} className="ml-1" />
                        </Button>
                    </div>
                    <TimeTable classes={classes} onClassClick={(cls) => console.log('Clicked', cls)} />
                </div>

                {/* Quick Actions & Recent */}
                <div className="space-y-6">
                    <Card className="p-5">
                        <h3 className="font-semibold text-lg mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            <ActionButton label="Mark Attendance" onClick={() => router.push('/campus/attendance')} />
                            <ActionButton label="Manage Courses" onClick={() => router.push('/campus/academics/courses')} />
                            <ActionButton label="View Faculty" onClick={() => router.push('/campus/academics/faculty')} />
                            <ActionButton label="Manage Classes" onClick={() => router.push('/campus/academics/classes')} />
                        </div>
                    </Card>

                    <Card className="p-5">
                        <h3 className="font-semibold text-lg mb-4">Next Class</h3>
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="font-bold text-indigo-900">CS101</p>
                                    <p className="text-sm text-indigo-700">Intro to Computer Science</p>
                                </div>
                                <span className="bg-white text-indigo-600 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                                    10:00 AM
                                </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-indigo-600 mt-2">
                                <Users size={14} />
                                <span>45 Students</span>
                                <span className="mx-1">•</span>
                                <span>Room 101</span>
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
        <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
                <span className="text-slate-500 text-xs font-medium uppercase tracking-wider">{title}</span>
                <div className={`p-2 rounded-lg ${bg} ${color}`}>
                    <Icon size={16} />
                </div>
            </div>
            <div className="text-3xl font-bold text-slate-900">{value}</div>
        </Card>
    );
}

function ActionButton({ label, icon: Icon, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className="w-full flex items-center justify-between p-3 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all group"
        >
            <span>{label}</span>
            {Icon ? <Icon size={16} className="text-slate-400 group-hover:text-slate-600" /> : <ArrowRight size={16} className="text-slate-400 group-hover:text-slate-600" />}
        </button>
    );
}
