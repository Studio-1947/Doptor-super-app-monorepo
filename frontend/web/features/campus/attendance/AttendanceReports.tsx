"use client";

import { useState, useMemo } from 'react';
import { Filter, Download, FileText, TrendingUp, Users, Calendar } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { MOCK_CLASSES } from '../campus-mock.db';
import { MOCK_STUDENTS, getStudentFullName } from '../students/student-mock.db';
import {
    getAttendanceByDateRange,
    calculateAttendanceSummary,
    calculateClassAttendanceSummary,
    AttendanceRecord
} from './attendance-mock.db';

type ReportType = 'daily' | 'monthly' | 'student-wise' | 'class-trends';

export function AttendanceReports() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [reportType, setReportType] = useState<ReportType>('monthly');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterSection, setFilterSection] = useState<string>('all');
    const [filterStudent, setFilterStudent] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>(thirtyDaysAgo);
    const [endDate, setEndDate] = useState<string>(today);
    const [showFilters, setShowFilters] = useState(true);

    const selectedClass = MOCK_CLASSES.find(c => c.id === filterClass);

    // Generate report data based on type
    const reportData = useMemo(() => {
        const records = getAttendanceByDateRange(startDate, endDate);

        if (reportType === 'student-wise') {
            // Student-wise attendance percentage
            let students = MOCK_STUDENTS;
            if (filterClass !== 'all') {
                students = students.filter(s => s.classId === filterClass);
            }
            if (filterSection !== 'all') {
                students = students.filter(s => s.sectionId === filterSection);
            }

            return students.map(student => {
                const summary = calculateAttendanceSummary(student.id, startDate, endDate);
                return {
                    id: student.id,
                    name: getStudentFullName(student),
                    rollNumber: student.rollNumber,
                    class: MOCK_CLASSES.find(c => c.id === student.classId)?.name || 'Unknown',
                    section: selectedClass?.sections.find(s => s.id === student.sectionId)?.name || 'Unknown',
                    ...summary,
                };
            }).sort((a, b) => b.percentage - a.percentage);
        }

        if (reportType === 'daily') {
            // Daily attendance summary
            const dailySummary: { [date: string]: { total: number; present: number; absent: number; late: number; excused: number; percentage: number } } = {};

            records.forEach(record => {
                if (!dailySummary[record.date]) {
                    dailySummary[record.date] = { total: 0, present: 0, absent: 0, late: 0, excused: 0, percentage: 0 };
                }
                dailySummary[record.date].total++;
                if (record.status === 'present') dailySummary[record.date].present++;
                if (record.status === 'absent') dailySummary[record.date].absent++;
                if (record.status === 'late') dailySummary[record.date].late++;
                if (record.status === 'excused') dailySummary[record.date].excused++;
            });

            Object.keys(dailySummary).forEach(date => {
                const data = dailySummary[date];
                data.percentage = data.total > 0 ? Math.round((data.present / data.total) * 100) : 0;
            });

            return Object.entries(dailySummary)
                .map(([date, data]) => ({ date, ...data }))
                .sort((a, b) => b.date.localeCompare(a.date));
        }

        return [];
    }, [reportType, filterClass, filterSection, filterStudent, startDate, endDate]);

    // Calculate overall statistics
    const overallStats = useMemo(() => {
        if (reportType === 'student-wise' && Array.isArray(reportData)) {
            const totalStudents = reportData.length;
            const avgAttendance = totalStudents > 0
                ? Math.round(reportData.reduce((sum, s) => sum + s.percentage, 0) / totalStudents)
                : 0;
            const above90 = reportData.filter(s => s.percentage >= 90).length;
            const below75 = reportData.filter(s => s.percentage < 75).length;

            return { totalStudents, avgAttendance, above90, below75 };
        }

        if (reportType === 'daily' && Array.isArray(reportData)) {
            const totalDays = reportData.length;
            const avgAttendance = totalDays > 0
                ? Math.round(reportData.reduce((sum, d) => sum + d.percentage, 0) / totalDays)
                : 0;
            const totalPresent = reportData.reduce((sum, d: any) => sum + (d.present || 0), 0);
            const totalAbsent = reportData.reduce((sum, d: any) => sum + (d.absent || 0), 0);

            return { totalDays, avgAttendance, totalPresent, totalAbsent };
        }

        return null;
    }, [reportType, reportData]);

    const handleExport = (format: 'pdf' | 'excel') => {
        // Simulate export
        setTimeout(() => {
            alert(`Exporting report as ${format.toUpperCase()}...`);
        }, 100);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Attendance Reports</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Generate and analyze attendance reports
                </p>
            </div>

            {/* Report Type Selection */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
                <button
                    onClick={() => setReportType('monthly')}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${reportType === 'monthly'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <FileText size={16} className="inline mr-2" />
                    Monthly Report
                </button>
                <button
                    onClick={() => setReportType('daily')}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${reportType === 'daily'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Calendar size={16} className="inline mr-2" />
                    Daily Summary
                </button>
                <button
                    onClick={() => setReportType('student-wise')}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${reportType === 'student-wise'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <Users size={16} className="inline mr-2" />
                    Student-wise %
                </button>
                <button
                    onClick={() => setReportType('class-trends')}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${reportType === 'class-trends'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <TrendingUp size={16} className="inline mr-2" />
                    Class Trends
                </button>
            </div>

            {/* Filters */}
            <Card className="p-6 mb-6 border-slate-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-slate-600" />
                        <h3 className="font-semibold text-slate-900">Filters</h3>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                    >
                        {showFilters ? 'Hide' : 'Show'}
                    </button>
                </div>

                {showFilters && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Class</label>
                            <select
                                value={filterClass}
                                onChange={(e) => {
                                    setFilterClass(e.target.value);
                                    setFilterSection('all');
                                }}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            >
                                <option value="all">All Classes</option>
                                {MOCK_CLASSES.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Section</label>
                            <select
                                value={filterSection}
                                onChange={(e) => setFilterSection(e.target.value)}
                                disabled={filterClass === 'all'}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-slate-50"
                            >
                                <option value="all">All Sections</option>
                                {selectedClass?.sections.map(section => (
                                    <option key={section.id} value={section.id}>{section.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                max={endDate}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                max={today}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>

                        <div className="flex items-end gap-2">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleExport('pdf')}
                                className="gap-2 flex-1"
                            >
                                <Download size={16} />
                                PDF
                            </Button>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleExport('excel')}
                                className="gap-2 flex-1"
                            >
                                <Download size={16} />
                                Excel
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Statistics Cards */}
            {overallStats && reportType === 'student-wise' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 border-slate-200">
                        <p className="text-xs text-slate-500">Total Students</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{overallStats.totalStudents}</p>
                    </Card>
                    <Card className="p-4 border-primary-200 bg-primary-50">
                        <p className="text-xs text-primary-700">Avg Attendance</p>
                        <p className="text-2xl font-bold text-primary-700 mt-1">{overallStats.avgAttendance}%</p>
                    </Card>
                    <Card className="p-4 border-emerald-200 bg-emerald-50">
                        <p className="text-xs text-emerald-700">Above 90%</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{overallStats.above90}</p>
                    </Card>
                    <Card className="p-4 border-red-200 bg-red-50">
                        <p className="text-xs text-red-700">Below 75%</p>
                        <p className="text-2xl font-bold text-red-700 mt-1">{overallStats.below75}</p>
                    </Card>
                </div>
            )}

            {overallStats && reportType === 'daily' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 border-slate-200">
                        <p className="text-xs text-slate-500">Total Days</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{overallStats.totalDays}</p>
                    </Card>
                    <Card className="p-4 border-primary-200 bg-primary-50">
                        <p className="text-xs text-primary-700">Avg Attendance</p>
                        <p className="text-2xl font-bold text-primary-700 mt-1">{overallStats.avgAttendance}%</p>
                    </Card>
                    <Card className="p-4 border-emerald-200 bg-emerald-50">
                        <p className="text-xs text-emerald-700">Total Present</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{overallStats.totalPresent}</p>
                    </Card>
                    <Card className="p-4 border-red-200 bg-red-50">
                        <p className="text-xs text-red-700">Total Absent</p>
                        <p className="text-2xl font-bold text-red-700 mt-1">{overallStats.totalAbsent}</p>
                    </Card>
                </div>
            )}

            {/* Report Content */}
            <div className="flex-1 overflow-y-auto">
                {reportType === 'student-wise' && Array.isArray(reportData) && (
                    <Card className="border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Roll No</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Student Name</th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Class</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Total Days</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Present</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Absent</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Late</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reportData.map((student: any) => (
                                        <tr key={student.id} className="hover:bg-slate-50">
                                            <td className="py-3 px-4 font-medium">{student.rollNumber}</td>
                                            <td className="py-3 px-4">{student.name}</td>
                                            <td className="py-3 px-4 text-slate-600">{student.class} - {student.section}</td>
                                            <td className="py-3 px-4 text-center">{student.totalDays}</td>
                                            <td className="py-3 px-4 text-center text-emerald-700">{student.presentDays}</td>
                                            <td className="py-3 px-4 text-center text-red-700">{student.absentDays}</td>
                                            <td className="py-3 px-4 text-center text-orange-700">{student.lateDays}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-medium ${student.percentage >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                                    student.percentage >= 75 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {student.percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {reportType === 'daily' && Array.isArray(reportData) && (
                    <Card className="border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700">Date</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Total</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Present</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Absent</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Late</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Excused</th>
                                        <th className="text-center py-3 px-4 font-semibold text-slate-700">Percentage</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reportData.map((day: any) => (
                                        <tr key={day.date} className="hover:bg-slate-50">
                                            <td className="py-3 px-4 font-medium">{new Date(day.date).toLocaleDateString('en-IN', {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            })}</td>
                                            <td className="py-3 px-4 text-center">{day.total}</td>
                                            <td className="py-3 px-4 text-center text-emerald-700">{day.present}</td>
                                            <td className="py-3 px-4 text-center text-red-700">{day.absent}</td>
                                            <td className="py-3 px-4 text-center text-orange-700">{day.late}</td>
                                            <td className="py-3 px-4 text-center text-blue-700">{day.excused}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-medium ${day.percentage >= 90 ? 'bg-emerald-100 text-emerald-700' :
                                                    day.percentage >= 75 ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {day.percentage}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                {reportType === 'monthly' && (
                    <Card className="p-12 border-slate-200 text-center">
                        <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">Monthly report view coming soon</p>
                        <p className="text-xs text-slate-400 mt-1">Use Daily Summary or Student-wise % for now</p>
                    </Card>
                )}

                {reportType === 'class-trends' && (
                    <Card className="p-12 border-slate-200 text-center">
                        <TrendingUp size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">Class trends view coming soon</p>
                        <p className="text-xs text-slate-400 mt-1">Charts and visualizations will be added here</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
