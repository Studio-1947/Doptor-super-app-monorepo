"use client";

import { useState } from 'react';
import { Dialog, DialogFooter, Button } from '@doptor/shared';

interface CreateDepartmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateDepartmentDialog({ isOpen, onClose }: CreateDepartmentDialogProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            onClose();
        }, 1000);
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Create Department">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Department Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Computer Science"
                            className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Code</label>
                        <input
                            type="text"
                            placeholder="e.g. CS"
                            className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            required
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Head of Department</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                        <option value="">Select HOD...</option>
                        <option value="1">Dr. Sarah Smith</option>
                        <option value="2">Mr. John Doe</option>
                    </select>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Department'}
                    </Button>
                </DialogFooter>
            </form>
        </Dialog>
    );
}
