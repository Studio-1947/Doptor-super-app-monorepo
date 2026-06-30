"use client";

import { useState } from 'react';
import { Dialog, DialogFooter, Button } from '@doptor/shared';
import { toast } from 'sonner';
import { academicYearService } from '../../../../services/academic-year.service';
import { useAuth } from '../../../../contexts/AuthContext';

interface CreateAcademicYearDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export function CreateAcademicYearDialog({ isOpen, onClose, onSuccess }: CreateAcademicYearDialogProps) {
    const { user } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isCurrent, setIsCurrent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.organisation_id) {
            toast.error('Missing organisation context');
            return;
        }

        setIsLoading(true);
        try {
            await academicYearService.create({
                name,
                startDate,
                endDate,
                isCurrent,
                organisation_id: user.organisation_id,
            });
            toast.success('Academic year created');
            setName('');
            setStartDate('');
            setEndDate('');
            setIsCurrent(false);
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create academic year');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="New Academic Year">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Session Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
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
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                            required
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="current"
                        checked={isCurrent}
                        onChange={e => setIsCurrent(e.target.checked)}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    />
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
