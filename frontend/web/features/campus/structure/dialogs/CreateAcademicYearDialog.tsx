"use client";

import { useState } from 'react';
import { Dialog, DialogFooter, Button } from '@doptor/shared';

interface CreateAcademicYearDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateAcademicYearDialog({ isOpen, onClose }: CreateAcademicYearDialogProps) {
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
        <Dialog isOpen={isOpen} onClose={onClose} title="New Academic Year">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Session Name</label>
                    <input
                        type="text"
                        placeholder="e.g. 2025-2026"
                        className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                        <input
                            type="date"
                            className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input type="checkbox" id="current" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                    <label htmlFor="current" className="text-sm font-medium text-slate-700">Set as Current Session</label>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create Session'}
                    </Button>
                </DialogFooter>
            </form>
        </Dialog>
    );
}
