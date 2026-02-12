"use client";

import { useState, useEffect } from 'react';
import { Card, Button } from '@doptor/shared';
import { Plus, Users, GraduationCap, ChevronDown, UserPlus, Trash2 } from 'lucide-react';
import { campusService, CampusClass } from '../../../services/campus.service';
import { CreateClassDialog } from './dialogs/CreateClassDialog';
import { MapTeacherDialog } from './dialogs/MapTeacherDialog';
import { EnrollStudentDialog } from './dialogs/EnrollStudentDialog';
import { toast } from 'sonner';

export function ClassManager() {
    const [classes, setClasses] = useState<CampusClass[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateClassOpen, setIsCreateClassOpen] = useState(false);
    const [mapTeacherSection, setMapTeacherSection] = useState<{ isOpen: boolean, sectionName: string }>({ isOpen: false, sectionName: '' });
    const [enrollSection, setEnrollSection] = useState<{ isOpen: boolean, sectionId: string, sectionName: string }>({
        isOpen: false,
        sectionId: '',
        sectionName: ''
    });

    useEffect(() => {
        loadClasses();
    }, []);

    const loadClasses = async () => {
        setLoading(true);
        try {
            const data = await campusService.getClasses();
            setClasses(data);
        } catch (error) {
            console.error("Failed to load classes", error);
            toast.error("Failed to load classes");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this class?')) {
            try {
                await campusService.deleteClass(id);
                toast.success('Class deleted successfully');
                loadClasses();
            } catch (error) {
                console.error("Failed to delete class", error);
                toast.error("Failed to delete class");
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Classes & Sections</h2>
                    <p className="text-slate-500">Manage hierarchy, sections and class teachers.</p>
                </div>
                <Button
                    className="bg-primary-600 hover:bg-primary-700 text-white gap-2"
                    onClick={() => setIsCreateClassOpen(true)}
                >
                    <Plus size={18} /> New Class
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading classes...</div>
            ) : classes.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No classes found. Create one to get started.</div>
            ) : (
                <div className="space-y-4">
                    {classes.map((cls) => (
                        <Card key={cls.id} className="overflow-hidden">
                            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600">
                                        <GraduationCap size={20} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">{cls.name}</h3>
                                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">
                                        {cls.sections?.length || 0} Sections
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="secondary" size="sm" className="gap-2">
                                        <Plus size={16} /> Add Section
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 hover:bg-red-50 hover:text-red-700 p-2"
                                        onClick={(e) => handleDelete(cls.id, e)}
                                    >
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                {cls.sections && cls.sections.length > 0 ? cls.sections.map((section: any) => (
                                    <div key={section.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                                                {section.name.charAt(section.name.length - 1)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-900">{section.name}</h4>
                                                <p className="text-sm text-slate-500">{section.studentCount} Students</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            {/* Teacher Mapping UI */}
                                            <div className="flex items-center gap-3">
                                                <div className="text-right">
                                                    <p className="text-xs text-slate-400">Class Teacher</p>
                                                    {section.teacherId ? (
                                                        <p className="text-sm font-medium text-slate-900">Mr. Anderson</p>
                                                    ) : (
                                                        <p className="text-sm text-orange-600 italic">Not Assigned</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-primary-600 hover:bg-primary-50"
                                                    onClick={() => setMapTeacherSection({ isOpen: true, sectionName: section.name })}
                                                >
                                                    <UserPlus size={18} />
                                                </Button>
                                            </div>

                                            {/* Enroll Student Button */}
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="gap-2"
                                                onClick={() => setEnrollSection({
                                                    isOpen: true,
                                                    sectionId: section.id,
                                                    sectionName: `${cls.name} - ${section.name}`
                                                })}
                                            >
                                                <Users size={16} />
                                                Enroll Student
                                            </Button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="p-4 text-center text-slate-400 text-sm">No sections yet</div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <CreateClassDialog
                isOpen={isCreateClassOpen}
                onClose={() => setIsCreateClassOpen(false)}
                onSuccess={loadClasses}
            />

            <MapTeacherDialog
                isOpen={mapTeacherSection.isOpen}
                onClose={() => setMapTeacherSection({ ...mapTeacherSection, isOpen: false })}
                sectionName={mapTeacherSection.sectionName}
            />

            <EnrollStudentDialog
                isOpen={enrollSection.isOpen}
                onClose={() => setEnrollSection({ ...enrollSection, isOpen: false })}
                classId={enrollSection.sectionId}
                className={enrollSection.sectionName}
            />
        </div>
    );
}
