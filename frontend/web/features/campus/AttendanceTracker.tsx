'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Clock, AlertCircle, Save, Calendar } from 'lucide-react';
import { campusService, StudentAttendance } from '../../services/campus.service';
import { toast } from 'sonner';

interface AttendanceTrackerProps {
    classId: string;
    className: string;
    onClose?: () => void;
}

export default function AttendanceTracker({ classId, className, onClose }: AttendanceTrackerProps) {
    const [students, setStudents] = useState<StudentAttendance[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadAttendance();
    }, [classId]);

    const loadAttendance = async () => {
        try {
            setLoading(true);
            const data = await campusService.getClassAttendance(classId);
            setStudents(data);
        } catch (error) {
            console.error("Failed to load attendance", error);
            toast.error("Failed to load student list");
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = (studentId: string, status: 'present' | 'absent' | 'late') => {
        setStudents(prev => prev.map(s =>
            s.student.id === studentId ? { ...s, status } : s
        ));
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updates = students.map(s => ({
                studentId: s.student.id,
                status: s.status
            }));

            await campusService.markAttendance({
                classId,
                date: new Date().toISOString(),
                updates
            });

            toast.success("Attendance saved successfully");
            if (onClose) onClose();
        } catch (error) {
            console.error("Failed to save attendance", error);
            toast.error("Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading student list...</div>;

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full max-h-[600px]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                    <h3 className="font-bold text-slate-800">{className}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                    {students.filter(s => s.status === 'present').length} / {students.length} Present
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {students.map((record) => (
                    <div key={record.student.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm">
                                {record.student.first_name[0]}{record.student.last_name[0]}
                            </div>
                            <div>
                                <p className="font-medium text-slate-900">{record.student.first_name} {record.student.last_name}</p>
                                <p className="text-xs text-slate-500">ID: {record.student.id.substring(0, 8)}...</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => updateStatus(record.student.id, 'present')}
                                className={`p-2 rounded-md transition-all ${record.status === 'present' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-400 hover:text-emerald-600 hover:bg-white'}`}
                                title="Present"
                            >
                                <Check size={16} />
                            </button>
                            <button
                                onClick={() => updateStatus(record.student.id, 'late')}
                                className={`p-2 rounded-md transition-all ${record.status === 'late' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-400 hover:text-amber-600 hover:bg-white'}`}
                                title="Late"
                            >
                                <Clock size={16} />
                            </button>
                            <button
                                onClick={() => updateStatus(record.student.id, 'absent')}
                                className={`p-2 rounded-md transition-all ${record.status === 'absent' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-400 hover:text-red-600 hover:bg-white'}`}
                                title="Absent"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>
                ))}

                {students.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                        No students enrolled in this class.
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-70 font-medium"
                >
                    {saving ? 'Saving...' : (
                        <>
                            <Save size={18} />
                            Save Attendance
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
