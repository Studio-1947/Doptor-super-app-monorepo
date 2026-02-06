"use client";

import { useState, useEffect } from 'react';
import { Card, Button } from '@doptor/shared';
import { Plus, BookOpen, Search } from 'lucide-react';
import { campusService } from '../../../services/campus.service';
import { CreateCourseDialog } from './dialogs/CreateCourseDialog';

interface Course {
    id: string;
    code: string;
    name: string;
    description?: string;
    credits: number;
}

export function CourseList() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadCourses();
    }, []);

    const loadCourses = async () => {
        try {
            setLoading(true);
            const data = await campusService.getCourses();
            setCourses(data);
        } catch (error) {
            console.error("Failed to load courses", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Course Management</h2>
                    <p className="text-slate-500">Manage courses, credits, and curriculum.</p>
                </div>
                <Button
                    className="bg-primary-600 hover:bg-primary-700 text-white gap-2"
                    onClick={() => setIsCreateDialogOpen(true)}
                >
                    <Plus size={18} /> New Course
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                    type="text"
                    placeholder="Search courses by name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
            </div>

            {/* Course Grid */}
            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading courses...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredCourses.map((course) => (
                        <Card key={course.id} className="p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                                <div className="p-2.5 bg-indigo-50 rounded-lg text-indigo-600">
                                    <BookOpen size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <h3 className="font-bold text-slate-900 truncate">{course.code}</h3>
                                        <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap">
                                            {course.credits} Credits
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 mb-2">{course.name}</p>
                                    {course.description && (
                                        <p className="text-xs text-slate-500 line-clamp-2">{course.description}</p>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {!loading && filteredCourses.length === 0 && (
                <div className="text-center py-12">
                    <BookOpen className="mx-auto text-slate-300 mb-3" size={48} />
                    <p className="text-slate-500">
                        {searchQuery ? 'No courses found matching your search.' : 'No courses available. Create one to get started.'}
                    </p>
                </div>
            )}

            <CreateCourseDialog
                isOpen={isCreateDialogOpen}
                onClose={() => setIsCreateDialogOpen(false)}
                onSuccess={loadCourses}
            />
        </div>
    );
}
