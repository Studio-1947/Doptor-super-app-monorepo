"use client";

import { useState, useMemo, useEffect } from 'react';
import { Filter, Download, FileText, TrendingUp, Users, Calendar } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { toast } from 'sonner';
import { campusService, CampusClass, Student } from '../../../services/campus.service';
// Remove mock imports

type ReportType = 'daily' | 'monthly' | 'student-wise' | 'class-trends';

export function AttendanceReports() {
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [reportType, setReportType] = useState<ReportType>('monthly');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterSection, setFilterSection] = useState<string>('all');
    const [startDate, setStartDate] = useState<string>(thirtyDaysAgo);
    const [endDate, setEndDate] = useState<string>(today);
    const [showFilters, setShowFilters] = useState(true);

    const [classes, setClasses] = useState<CampusClass[]>([]);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState<any[]>([]);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        loadClasses();
    }, []);

    useEffect(() => {
        loadReportData();
    }, [reportType, filterClass, startDate, endDate]);

    const loadClasses = async () => {
        try {
            const data = await campusService.getClasses(); // or getMyClasses
            setClasses(data);
        } catch (error) {
            console.error("Failed to load classes", error);
        }
    };

    const loadReportData = async () => {
        setLoading(true);
        try {
            // Fetch raw records from new endpoint
            const records = await campusService.getAttendanceReport(startDate, endDate, filterClass);

            // Process data based on report type
            processReportData(records);

        } catch (error) {
            console.error("Failed to load report data", error);
            // toast.error("Failed to load report data"); // Optional
            setReportData([]);
            setStats(null);
        } finally {
            setLoading(false);
        }
    };

    const processReportData = (records: any[]) => {
        if (reportType === 'student-wise') {
            // Group by student
            const studentMap: Record<string, any> = {};

            records.forEach(r => {
                if (!studentMap[r.student_id]) {
                    studentMap[r.student_id] = {
                        id: r.student_id,
                        name: `${r.student.first_name} ${r.student.last_name}`,
                        rollNumber: r.student.rollNo || "N/A",
                        class: r.class?.course?.name || "Unknown",
                        totalDays: 0,
                        presentDays: 0,
                        absentDays: 0,
                        lateDays: 0,
                        excusedDays: 0
                    };
                }
                const s = studentMap[r.student_id];
                s.totalDays++;
                if (r.status === 'present') s.presentDays++;
                if (r.status === 'absent') s.absentDays++;
                if (r.status === 'late') s.lateDays++;
                if (r.status === 'excused') s.excusedDays++;
            });

            const processed = Object.values(studentMap).map((s: any) => ({
                ...s,
                percentage: s.totalDays > 0 ? Math.round((s.presentDays / s.totalDays) * 100) : 0
            })).sort((a: any, b: any) => b.percentage - a.percentage);

            setReportData(processed);

            // Stats
            const totalStudents = processed.length;
            const avgAttendance = totalStudents > 0
                ? Math.round(processed.reduce((sum, s) => sum + s.percentage, 0) / totalStudents)
                : 0;

            setStats({
                totalStudents,
                avgAttendance,
                above90: processed.filter((s: any) => s.percentage >= 90).length,
                below75: processed.filter((s: any) => s.percentage < 75).length
            });

        } else if (reportType === 'daily') {
            // Group by date
            const dateMap: Record<string, any> = {};

            records.forEach(r => {
                const date = r.date;
                if (!dateMap[date]) {
                    dateMap[date] = {
                        date,
                        total: 0, present: 0, absent: 0, late: 0, excused: 0
                    };
                }
                const d = dateMap[date];
                d.total++;
                if (r.status === 'present') d.present++;
                if (r.status === 'absent') d.absent++;
                if (r.status === 'late') d.late++;
                if (r.status === 'excused') d.excused++;
            });

            const processed = Object.values(dateMap).map((d: any) => ({
                ...d,
                percentage: d.total > 0 ? Math.round((d.present / d.total) * 100) : 0
            })).sort((a: any, b: any) => b.date.localeCompare(a.date));

            setReportData(processed);

            // Stats
            const totalDays = processed.length;
            const avgAttendance = totalDays > 0
                ? Math.round(processed.reduce((sum: number, d: any) => sum + d.percentage, 0) / totalDays)
                : 0;

            setStats({
                totalDays,
                avgAttendance,
                totalPresent: processed.reduce((sum: number, d: any) => sum + d.present, 0),
                totalAbsent: processed.reduce((sum: number, d: any) => sum + d.absent, 0)
            });
        }
        else {
            setReportData([]);
            setStats(null);
        }
    };

    const handleExport = (format: 'pdf' | 'excel') => {
        alert(`Exporting report as ${format.toUpperCase()}...`);
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
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                            >
                                <option value="all">All Classes</option>
                                {classes.map(cls => (
                                    <option key={cls.id} value={cls.id}>{cls.course?.name} - {cls.course?.code}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sections not yet supported by endpoint filtering, keeping UI but disabled or generic */}
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Section</label>
                            <select
                                value={filterSection}
                                onChange={(e) => setFilterSection(e.target.value)}
                                disabled={filterClass === 'all'} // or true if not supported
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 disabled:bg-slate-50 rounded-lg"
                            >
                                <option value="all">All Sections</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                max={endDate}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
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
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
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

            {/* Loading */}
            {loading && (
                <div className="p-12 text-center text-slate-500">Loading Report Data...</div>
            )}

            {/* Statistics Cards */}
            {!loading && stats && reportType === 'student-wise' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 border-slate-200">
                        <p className="text-xs text-slate-500">Total Students</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalStudents}</p>
                    </Card>
                    <Card className="p-4 border-primary-200 bg-primary-50">
                        <p className="text-xs text-primary-700">Avg Attendance</p>
                        <p className="text-2xl font-bold text-primary-700 mt-1">{stats.avgAttendance}%</p>
                    </Card>
                    <Card className="p-4 border-emerald-200 bg-emerald-50">
                        <p className="text-xs text-emerald-700">Above 90%</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.above90}</p>
                    </Card>
                    <Card className="p-4 border-red-200 bg-red-50">
                        <p className="text-xs text-red-700">Below 75%</p>
                        <p className="text-2xl font-bold text-red-700 mt-1">{stats.below75}</p>
                    </Card>
                </div>
            )}

            {!loading && stats && reportType === 'daily' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 border-slate-200">
                        <p className="text-xs text-slate-500">Total Days</p>
                        <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalDays}</p>
                    </Card>
                    <Card className="p-4 border-primary-200 bg-primary-50">
                        <p className="text-xs text-primary-700">Avg Attendance</p>
                        <p className="text-2xl font-bold text-primary-700 mt-1">{stats.avgAttendance}%</p>
                    </Card>
                    <Card className="p-4 border-emerald-200 bg-emerald-50">
                        <p className="text-xs text-emerald-700">Total Present</p>
                        <p className="text-2xl font-bold text-emerald-700 mt-1">{stats.totalPresent}</p>
                    </Card>
                    <Card className="p-4 border-red-200 bg-red-50">
                        <p className="text-xs text-red-700">Total Absent</p>
                        <p className="text-2xl font-bold text-red-700 mt-1">{stats.totalAbsent}</p>
                    </Card>
                </div>
            )}

            {/* Report Content */}
            <div className="flex-1 overflow-y-auto">
                {!loading && reportType === 'student-wise' && reportData.length > 0 && (
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
                                            <td className="py-3 px-4 text-slate-600">{student.class}</td>
                                            <td className="py-3 px-4 text-center">{student.totalDays}</td>
                                            <td className="py-3 px-4 text-center text-emerald-700">{student.presentDays}</td>
                                            <td className="py-3 px-4 text-center text-red-700">{student.absentDays}</td>
                                            <td className="py-3 px-4 text-center text-orange-700">{student.lateDays}</td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${student.percentage >= 90 ? 'bg-emerald-100 text-emerald-700' :
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

                {!loading && reportType === 'daily' && reportData.length > 0 && (
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
                                                <span className={`px-2 py-1 text-xs font-medium rounded ${day.percentage >= 90 ? 'bg-emerald-100 text-emerald-700' :
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

                {!loading && reportType === 'monthly' && (
                    <Card className="p-12 border-slate-200 text-center">
                        <FileText size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">Monthly report not yet available.</p>
                        <p className="text-xs text-slate-400 mt-1">Please use 'Student-wise %' or 'Daily Summary'</p>
                    </Card>
                )}

                {!loading && reportType === 'class-trends' && (
                    <Card className="p-12 border-slate-200 text-center">
                        <TrendingUp size={48} className="mx-auto text-slate-300 mb-3" />
                        <p className="text-sm text-slate-500">Class trends view coming soon</p>
                        <p className="text-xs text-slate-400 mt-1">Charts and visualizations will be added here</p>
                    </Card>
                )}

                {!loading && !stats && (reportType === 'daily' || reportType === 'student-wise') && (
                    <Card className="p-12 border-slate-200 text-center">
                        <p className="text-sm text-slate-500">No data found for the selected range/filters.</p>
                    </Card>
                )}
            </div>
        </div>
    );
}
