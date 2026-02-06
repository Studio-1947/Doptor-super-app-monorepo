"use client";

import { useState, useMemo } from 'react';
import { Calendar, Check, X, Clock, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { toast } from 'sonner';
import { MOCK_CLASSES } from '../campus-mock.db';
import { MOCK_STUDENTS, getStudentFullName, getStudentInitials } from '../students/student-mock.db';
import {
    AttendanceRecord,
    getAttendanceByDate,
    hasAttendanceBeenMarked,
    calculateClassAttendanceSummary
} from './attendance-mock.db';

export function MarkAttendance() {
    const today = new Date().toISOString().split('T')[0];

    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedSection, setSelectedSection] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [attendanceData, setAttendanceData] = useState<Map<string, AttendanceRecord['status']>>(new Map());
    const [saving, setSaving] = useState(false);

    // Get students for selected class and section
    const students = useMemo(() => {
        if (!selectedClass || !selectedSection) return [];
        return MOCK_STUDENTS.filter(
            s => s.classId === selectedClass && s.sectionId === selectedSection
        ).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));
    }, [selectedClass, selectedSection]);

    // Check if attendance already marked
    const isAlreadyMarked = useMemo(() => {
        if (!selectedClass || !selectedSection || !selectedDate) return false;
        return hasAttendanceBeenMarked(selectedClass, selectedSection, selectedDate);
    }, [selectedClass, selectedSection, selectedDate]);

    // Get existing attendance if already marked
    const existingAttendance = useMemo(() => {
        if (!isAlreadyMarked) return null;
        return calculateClassAttendanceSummary(selectedClass, selectedSection, selectedDate);
    }, [isAlreadyMarked, selectedClass, selectedSection, selectedDate]);

    // Get selected class data
    const classData = MOCK_CLASSES.find(c => c.id === selectedClass);

    // Initialize attendance data when students change
    useMemo(() => {
        if (students.length > 0 && attendanceData.size === 0) {
            const newData = new Map<string, AttendanceRecord['status']>();
            students.forEach(student => {
                newData.set(student.id, 'present'); // Default to present
            });
            setAttendanceData(newData);
        }
    }, [students]);

    const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
        setAttendanceData(prev => {
            const newData = new Map(prev);
            newData.set(studentId, status);
            return newData;
        });
    };

    const handleMarkAll = (status: AttendanceRecord['status']) => {
        const newData = new Map<string, AttendanceRecord['status']>();
        students.forEach(student => {
            newData.set(student.id, status);
        });
        setAttendanceData(newData);
        toast.success(`Marked all students as ${status}`);
    };

    const handleReset = () => {
        const newData = new Map<string, AttendanceRecord['status']>();
        students.forEach(student => {
            newData.set(student.id, 'present');
        });
        setAttendanceData(newData);
        toast.info('Reset all to present');
    };

    const handleSave = async () => {
        if (!selectedClass || !selectedSection || !selectedDate) {
            toast.error('Please select class, section, and date');
            return;
        }

        if (students.length === 0) {
            toast.error('No students found for selected class and section');
            return;
        }

        setSaving(true);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setSaving(false);
        toast.success('Attendance saved successfully');
    };

    // Calculate summary
    const summary = useMemo(() => {
        const total = students.length;
        const present = Array.from(attendanceData.values()).filter(s => s === 'present').length;
        const absent = Array.from(attendanceData.values()).filter(s => s === 'absent').length;
        const late = Array.from(attendanceData.values()).filter(s => s === 'late').length;
        const excused = Array.from(attendanceData.values()).filter(s => s === 'excused').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return { total, present, absent, late, excused, percentage };
    }, [students, attendanceData]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Mark Attendance</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Mark daily attendance for students
                </p>
            </div>

            {/* Selection Panel */}
            <Card className="p-6 mb-6 border-slate-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Class <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                setSelectedClass(e.target.value);
                                setSelectedSection('');
                                setAttendanceData(new Map());
                            }}
                            className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        >
                            <option value="">Select Class</option>
                            {MOCK_CLASSES.map(cls => (
                                <option key={cls.id} value={cls.id}>{cls.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Section <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedSection}
                            onChange={(e) => {
                                setSelectedSection(e.target.value);
                                setAttendanceData(new Map());
                            }}
                            disabled={!selectedClass}
                            className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                        >
                            <option value="">Select Section</option>
                            {classData?.sections.map(section => (
                                <option key={section.id} value={section.id}>{section.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={today}
                                className="w-full border border-slate-200 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                    </div>
                </div>

                {/* Already Marked Warning */}
                {isAlreadyMarked && existingAttendance && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 flex items-start gap-3">
                        <AlertCircle size={20} className="text-orange-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <p className="text-sm font-medium text-orange-900">
                                Attendance already marked for this date
                            </p>
                            <p className="text-xs text-orange-700 mt-1">
                                Present: {existingAttendance.present}, Absent: {existingAttendance.absent},
                                Late: {existingAttendance.late}, Excused: {existingAttendance.excused}
                            </p>
                        </div>
                    </div>
                )}
            </Card>

            {/* Summary Cards */}
            {students.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <Card className="p-4 border-slate-200">
                        <p className="text-xs text-slate-500">Total Students</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{summary.total}</p>
                    </Card>
                    <Card className="p-4 border-emerald-200 bg-emerald-50">
                        <p className="text-xs text-emerald-700">Present</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{summary.present}</p>
                    </Card>
                    <Card className="p-4 border-red-200 bg-red-50">
                        <p className="text-xs text-red-700">Absent</p>
                        <p className="text-2xl font-bold text-red-700 mt-1">{summary.absent}</p>
                    </Card>
                    <Card className="p-4 border-orange-200 bg-orange-50">
                        <p className="text-xs text-orange-700">Late</p>
                        <p className="text-2xl font-bold text-orange-700 mt-1">{summary.late}</p>
                    </Card>
                    <Card className="p-4 border-blue-200 bg-blue-50">
                        <p className="text-xs text-blue-700">Attendance %</p>
                        <p className="text-2xl font-bold text-blue-700 mt-1">{summary.percentage}%</p>
                    </Card>
                </div>
            )}

            {/* Bulk Actions */}
            {students.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-slate-600">Quick Actions:</span>
                    <button
                        onClick={() => handleMarkAll('present')}
                        className="px-3 py-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium"
                    >
                        Mark All Present
                    </button>
                    <button
                        onClick={() => handleMarkAll('absent')}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
                    >
                        Mark All Absent
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-3 py-1.5 text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium flex items-center gap-1"
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                </div>
            )}

            {/* Student List */}
            <div className="flex-1 overflow-y-auto">
                {!selectedClass || !selectedSection ? (
                    <Card className="p-12 border-slate-200 text-center">
                        <Calendar size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">Please select a class and section to mark attendance</p>
                    </Card>
                ) : students.length === 0 ? (
                    <Card className="p-12 border-slate-200 text-center">
                        <AlertCircle size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No students found for selected class and section</p>
                    </Card>
                ) : (
                    <Card className="border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Roll No</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Student Name</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {students.map((student) => {
                                        const status = attendanceData.get(student.id) || 'present';
                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-slate-900">{student.rollNumber}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                                            {getStudentInitials(student)}
                                                        </div>
                                                        <span className="font-medium text-slate-900">{getStudentFullName(student)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'present')}
                                                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${status === 'present'
                                                                    ? 'bg-emerald-600 text-white'
                                                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                                }`}
                                                        >
                                                            <Check size={14} className="inline mr-1" />
                                                            Present
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'absent')}
                                                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${status === 'absent'
                                                                    ? 'bg-red-600 text-white'
                                                                    : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                                                }`}
                                                        >
                                                            <X size={14} className="inline mr-1" />
                                                            Absent
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'late')}
                                                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${status === 'late'
                                                                    ? 'bg-orange-600 text-white'
                                                                    : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                                                                }`}
                                                        >
                                                            <Clock size={14} className="inline mr-1" />
                                                            Late
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusChange(student.id, 'excused')}
                                                            className={`px-3 py-1.5 text-xs font-medium transition-colors ${status === 'excused'
                                                                    ? 'bg-blue-600 text-white'
                                                                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                                                }`}
                                                        >
                                                            Excused
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Save Button */}
            {students.length > 0 && (
                <div className="mt-6 flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="gap-2 px-6"
                    >
                        <Save size={16} />
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </Button>
                </div>
            )}
        </div>
    );
}
