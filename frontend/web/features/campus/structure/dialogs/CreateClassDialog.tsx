"use client";

import { useState } from 'react';
import { Dialog, DialogFooter, Button } from '@doptor/shared';
import { MOCK_DEPARTMENTS } from '../../campus-mock.db';

interface CreateClassDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateClassDialog({ isOpen, onClose }: CreateClassDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            onClose();
            // In a real app, this would refresh the list
        }, 1000);
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Create New Class">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
                    <input
                        type="text"
                        placeholder="e.g. Class 10, Semester 1"
                        className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Department (Optional)</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                        <option value="">Select Department...</option>
                        {MOCK_DEPARTMENTS.map(dept => (
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
