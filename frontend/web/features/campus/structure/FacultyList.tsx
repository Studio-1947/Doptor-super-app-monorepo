"use client";

import { useState, useMemo } from 'react';
import { Search, Filter, UserPlus, Upload, Download, Eye, Edit2, BookOpen } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    MOCK_FACULTY,
    Faculty,
    searchFaculty,
    getFacultyFullName,
    getFacultyInitials,
    getUniqueDepartments,
    filterFacultyByDepartment,
    filterFacultyByStatus
} from '../faculty/faculty-mock.db';
import { AddFacultyDialog } from '../faculty/AddFacultyDialog';
import { BulkUploadDialog } from '../faculty/BulkUploadDialog';
import { AssignClassDialog } from '../faculty/AssignClassDialog';

import { useRole } from '@/features/auth/RoleContext';

export function FacultyList() {
    const { role } = useRole();
    const canEdit = role === 'super_admin' || role === 'org_admin';

    const router = useRouter();

    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<Faculty['status'] | 'all'>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showAssignClass, setShowAssignClass] = useState(false);

    // ... useMemo filteredFaculty ...
    const filteredFaculty = useMemo(() => {
        let results = MOCK_FACULTY;

        // Apply search
        if (searchQuery) {
            results = searchFaculty(searchQuery);
        }

        // Apply department filter
        if (filterDepartment !== 'all') {
            results = results.filter(f => f.department === filterDepartment);
        }

        // Apply status filter
        if (filterStatus !== 'all') {
            results = results.filter(f => f.status === filterStatus);
        }

        return results;
    }, [searchQuery, filterDepartment, filterStatus]);

    const departments = getUniqueDepartments();

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Faculty Members</h1>
                <p className="text-sm text-slate-500 mt-1">
                    Manage faculty profiles and class assignments
                </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* ... Search & Filter ... */}
                    <div className="relative flex-1 sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, department, email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
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
                            <Button
                                variant="secondary"
                                size="sm"
                                className="gap-2 flex-1 sm:flex-none"
                                onClick={() => setShowAssignClass(true)}
                            >
                                <BookOpen size={16} />
                                <span>Assign Classes</span>
                            </Button>
                            <Button
                                variant="primary"
                                size="sm"
                                className="gap-2 flex-1 sm:flex-none"
                                onClick={() => setShowAddDialog(true)}
                            >
                                <UserPlus size={16} />
                                <span>Add Faculty</span>
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Filters Panel & Stats ... */}
            {showFilters && (
                <Card className="p-4 mb-6 border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Department</label>
                            <select
                                value={filterDepartment}
                                onChange={(e) => setFilterDepartment(e.target.value)}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            >
                                <option value="all">All Departments</option>
                                {departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">Status</label>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value as Faculty['status'] | 'all')}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="on-leave">On Leave</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">Total Faculty</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{MOCK_FACULTY.length}</p>
                </Card>
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">Active</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {MOCK_FACULTY.filter(f => f.status === 'active').length}
                    </p>
                </Card>
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">On Leave</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                        {MOCK_FACULTY.filter(f => f.status === 'on-leave').length}
                    </p>
                </Card>
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">Filtered Results</p>
                    <p className="text-2xl font-bold text-primary-600 mt-1">{filteredFaculty.length}</p>
                </Card>
            </div>

            {/* Faculty Grid */}
            <div className="flex-1 overflow-y-auto">
                {filteredFaculty.length === 0 ? (
                    <Card className="p-12 border-slate-200 text-center">
                        <p className="text-sm text-slate-500">No faculty members found matching your criteria.</p>
                        <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredFaculty.map((faculty) => (
                            <div
                                key={faculty.id}
                                onClick={() => router.push(`/campus/faculty/${faculty.id}`)}
                                className="contents"
                            >
                                <Card
                                    className="p-5 border-slate-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                                            {getFacultyInitials(faculty)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 mb-0.5 truncate">
                                                {getFacultyFullName(faculty)}
                                            </h3>
                                            <p className="text-xs text-slate-500 truncate">{faculty.designation}</p>
                                            <p className="text-xs text-slate-400 truncate">{faculty.employeeId}</p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 text-xs font-medium ${faculty.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : faculty.status === 'on-leave'
                                                    ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                                    : 'bg-slate-50 text-slate-700 border border-slate-100'
                                                }`}
                                        >
                                            {faculty.status === 'on-leave' ? 'Leave' : faculty.status.charAt(0).toUpperCase() + faculty.status.slice(1)}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <BookOpen size={14} className="text-slate-400" />
                                            <span className="truncate">{faculty.department}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <span className="text-slate-400">📧</span>
                                            <span className="truncate">{faculty.email}</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-200">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">Experience</span>
                                            <span className="font-medium text-slate-900">{faculty.experience} years</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs mt-1">
                                            <span className="text-slate-500">Classes</span>
                                            <span className="font-medium text-slate-900">{faculty.assignedClasses.length}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/campus/faculty/${faculty.id}`);
                                            }}
                                            className="flex-1 py-1.5 text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium"
                                        >
                                            View Profile
                                        </button>
                                        {canEdit && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowAssignClass(true);
                                                }}
                                                className="flex-1 py-1.5 text-xs bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium"
                                            >
                                                Assign Class
                                            </button>
                                        )}
                                    </div>
                                </Card>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <AddFacultyDialog
                isOpen={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                onSuccess={() => {
                    console.log('Faculty added successfully');
                }}
            />

            <BulkUploadDialog
                isOpen={showBulkUpload}
                onClose={() => setShowBulkUpload(false)}
                onSuccess={() => {
                    console.log('Faculty uploaded successfully');
                }}
            />

            <AssignClassDialog
                isOpen={showAssignClass}
                onClose={() => setShowAssignClass(false)}
                onSuccess={() => {
                    console.log('Class assigned successfully');
                }}
            />
        </div>
    );
}
