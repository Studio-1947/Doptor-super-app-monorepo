"use client";

import { useState, useMemo, useEffect } from 'react';
import { Search, Filter, UserPlus, Upload, BookOpen, Trash2, MoreVertical } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { campusService, Instructor } from '../../../services/campus.service';
import { AddFacultyDialog } from '../faculty/AddFacultyDialog';
import { BulkUploadDialog } from '../faculty/BulkUploadDialog';
import { AssignClassDialog } from '../faculty/AssignClassDialog';

import { useRole } from '@/features/auth/RoleContext';

export function FacultyList() {
    const { role } = useRole();
    const canEdit = role === 'super_admin' || role === 'org_admin';

    const router = useRouter();

    const [facultyList, setFacultyList] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterDepartment, setFilterDepartment] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [showAssignClass, setShowAssignClass] = useState(false);

    useEffect(() => {
        loadFaculty();
    }, []);

    const loadFaculty = async () => {
        setLoading(true);
        try {
            const data = await campusService.getFacultyList();
            setFacultyList(data);
        } catch (error) {
            console.error("Failed to load faculty", error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this faculty member?')) {
            try {
                await campusService.deleteFaculty(id);
                loadFaculty(); // Reload list
            } catch (error) {
                console.error("Failed to delete faculty", error);
            }
        }
    };

    const filteredFaculty = useMemo(() => {
        let results = facultyList;

        // Apply search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            results = results.filter(f =>
                f.first_name.toLowerCase().includes(query) ||
                f.last_name.toLowerCase().includes(query) ||
                f.email.toLowerCase().includes(query) ||
                f.department?.toLowerCase().includes(query)
            );
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
    }, [facultyList, searchQuery, filterDepartment, filterStatus]);

    const departments = Array.from(new Set(facultyList.map(f => f.department).filter(Boolean))) as string[];

    const getInitials = (f: Instructor) => `${f.first_name[0]}${f.last_name[0]}`;
    const getFullName = (f: Instructor) => `${f.first_name} ${f.last_name}`;

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
                            className="w-full bg-white border border-slate-200 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors rounded-lg ${showFilters ? 'bg-slate-50' : 'bg-white'
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
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg bg-white"
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
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-full border border-slate-200 py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 rounded-lg bg-white"
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
                    <p className="text-2xl font-bold text-slate-900 mt-1">{loading ? '-' : facultyList.length}</p>
                </Card>
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">Active</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">
                        {loading ? '-' : facultyList.filter(f => f.status === 'active').length}
                    </p>
                </Card>
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">On Leave</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">
                        {loading ? '-' : facultyList.filter(f => f.status === 'on-leave').length}
                    </p>
                </Card>
                <Card className="p-4 border-slate-200">
                    <p className="text-xs text-slate-500">Filtered Results</p>
                    <p className="text-2xl font-bold text-primary-600 mt-1">{loading ? '-' : filteredFaculty.length}</p>
                </Card>
            </div>

            {/* Faculty Grid */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading faculty...</div>
                ) : filteredFaculty.length === 0 ? (
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
                                    className="p-5 border-slate-200 hover:border-primary-300 hover:shadow-md transition-all cursor-pointer relative group"
                                >
                                    {canEdit && (
                                        <div onClick={(e) => e.stopPropagation()} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                            <button
                                                onClick={(e) => handleDelete(faculty.id, e)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                                            {getInitials(faculty)}
                                        </div>
                                        <div className="flex-1 min-w-0 pr-6">
                                            <h3 className="font-bold text-slate-900 mb-0.5 truncate">
                                                {getFullName(faculty)}
                                            </h3>
                                            <p className="text-xs text-slate-500 truncate">{faculty.designation || faculty.role}</p>
                                        </div>
                                        <span
                                            className={`px-2 py-1 text-xs font-medium rounded ${faculty.status === 'active'
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                : faculty.status === 'on-leave'
                                                    ? 'bg-orange-50 text-orange-700 border border-orange-100'
                                                    : 'bg-slate-50 text-slate-700 border border-slate-100'
                                                }`}
                                        >
                                            {faculty.status === 'on-leave' ? 'Leave' : (faculty.status ? faculty.status.charAt(0).toUpperCase() + faculty.status.slice(1) : 'Active')}
                                        </span>
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <BookOpen size={14} className="text-slate-400" />
                                            <span className="truncate">{faculty.department || 'No Dept'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-600">
                                            <span className="text-slate-400">📧</span>
                                            <span className="truncate">{faculty.email}</span>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-slate-200">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-slate-500">Joined</span>
                                            <span className="font-medium text-slate-900">{faculty.joinDate || '-'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 mt-4 pt-3 border-t border-slate-200">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/campus/faculty/${faculty.id}`);
                                            }}
                                            className="flex-1 py-1.5 text-xs border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors font-medium rounded"
                                        >
                                            View Profile
                                        </button>
                                        {canEdit && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowAssignClass(true);
                                                }}
                                                className="flex-1 py-1.5 text-xs bg-primary-600 text-white hover:bg-primary-700 transition-colors font-medium rounded"
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
                    loadFaculty(); // Reload data
                    setShowAddDialog(false);
                }}
            />

            <BulkUploadDialog
                isOpen={showBulkUpload}
                onClose={() => setShowBulkUpload(false)}
                onSuccess={() => {
                    console.log('Faculty uploaded successfully');
                    loadFaculty(); // Reload data
                    setShowBulkUpload(false);
                }}
            />

            <AssignClassDialog
                isOpen={showAssignClass}
                onClose={() => setShowAssignClass(false)}
                onSuccess={() => {
                    console.log('Class assigned successfully');
                    setShowAssignClass(false);
                }}
            />
        </div>
    );
}
