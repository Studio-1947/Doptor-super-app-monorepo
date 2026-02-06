"use client";

import { useState } from 'react';
import { Dialog, DialogFooter, Button } from '@doptor/shared';

interface MapTeacherDialogProps {
    isOpen: boolean;
    onClose: () => void;
    sectionName?: string;
}

export function MapTeacherDialog({ isOpen, onClose, sectionName }: MapTeacherDialogProps) {
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
        <Dialog isOpen={isOpen} onClose={onClose} title={`Map Teacher to ${sectionName || 'Section'}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Teacher</label>
                    <select className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50" required>
                        <option value="">Select a teacher...</option>
                        <option value="1">Dr. Sarah Smith</option>
                        <option value="2">Mr. Anderson</option>
                        <option value="3">Prof. Johnson</option>
                    </select>
                    <p className="text-xs text-slate-500 mt-1">
                        Only staff members with 'Teacher' role are listed.
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Role Type</label>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" name="role" value="class_teacher" defaultChecked />
                            <span className="text-sm">Class Teacher</span>
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="role" value="assistant" />
                            <span className="text-sm">Assistant</span>
                        </label>
                    </div>
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Mapping...' : 'Map Teacher'}
                    </Button>
                </DialogFooter>
            </form>
        </Dialog>
    );
}
