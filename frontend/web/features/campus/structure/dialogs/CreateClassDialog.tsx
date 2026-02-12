"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogFooter, Button } from '@doptor/shared';
import { campusService, Department } from '../../../../services/campus.service';
import { toast } from 'sonner';

interface CreateClassDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateClassDialog({ isOpen, onClose, onSuccess }: CreateClassDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        departmentId: ''
    });

    useEffect(() => {
        if (isOpen) {
            campusService.getDepartments().then(setDepartments).catch(console.error);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await campusService.createClass(formData);
            toast.success('Class created successfully');
            if (onSuccess) onSuccess();
            onClose();
            setFormData({ name: '', departmentId: '' });
        } catch (e) {
            toast.error('Failed to create class');
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Create New Class">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Class 10, Semester 1"
                        className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department (Optional)</label>
                    <select
                        value={formData.departmentId}
                        onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    >
                        <option value="">Select Department...</option>
                        {departments.map(dept => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                    </select>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Class'}
                    </Button>
                </DialogFooter>
            </form>
        </Dialog>
    );
}
