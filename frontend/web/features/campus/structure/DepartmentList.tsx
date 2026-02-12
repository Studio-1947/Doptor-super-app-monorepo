"use client";

import { useState, useEffect } from 'react';
import { Card, Button } from '@doptor/shared';
import { Plus, BookOpen, MoreVertical, Users, Trash2 } from 'lucide-react';
import { campusService, Department } from '../../../services/campus.service';
import { CreateDepartmentDialog } from './dialogs/CreateDepartmentDialog';
import { toast } from 'sonner';

export function DepartmentList() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        setLoading(true);
        try {
            const data = await campusService.getDepartments();
            setDepartments(data);
        } catch (error) {
            console.error("Failed to load departments", error);
            toast.error("Failed to load departments");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this department?')) return;

        try {
            await campusService.deleteDepartment(id);
            toast.success('Department deleted');
            loadDepartments();
        } catch (error) {
            console.error("Failed to delete department", error);
            toast.error("Failed to delete department");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Departments</h2>
                    <p className="text-slate-500">Manage faculties and subject departments.</p>
                </div>
                <Button
                    className="bg-primary-600 hover:bg-primary-700 text-white gap-2"
                    onClick={() => setIsCreateOpen(true)}
                >
                    <Plus size={18} /> New Department
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500">Loading departments...</div>
            ) : departments.length === 0 ? (
                <div className="text-center py-12 text-slate-500">No departments found. Create one to get started.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {departments.map((dept) => (
                        <Card key={dept.id} className="p-6 hover:shadow-md transition-all group relative">
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleDelete(dept.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                                    title="Delete Department"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <BookOpen size={24} />
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 mb-1">{dept.name}</h3>
                            <p className="text-sm font-medium text-slate-500 mb-4">Code: {dept.code}</p>

                            <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {dept.headOfDept ? dept.headOfDept.charAt(0) : '?'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-slate-500">Head of Dept.</p>
                                    <p className="text-sm font-medium text-slate-900 truncate">{dept.headOfDept || 'Not Assigned'}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <CreateDepartmentDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={loadDepartments}
            />
        </div >
    );
}
