"use client";

import { useState, useMemo } from 'react';
import { Search, Filter, Plus, Upload, Download, Eye, Edit2, Trash2, UserPlus } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import Link from 'next/link';
import {
    MOCK_STUDENTS,
    Student,
    searchStudents,
    getStudentFullName,
    getStudentInitials,
    calculateAge
} from './student-mock.db';
import { MOCK_CLASSES } from '../campus-mock.db';
import { BulkUploadDialog } from './BulkUploadDialog';

export function StudentList() {
    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterSection, setFilterSection] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<Student['status'] | 'all'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const itemsPerPage = 20;

    // Filter and search students
    const filteredStudents = useMemo(() => {
        let results = MOCK_STUDENTS;

        // Apply search
        if (searchQuery) {
            results = searchStudents(searchQuery);
        }

        // Apply class filter
        if (filterClass !== 'all') {
            results = results.filter(s => s.classId === filterClass);
        }

        // Apply section filter
        if (filterSection !== 'all') {
            results = results.filter(s => s.sectionId === filterSection);
        }

        // Apply status filter
        if (filterStatus !== 'all') {
            results = results.filter(s => s.status === filterStatus);
        }

        return results;
    }, [searchQuery, filterClass, filterSection, filterStatus]);

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Get class name by ID
    const getClassName = (classId: string) => {
        const classData = MOCK_CLASSES.find(c => c.id === classId);
        return classData?.name || 'Unknown';
    };

    // Get section name by ID
    const getSectionName = (classId: string, sectionId: string) => {
        const classData = MOCK_CLASSES.find(c => c.id === classId);
        const section = classData?.sections.find(s => s.id === sectionId);
        return section?.name || 'Unknown';
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Students</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage student enrollments and profiles
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, roll number, email..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full bg-white border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors ${showFilters ? 'bg-slate-50' : 'bg-white'
                            }`}
                    >
                        <Filter size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 flex-1 sm:flex-none"
                        onClick={() => setShowBulkUpload(true)}
                    >
                        <Upload size={16} />
                        <span>Bulk Upload</span>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 flex-1 sm:flex-none">
                        <Download size={16} />
                        <span>Export</span>
                    </Button>
                    <Button variant="primary" size="sm" className="gap-2 flex-1 sm:flex-none">
                        <UserPlus size={16} />
                        <span>Add Student</span>
                    </Button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <Card className="p-4 mb-6 border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Class</label>
                            <select
                                value={filterClass}
                                onChange={(e) => {
                                    setFilterClass(e.target.value);
                                    setCurrentPage(1);
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
                                onChange={(e) => {
                                    setFilterSection(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                                disabled={filterClass === 'all'}
                            >
                                <option value="all">All Sections</option>
                                {filterClass !== 'all' && MOCK_CLASSES.find(c => c.id === filterClass)?.sections.map(section => (
                                    <option key={section.id} value={section.id}>{section.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => {
                                    setFilterStatus(e.target.value as Student['status'] | 'all');
                                    setCurrentPage(1);
                                }}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="graduated">Graduated</option>
                            </select>
                        </div>
                    </div>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">Total Students</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{MOCK_STUDENTS.length}</p>
                </Card>
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">Active</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {MOCK_STUDENTS.filter(s => s.status === 'active').length}
                    </p>
                </Card>
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">Inactive</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                        {MOCK_STUDENTS.filter(s => s.status === 'inactive').length}
                    </p>
                </Card>
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">Filtered Results</p>
                    <p className="text-2xl font-bold text-primary-600 mt-1">{filteredStudents.length}</p>
                </Card>
            </div>

            {/* Student Table */}
            <Card className="flex-1 overflow-hidden border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Student</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Roll Number</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Class</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Contact</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Parent</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Status</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                {getStudentInitials(student)}
                                            </div>
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/campus/students/${student.id}`}
                                                    className="font-medium text-slate-900 hover:text-primary-600 transition-colors"
                                                >
                                                    {getStudentFullName(student)}
                                                </Link>
                                                <p className="text-xs text-slate-500 truncate">{student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm font-medium text-slate-700">{student.rollNumber}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm text-slate-900">
                                            {getClassName(student.classId)}
                                        </div>
                                        <div className="text-xs text-slate-500">
                                            {getSectionName(student.classId, student.sectionId)}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm text-slate-700">{student.phone || 'N/A'}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm text-slate-900">{student.parentName}</div>
                                        <div className="text-xs text-slate-500">{student.parentPhone}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 text-xs font-medium ${student.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : student.status === 'inactive'
                                                    ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                                    : 'bg-slate-50 text-slate-700 border border-slate-100'
                                                }`}
                                        >
                                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={`/campus/students/${student.id}`}
                                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition-colors"
                                                title="View Profile"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                            <button
                                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredStudents.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            <p className="text-sm">No students found matching your criteria.</p>
                            <p className="text-xs mt-1">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-slate-700">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1.5 border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Bulk Upload Dialog */}
            <BulkUploadDialog
                isOpen={showBulkUpload}
                onClose={() => setShowBulkUpload(false)}
                onSuccess={() => {
                    // Refresh student list (in real app, would refetch from API)
                    console.log('Students uploaded successfully');
                }}
            />
        </div>
    );
}
