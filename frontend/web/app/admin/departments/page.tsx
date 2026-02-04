'use client';

import { useState, useEffect } from 'react';
import { departmentService, Department } from '../../../services/department.service';
import { Plus, Trash2, Edit2, Loader2, Users } from 'lucide-react';
import { organisationService } from '../../../services/organisation.service';

export default function DepartmentManagementPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [editingId, setEditingId] = useState<string | null>(null);

    useEffect(() => {
        loadDepartments();
    }, []);

    const loadDepartments = async () => {
        try {
            const data = await departmentService.getAll();
            setDepartments(data);
        } catch (error) {
            console.error('Failed to load departments:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        try {
            // Fetch org id if needed, for now assume there's at least one org or handle via backend context
            // Similar to roles page, grab first org ID if available as a simple fallback
            const orgs = await organisationService.getAll();
            const orgId = orgs[0]?.id; // Fallback

            if (editingId) {
                const updated = await departmentService.update(editingId, formData);
                setDepartments(departments.map(d => d.id === editingId ? updated : d));
                setEditingId(null);
            } else {
                if (!orgId) throw new Error("No Organisation found");
                const newDept = await departmentService.create({
                    ...formData,
                    organisation_id: orgId
                });
                setDepartments([...departments, newDept]);
            }
            setFormData({ name: '', description: '' });
            setIsCreating(false);
        } catch (error) {
            console.error('Failed to save department:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this department?')) return;
        try {
            await departmentService.delete(id);
            setDepartments(departments.filter(d => d.id !== id));
        } catch (error) {
            console.error('Failed to delete department:', error);
        }
    };

    const startEdit = (dept: Department) => {
        setFormData({ name: dept.name, description: dept.description || '' });
        setEditingId(dept.id);
        setIsCreating(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
                    <p className="text-gray-500 mt-1">Manage organisational departments and structure</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => {
                            setFormData({ name: '', description: '' });
                            setEditingId(null);
                            setIsCreating(true);
                        }}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Add Department
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-top-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        {editingId ? 'Edit Department' : 'Create New Department'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="e.g. Human Resources"
                                autoFocus
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-24 resize-none"
                                placeholder="Brief description of the department..."
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                            >
                                {editingId ? 'Update Department' : 'Create Department'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCreating(false);
                                    setFormData({ name: '', description: '' });
                                    setEditingId(null);
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {departments.map((dept) => (
                    <div key={dept.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:border-blue-300 transition-colors group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Users className="w-6 h-6" />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEdit(dept)}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(dept.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{dept.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-2">
                            {dept.description || 'No description provided.'}
                        </p>
                    </div>
                ))}

                {departments.length === 0 && !isLoading && !isCreating && (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-gray-50 rounded-xl border-dashed border-2 border-gray-200">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No departments found</p>
                        <p className="text-sm">Create your first department to get started</p>
                    </div>
                )}
            </div>
        </div>
    );
}
