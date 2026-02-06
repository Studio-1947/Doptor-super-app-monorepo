"use client";

import { useState } from 'react';
import { Dialog, Button } from '@doptor/shared';
import { RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_OFFICE_USERS } from './office-mock.db';

interface ReturnFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string;
    onSuccess: () => void;
}

export function ReturnFileModal({ isOpen, onClose, fileId, onSuccess }: ReturnFileModalProps) {
    const [returnTo, setReturnTo] = useState<string>('');
    const [reason, setReason] = useState<string>('needs_improvement');
    const [remarks, setRemarks] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Mock previous senders (in real app, fetch from history)
    const previousSenders = MOCK_OFFICE_USERS.slice(0, 2);

    const handleSubmit = async () => {
        if (!returnTo) {
            toast.error('Please select whom to return the file to');
            return;
        }
        if (!remarks.trim()) {
            toast.error('Remarks are required for returning a file');
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        toast.success('File returned successfully');
        setIsSubmitting(false);
        onSuccess();
        onClose();
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Return File" maxWidth="max-w-md">
            <div className="space-y-4">
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100 flex items-start gap-3">
                    <AlertCircle className="text-orange-600 shrink-0 mt-0.5" size={18} />
                    <div className="text-sm text-orange-800">
                        <p className="font-semibold">Returning a file sends it back</p>
                        <p className="mt-1">The workflow will be paused until the issues are resolved and the file is re-submitted.</p>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Return To
                    </label>
                    <select
                        value={returnTo}
                        onChange={(e) => setReturnTo(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    >
                        <option value="">Select User</option>
                        {previousSenders.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.role})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Reason
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'needs_improvement', label: 'Needs Improvement' },
                            { id: 'incomplete', label: 'Incomplete' },
                            { id: 'query', label: 'Query Raised' },
                            { id: 'other', label: 'Other' }
                        ].map(type => (
                            <button
                                key={type.id}
                                type="button"
                                onClick={() => setReason(type.id)}
                                className={`px-3 py-2 text-sm border rounded-lg transition-colors ${reason === type.id
                                        ? 'bg-orange-50 border-orange-200 text-orange-700 font-medium'
                                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Remarks <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={3}
                        placeholder="Please specify why the file is being returned..."
                        className="w-full border border-slate-200 rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none resize-none"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
                    >
                        {isSubmitting ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <RotateCcw size={16} />
                        )}
                        Return File
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
