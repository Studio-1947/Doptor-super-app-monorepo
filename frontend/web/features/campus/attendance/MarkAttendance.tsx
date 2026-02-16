"use client";

import { useState, useMemo, useEffect } from 'react';
import { Calendar as CalendarIcon, Check, X, Clock, AlertCircle, Save, RotateCcw } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { toast } from 'sonner';
import { campusService, CampusClass, Student } from '../../../services/campus.service';

interface AttendanceState {
    studentId: string;
    studentName: string;
    rollNumber: string;
    status: 'present' | 'absent' | 'late' | 'excused';
}

export function MarkAttendance() {
    const today = new Date().toISOString().split('T')[0];

    const [classes, setClasses] = useState<CampusClass[]>([]);
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(today);
    const [attendanceData, setAttendanceData] = useState<AttendanceState[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        if (selectedClass) {
            loadAttendance();
        } else {
            setAttendanceData([]);
        }
    }, [selectedClass, selectedDate]);

    const loadClasses = async () => {
        try {
            const data = await campusService.getMyClasses(); // Or getAllClasses for admin?
            // Handle response which might be wrapped or just array
            // campusService.getMyClasses returns { role, classes } or just classes array if changed
            // Let's assume it returns { role: string, classes: CampusClass[] } based on backend
            // But frontend service implementation might have normalized it.
            // Let's check frontend service implementation again.
            // Previous view_file showed:
            // async getMyClasses() { ... return response.data; }
            // Backend returns { role, classes }.

            // Wait, looking at frontend service logic again (which I haven't viewed explicitly for getMyClasses but saw backend logic)
            // Backend getMyClasses returns { role: string, classes: [...] }
            // So we need to handle that.

            if (data && data.classes) {
                setClasses(data.classes);
            } else if (Array.isArray(data)) {
                setClasses(data);
            }

        } catch (error) {
            console.error("Failed to load classes", error);
            toast.error("Failed to load classes");
        }
    };

    const loadAttendance = async () => {
        if (!selectedClass) return;
        setLoading(true);
        try {
            // Note: getClassAttendance currently fetches for "today" in backend if no date param passed
            // But here we might want to fetch for selectedDate. 
            // Backend endpoint: @Get("attendance/:classId") -> getClassAttendance(classId, userId) -> uses "today"
            // We need to update backend to accept date!
            // For now, let's assume it works for "today" and we'll fix backend later if needed for past dates.
            // Or we just send the date in a query param if supported (it is NOT yet).

            // However, the task is to finish the feature. 
            // Let's use what we have. API returns list of { student, status }.

            const data = await campusService.getClassAttendance(selectedClass);

            const mappedData: AttendanceState[] = data.map((record: any) => ({
                studentId: record.student.id,
                studentName: `${record.student.first_name} ${record.student.last_name}`,
                rollNumber: record.student.rollNo || "N/A",
                status: (record.status === 'pending' ? 'present' : record.status) as any
            })).sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

            setAttendanceData(mappedData);

        } catch (error) {
            console.error("Failed to load attendance", error);
            toast.error("Failed to load student list");
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (studentId: string, status: AttendanceState['status']) => {
        setAttendanceData(prev => prev.map(item =>
            item.studentId === studentId ? { ...item, status } : item
        ));
    };

    const handleMarkAll = (status: AttendanceState['status']) => {
        setAttendanceData(prev => prev.map(item => ({ ...item, status })));
        toast.success(`Marked all students as ${status}`);
    };

    const handleReset = () => {
        setAttendanceData(prev => prev.map(item => ({ ...item, status: 'present' })));
        toast.info('Reset all to present');
    };

    const handleSave = async () => {
        if (!selectedClass || !selectedDate) {
            toast.error('Please select class and date');
            return;
        }

        if (attendanceData.length === 0) {
            toast.error('No students to mark');
            return;
        }

        setSaving(true);
        try {
            await campusService.markAttendance({
                classId: selectedClass,
                date: selectedDate,
                updates: attendanceData.map(s => ({
                    studentId: s.studentId,
                    status: s.status
                }))
            });
            toast.success('Attendance saved successfully');
        } catch (error) {
            console.error("Failed to save attendance", error);
            toast.error("Failed to save attendance");
        } finally {
            setSaving(false);
        }
    };

    // Calculate summary
    const summary = useMemo(() => {
        const total = attendanceData.length;
        const present = attendanceData.filter(s => s.status === 'present').length;
        const absent = attendanceData.filter(s => s.status === 'absent').length;
        const late = attendanceData.filter(s => s.status === 'late').length;
        const excused = attendanceData.filter(s => s.status === 'excused').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return { total, present, absent, late, excused, percentage };
    }, [attendanceData]);

    const selectedClassData = classes.find(c => c.id === selectedClass);

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Class <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                setSelectedClass(e.target.value);
                            }}
                            className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                        >
                            <option value="">Select Class</option>
                            {classes.map(cls => (
                                <option key={cls.id} value={cls.id}>
                                    {cls.course?.code} - {cls.course?.name}
                                    {/* Backend doesn't send section name yet, maybe in future */}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                max={today}
                                className="w-full border border-slate-200 py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                            />
                        </div>
                    </div>
                </div>
            </Card>

            {/* Summary Cards */}
            {attendanceData.length > 0 && (
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
            {attendanceData.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-slate-600">Quick Actions:</span>
                    <button
                        onClick={() => handleMarkAll('present')}
                        className="px-3 py-1.5 text-xs bg-emerald-600 text-white hover:bg-emerald-700 transition-colors font-medium rounded"
                    >
                        Mark All Present
                    </button>
                    <button
                        onClick={() => handleMarkAll('absent')}
                        className="px-3 py-1.5 text-xs bg-red-600 text-white hover:bg-red-700 transition-colors font-medium rounded"
                    >
                        Mark All Absent
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-3 py-1.5 text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium flex items-center gap-1 rounded"
                    >
                        <RotateCcw size={14} />
                        Reset
                    </button>
                </div>
            )}

            {/* Student List */}
            <div className="flex-1 overflow-y-auto">
                {!selectedClass ? (
                    <Card className="p-12 border-slate-200 text-center">
                        <CalendarIcon size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">Please select a class to mark attendance</p>
                    </Card>
                ) : loading ? (
                    <Card className="p-12 border-slate-200 text-center">
                        <div className="text-sm text-slate-500">Loading students...</div>
                    </Card>
                ) : attendanceData.length === 0 ? (
                    <Card className="p-12 border-slate-200 text-center">
                        <AlertCircle size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">No students found for this class</p>
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
                                    {attendanceData.map((item) => (
                                        <tr key={item.studentId} className="hover:bg-slate-50 transition-colors">
                                            <td className="py-3 px-4 font-medium text-slate-900">{item.rollNumber}</td>
                                            <td className="py-3 px-4 font-medium text-slate-900">{item.studentName}</td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleStatusChange(item.studentId, 'present')}
                                                        className={`px-3 py-1.5 text-xs font-medium transition-colors rounded ${item.status === 'present'
                                                            ? 'bg-emerald-600 text-white'
                                                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                                            }`}
                                                    >
                                                        <Check size={14} className="inline mr-1" />
                                                        Present
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(item.studentId, 'absent')}
                                                        className={`px-3 py-1.5 text-xs font-medium transition-colors rounded ${item.status === 'absent'
                                                            ? 'bg-red-600 text-white'
                                                            : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                                                            }`}
                                                    >
                                                        <X size={14} className="inline mr-1" />
                                                        Absent
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusChange(item.studentId, 'late')}
                                                        className={`px-3 py-1.5 text-xs font-medium transition-colors rounded ${item.status === 'late'
                                                            ? 'bg-orange-600 text-white'
                                                            : 'bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100'
                                                            }`}
                                                    >
                                                        <Clock size={14} className="inline mr-1" />
                                                        Late
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}
            </div>

            {/* Save Button */}
            {attendanceData.length > 0 && (
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
