"use client";

import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, User } from 'lucide-react';
import { Card } from '@doptor/shared';
import { MOCK_STUDENTS, getStudentFullName } from '../students/student-mock.db';
import { getMonthlyAttendance, AttendanceRecord } from './attendance-mock.db';

export function AttendanceCalendar() {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth());
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [selectedStudent, setSelectedStudent] = useState<string>(MOCK_STUDENTS[0]?.id || '');
    const [selectedDay, setSelectedDay] = useState<number | null>(null);

    const student = MOCK_STUDENTS.find(s => s.id === selectedStudent);

    // Get monthly attendance data
    const monthlyData = useMemo(() => {
        if (!selectedStudent) return {};
        return getMonthlyAttendance(selectedStudent, selectedYear, selectedMonth);
    }, [selectedStudent, selectedYear, selectedMonth]);

    // Calculate month statistics
    const monthStats = useMemo(() => {
        const statuses = Object.values(monthlyData).filter(s => s !== null);
        const total = statuses.length;
        const present = statuses.filter(s => s === 'present').length;
        const absent = statuses.filter(s => s === 'absent').length;
        const late = statuses.filter(s => s === 'late').length;
        const excused = statuses.filter(s => s === 'excused').length;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

        return { total, present, absent, late, excused, percentage };
    }, [monthlyData]);

    // Get calendar days
    const calendarDays = useMemo(() => {
        const firstDay = new Date(selectedYear, selectedMonth, 1);
        const lastDay = new Date(selectedYear, selectedMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        const days: (number | null)[] = [];

        // Add empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(null);
        }

        // Add days of month
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(day);
        }

        return days;
    }, [selectedYear, selectedMonth]);

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handlePreviousMonth = () => {
        if (selectedMonth === 0) {
            setSelectedMonth(11);
            setSelectedYear(selectedYear - 1);
        } else {
            setSelectedMonth(selectedMonth - 1);
        }
        setSelectedDay(null);
    };

    const handleNextMonth = () => {
        if (selectedMonth === 11) {
            setSelectedMonth(0);
            setSelectedYear(selectedYear + 1);
        } else {
            setSelectedMonth(selectedMonth + 1);
        }
        setSelectedDay(null);
    };

    const getStatusColor = (status: AttendanceRecord['status'] | null) => {
        if (!status) return 'bg-white border-slate-200';
        switch (status) {
            case 'present':
                return 'bg-emerald-100 border-emerald-300 text-emerald-900';
            case 'absent':
                return 'bg-red-100 border-red-300 text-red-900';
            case 'late':
                return 'bg-orange-100 border-orange-300 text-orange-900';
            case 'excused':
                return 'bg-blue-100 border-blue-300 text-blue-900';
            default:
                return 'bg-white border-slate-200';
        }
    };

    const getStatusLabel = (status: AttendanceRecord['status'] | null) => {
        if (!status) return 'No Record';
        return status.charAt(0).toUpperCase() + status.slice(1);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Attendance Calendar</h1>
                <p className="text-sm text-slate-500 mt-1">
                    View monthly attendance in calendar format
                </p>
            </div>

            {/* Student Selection */}
            <Card className="p-6 mb-6 border-slate-200">
                <div className="flex items-center gap-4">
                    <User size={20} className="text-slate-400" />
                    <div className="flex-1">
                        <label className="block text-xs font-medium text-slate-700 mb-1.5">
                            Select Student
                        </label>
                        <select
                            value={selectedStudent}
                            onChange={(e) => {
                                setSelectedStudent(e.target.value);
                                setSelectedDay(null);
                            }}
                            className="w-full md:w-96 border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        >
                            {MOCK_STUDENTS.map(s => (
                                <option key={s.id} value={s.id}>
                                    {getStudentFullName(s)} - {s.rollNumber}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">Total Days</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{monthStats.total}</p>
                </Card>
                <Card className="p-4 border-emerald-200 bg-emerald-50">
                    <p className="text-xs text-emerald-700">Present</p>
                    <p className="text-2xl font-bold text-emerald-700 mt-1">{monthStats.present}</p>
                </Card>
                <Card className="p-4 border-red-200 bg-red-50">
                    <p className="text-xs text-red-700">Absent</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">{monthStats.absent}</p>
                </Card>
                <Card className="p-4 border-orange-200 bg-orange-50">
                    <p className="text-xs text-orange-700">Late</p>
                    <p className="text-2xl font-bold text-orange-700 mt-1">{monthStats.late}</p>
                </Card>
                <Card className="p-4 border-blue-200 bg-blue-50">
                    <p className="text-xs text-blue-700">Excused</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{monthStats.excused}</p>
                </Card>
                <Card className="p-4 border-primary-200 bg-primary-50">
                    <p className="text-xs text-primary-700">Percentage</p>
                    <p className="text-2xl font-bold text-primary-700 mt-1">{monthStats.percentage}%</p>
                </Card>
            </div>

            {/* Calendar */}
            <Card className="flex-1 border-slate-200 overflow-hidden flex flex-col">
                {/* Calendar Header */}
                <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                    <button
                        onClick={handlePreviousMonth}
                        className="p-2 hover:bg-slate-100 transition-colors"
                    >
                        <ChevronLeft size={20} className="text-slate-600" />
                    </button>
                    <div className="flex items-center gap-2">
                        <CalendarIcon size={20} className="text-slate-600" />
                        <h3 className="text-lg font-bold text-slate-900">
                            {monthNames[selectedMonth]} {selectedYear}
                        </h3>
                    </div>
                    <button
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-slate-100 transition-colors"
                    >
                        <ChevronRight size={20} className="text-slate-600" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="flex-1 p-4 overflow-auto">
                    {/* Week Day Headers */}
                    <div className="grid grid-cols-7 gap-2 mb-2">
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-slate-600 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-2">
                        {calendarDays.map((day, index) => {
                            if (day === null) {
                                return <div key={`empty-${index}`} className="aspect-square" />;
                            }

                            const status = monthlyData[day];
                            const isToday =
                                day === today.getDate() &&
                                selectedMonth === today.getMonth() &&
                                selectedYear === today.getFullYear();
                            const isSelected = day === selectedDay;

                            return (
                                <button
                                    key={day}
                                    onClick={() => setSelectedDay(day)}
                                    className={`aspect-square border-2 p-2 transition-all hover:shadow-md ${getStatusColor(status)
                                        } ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                                        } ${isToday ? 'font-bold' : ''
                                        }`}
                                >
                                    <div className="text-sm">{day}</div>
                                    {status && (
                                        <div className="text-xs mt-1 truncate">
                                            {status === 'present' ? '✓' : status === 'absent' ? '✗' : status === 'late' ? '⏰' : '📝'}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Selected Day Details */}
                {selectedDay && (
                    <div className="p-4 border-t border-slate-200 bg-slate-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">
                                    {monthNames[selectedMonth]} {selectedDay}, {selectedYear}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">
                                    {student ? getStudentFullName(student) : 'Unknown Student'}
                                </p>
                            </div>
                            <div className={`px-4 py-2 text-sm font-medium ${getStatusColor(monthlyData[selectedDay])
                                }`}>
                                {getStatusLabel(monthlyData[selectedDay])}
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Legend */}
            <Card className="mt-4 p-4 border-slate-200">
                <p className="text-xs font-semibold text-slate-700 mb-3">Legend</p>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-100 border-2 border-emerald-300" />
                        <span className="text-xs text-slate-600">Present</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-red-100 border-2 border-red-300" />
                        <span className="text-xs text-slate-600">Absent</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-orange-100 border-2 border-orange-300" />
                        <span className="text-xs text-slate-600">Late</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300" />
                        <span className="text-xs text-slate-600">Excused</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-white border-2 border-slate-200" />
                        <span className="text-xs text-slate-600">No Record</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
