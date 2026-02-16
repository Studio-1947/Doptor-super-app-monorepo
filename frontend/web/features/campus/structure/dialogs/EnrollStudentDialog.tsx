"use client";

import { useState, useMemo, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { campusService, Student } from '../../../../services/campus.service';
import { toast } from 'sonner';

interface EnrollStudentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    classId: string;
    className: string;
    onSuccess?: () => void;
}

export function EnrollStudentDialog({ isOpen, onClose, classId, className, onSuccess }: EnrollStudentDialogProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
    const [enrolling, setEnrolling] = useState(false);

    // In a real app with many students, we'd search via API.
    // For now, we load all students and filter client-side as list is small.
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [loadingStudents, setLoadingStudents] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadStudents();
        }
    }, [isOpen]);

    const loadStudents = async () => {
        setLoadingStudents(true);
        try {
            const data = await campusService.getStudentList();
            setAllStudents(data);
        } catch (error) {
            console.error("Failed to load students", error);
            toast.error("Failed to load student list");
        } finally {
            setLoadingStudents(false);
        }
    };

    const filteredStudents = useMemo(() => {
        if (!searchQuery) return allStudents.slice(0, 10); // Show first 10 if no query
        const query = searchQuery.toLowerCase();
        return allStudents.filter(student => {
            const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
            return fullName.includes(query) ||
                student.email?.toLowerCase().includes(query) ||
                (student.rollNo && student.rollNo.includes(searchQuery));
        });
    }, [allStudents, searchQuery]);

    const handleEnroll = async () => {
        if (!selectedStudent) {
            toast.error('Please select a student');
            return;
        }

        try {
            setEnrolling(true);
            await campusService.enrollStudent({ classId, studentId: selectedStudent });
            toast.success('Student enrolled successfully');
            setSearchQuery('');
            setSelectedStudent(null);
            onClose();
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Failed to enroll student', error);
            toast.error('Failed to enroll student');
        } finally {
            setEnrolling(false);
        }
    };

    const getStudentInitials = (s: Student) => {
        return `${s.first_name[0]}${s.last_name[0]}`.toUpperCase();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[600px] flex flex-col">
                <div className="flex items-center justify-between p-5 border-b border-slate-200">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Enroll Student</h3>
                        <p className="text-sm text-slate-500">{className}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-5 space-y-4 flex-1 overflow-hidden flex flex-col">
                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, email, or roll number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Student List */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {loadingStudents ? (
                            <div className="text-center py-8 text-slate-500">Loading students...</div>
                        ) : (
                            <>
                                {filteredStudents.map((student) => (
                                    <button
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student.id)}
                                        className={`w-full p-3 rounded-lg border-2 transition-all text-left ${selectedStudent === student.id
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm">
                                                {getStudentInitials(student)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-slate-900">{student.first_name} {student.last_name}</p>
                                                <p className="text-xs text-slate-500 truncate">{student.email || 'No email'}</p>
                                            </div>
                                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                {student.rollNo || 'N/A'}
                                            </span>
                                        </div>
                                    </button>
                                ))}

                                {filteredStudents.length === 0 && (
                                    <div className="text-center py-8 text-slate-500">
                                        No students found matching your search.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="p-5 border-t border-slate-200 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleEnroll}
                        disabled={!selectedStudent || enrolling}
                        className="flex-1 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {enrolling ? 'Enrolling...' : 'Enroll Student'}
                    </button>
                </div>
            </div>
        </div>
    );
}
