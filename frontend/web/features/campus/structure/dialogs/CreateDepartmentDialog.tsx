"use client";

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import { campusService, Instructor } from '../../../../services/campus.service';

interface CreateDepartmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateDepartmentDialog({ isOpen, onClose, onSuccess }: CreateDepartmentDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [faculty, setFaculty] = useState<Instructor[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        headOfDept: ''
    });

    useEffect(() => {
        if (isOpen) {
            loadFaculty();
        }
    }, [isOpen]);

    const loadFaculty = async () => {
        try {
            const data = await campusService.getFacultyList();
            setFaculty(data);
        } catch (error) {
            console.error("Failed to load faculty", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await campusService.createDepartment(formData);
            toast.success('Department created successfully');
            if (onSuccess) onSuccess();
            onClose();
            setFormData({ name: '', code: '', headOfDept: '' });
        } catch (error) {
            console.error(error);
            toast.error('Failed to create department');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-md w-full rounded-xl shadow-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900">Create Department</h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Department Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Computer Science"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Code <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            placeholder="e.g. CS"
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Head of Department
                        </label>
                        <select
                            value={formData.headOfDept}
                            onChange={e => setFormData({ ...formData, headOfDept: e.target.value })}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all bg-white"
                        >
                            <option value="">Select HOD...</option>
                            {faculty.map(f => (
                                <option key={f.id} value={`${f.first_name} ${f.last_name}`}>
                                    {f.first_name} {f.last_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
