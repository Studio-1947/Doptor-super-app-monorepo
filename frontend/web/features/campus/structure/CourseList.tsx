"use client";

import { useState, useEffect } from 'react';
import { Card, Button } from '@doptor/shared';
import { Plus, BookOpen, Search, Trash2 } from 'lucide-react';
import { campusService } from '../../../services/campus.service';
import { CreateCourseDialog } from './dialogs/CreateCourseDialog';
import { toast } from 'sonner';

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
            toast.error("Failed to load courses");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this course?")) return;

        try {
            await campusService.deleteCourse(id);
            toast.success("Course deleted");
            loadCourses();
        } catch (error) {
            console.error("Failed to delete course", error);
            toast.error("Failed to delete course");
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
                        <Card key={course.id} className="p-5 hover:shadow-md transition-shadow group relative">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(course.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Delete Course"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

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
