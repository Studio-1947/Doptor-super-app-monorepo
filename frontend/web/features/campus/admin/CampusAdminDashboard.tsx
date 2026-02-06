"use client";

import { Card, Button } from '@doptor/shared';
import { Settings, BookOpen, Users, Calendar, Plus, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function CampusAdminDashboard() {
    const router = useRouter();

    const adminModules = [
        {
            title: 'Academic Years',
            description: 'Manage sessions, terms and calendars',
            icon: Calendar,
            path: '/campus/academics/years',
            color: 'text-violet-600',
            bg: 'bg-violet-50'
        },
        {
            title: 'Departments',
            description: 'Faculties, departments and subjects',
            icon: BookOpen,
            path: '/campus/academics/departments',
            color: 'text-blue-600',
            bg: 'bg-blue-50'
        },
        {
            title: 'Classes & Sections',
            description: 'Manage classes, sections and teacher mapping',
            icon: Users,
            path: '/campus/academics/classes',
            color: 'text-emerald-600',
            bg: 'bg-emerald-50'
        },
        {
            title: 'Timetable Configuration',
            description: 'Set up weekly schedules and periods',
            icon: Settings,
            path: '/campus/academics/timetable',
            color: 'text-orange-600',
            bg: 'bg-orange-50'
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h2 className="text-2xl font-bold text-slate-900">Campus Administration</h2>
                <p className="text-slate-500">Configure your institution structure, academics, and system settings.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {adminModules.map((module) => (
                    <Card
                        key={module.title}
                        className="p-6 cursor-pointer hover:shadow-md transition-all group border-slate-200"
                        onClick={() => router.push(module.path)}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${module.bg} ${module.color} group-hover:scale-110 transition-transform`}>
                                <module.icon size={24} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg text-slate-900 mb-1 group-hover:text-primary-600 transition-colors">
                                    {module.title}
                                </h3>
                                <p className="text-slate-500 text-sm">{module.description}</p>
                            </div>
                            <div className="text-slate-300 group-hover:text-primary-500 transition-colors">
                                <ChevronRight size={20} />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Card className="p-6 bg-slate-900 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg mb-1">Quick Setup Wizard</h3>
                        <p className="text-slate-400 text-sm">Need help setting up from scratch? Use our guided wizard.</p>
                    </div>
                    <Button variant="outline" className="text-white border-slate-700 hover:bg-slate-800">
                        Start Setup
                    </Button>
                </div>
            </Card>
        </div>
    );
}
