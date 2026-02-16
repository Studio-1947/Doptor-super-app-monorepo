"use client";

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Plus, Upload, Download, Eye, Edit2, Trash2, UserPlus } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import Link from 'next/link';
import { campusService, Student, CampusClass } from '../../../services/campus.service';
import { BulkUploadDialog } from './BulkUploadDialog';
import { AddStudentDialog } from './AddStudentDialog';
import { toast } from 'sonner';

import { useRole } from '@/features/auth/RoleContext';

export function StudentList() {
    const { role } = useRole();
    const canEdit = role === 'super_admin' || role === 'org_admin';

    const [students, setStudents] = useState<Student[]>([]);
    const [classes, setClasses] = useState<CampusClass[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterClass, setFilterClass] = useState<string>('all');
    const [filterSection, setFilterSection] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showAddStudent, setShowAddStudent] = useState(false);
    const itemsPerPage = 20;

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [studentsData, classesData] = await Promise.all([
                campusService.getStudentList(),
                campusService.getClasses() // We might need classes for filter or displaying class names
            ]);
            setStudents(studentsData);
            setClasses(classesData);
        } catch (error) {
            console.error("Failed to load data", error);
            toast.error("Failed to load student data");
        } finally {
            setLoading(false);
        }
    };

    // Derived state for filtering
    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            // Search
            const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch =
                fullName.includes(searchLower) ||
                student.email.toLowerCase().includes(searchLower) ||
                (student.enrollmentNo && student.enrollmentNo.toLowerCase().includes(searchLower));

            // Status
            const matchesStatus = filterStatus === 'all' || student.status === filterStatus;

            // Department (using filterClass as department filter for now as Students have department)
            // Or if we want to filter by Class/Section, we need that info in Student object.
            // The mock student had classId, but backend Student interface currently doesn't have classId explicitly?
            // It has 'department'.
            // Let's assume filterClass maps to department for now if checking student.department
            const matchesDepartment = filterClass === 'all' || student.department === filterClass;

            return matchesSearch && matchesStatus && matchesDepartment;
        });
    }, [students, searchQuery, filterStatus, filterClass]);

    // Pagination
    const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
    const paginatedStudents = filteredStudents.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this student?")) return;
        try {
            await campusService.deleteStudent(id);
            toast.success("Student deleted");
            loadData(); // Reload
        } catch (e) {
            console.error(e);
            toast.error("Failed to delete student");
        }
    }

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }

    return (
        <div className="flex flex-col h-full">

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
                            className="w-full bg-white border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors ${showFilters ? 'bg-slate-50' : 'bg-white'
                            } rounded-lg`}
                    >
                        <Filter size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {canEdit && (
                        <>
                            <Button
                                variant="secondary"
                                size="sm"
                                className="gap-2 flex-1 sm:flex-none"
                                onClick={() => setShowBulkUpload(true)}
                            >
                                <Upload size={16} />
                                <span>Bulk Upload</span>
                            </Button>
                            <Button variant="secondary" size="sm" className="gap-2 flex-1 sm:flex-none">
                                <Download size={16} />
                                <span>Export</span>
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="gap-2 flex-1 sm:flex-none"
                                onClick={() => setShowAddStudent(true)}
                            >
                                <UserPlus size={16} />
                                <span>Add Student</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Filters UI */}
            {showFilters && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-lg"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="graduated">Graduated</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-700 mb-1">Department</label>
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="w-full text-sm border-slate-200 rounded-lg"
                        >
                            <option value="all">All Departments</option>
                            <option value="Science">Science</option>
                            <option value="Commerce">Commerce</option>
                            <option value="Arts">Arts</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Student Table */}
            <Card className="flex-1 overflow-hidden border-slate-200">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Student</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Enrollment / Roll</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Department / Batch</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Contact</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Guardian</th>
                                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-700">Status</th>
                                <th className="text-right py-3 px-4 text-xs font-semibold text-slate-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500">Loading students...</td>
                                </tr>
                            ) : paginatedStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-8 text-center text-slate-500">No students found.</td>
                                </tr>
                            ) : paginatedStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                                                {getInitials(student.first_name, student.last_name)}
                                            </div>
                                            <div className="min-w-0">
                                                <Link
                                                    href={`/campus/students/${student.id}`}
                                                    className="font-medium text-slate-900 hover:text-primary-600 transition-colors"
                                                >
                                                    {student.first_name} {student.last_name}
                                                </Link>
                                                <p className="text-xs text-slate-500 truncate">{student.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm font-medium text-slate-700">{student.enrollmentNo}</div>
                                        <div className="text-xs text-slate-500">{student.rollNo}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm text-slate-900">
                                            {typeof student.department === 'object' && student.department !== null
                                                ? student.department.name
                                                : student.department || 'N/A'}
                                        </div>
                                        <div className="text-xs text-slate-500">{student.batch}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm text-slate-700">{student.phone || 'N/A'}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm text-slate-900">{student.guardianName || '-'}</div>
                                        <div className="text-xs text-slate-500">{student.guardianPhone}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span
                                            className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${student.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : student.status === 'inactive'
                                                    ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                                    : 'bg-slate-50 text-slate-700 border border-slate-100'
                                                }`}
                                        >
                                            {student.status ? (student.status.charAt(0).toUpperCase() + student.status.slice(1)) : 'Unknown'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center justify-end gap-1">
                                            <Link
                                                href={`/campus/students/${student.id}`}
                                                className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-primary-600 transition-colors rounded"
                                                title="View Profile"
                                            >
                                                <Eye size={16} />
                                            </Link>
                                            {canEdit && (
                                                <>
                                                    <button
                                                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors rounded"
                                                        title="Edit"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(student.id)}
                                                        className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-red-600 transition-colors rounded"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="border-t border-slate-200 px-4 py-3 flex items-center justify-between">
                            <div className="text-sm text-slate-500">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1.5 border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-slate-700">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1.5 border border-slate-200 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Bulk Upload Dialog */}
            <BulkUploadDialog
                isOpen={showBulkUpload}
                onClose={() => setShowBulkUpload(false)}
                onSuccess={() => {
                    toast.success("Bulk upload complete (mock)");
                    loadData();
                }}
            />

            <AddStudentDialog
                isOpen={showAddStudent}
                onClose={() => setShowAddStudent(false)}
                onSuccess={loadData}
            />
        </div>
    );
}
