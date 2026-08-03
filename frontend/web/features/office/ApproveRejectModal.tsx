"use client";

import { useEffect, useState } from 'react';
import { Dialog, Button } from '@doptor/shared';
import { CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { filesService } from '../../services/files.service';
import { usersService, UserListItem } from '../../services/users.service';
import { useAuth } from '../../contexts/AuthContext';

interface ApproveRejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    fileId: string;
    actionType: 'approve' | 'reject';
    onSuccess: () => void;
}

export function ApproveRejectModal({
    isOpen,
    onClose,
    fileId,
    actionType,
    onSuccess
}: ApproveRejectModalProps) {
    const { user } = useAuth();
    const [remarks, setRemarks] = useState('');
    const [forwardTo, setForwardTo] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [nextAuthorities, setNextAuthorities] = useState<UserListItem[]>([]);

    const isApprove = actionType === 'approve';

    useEffect(() => {
        if (isOpen && isApprove) {
            usersService
                .list()
                .then((users) => setNextAuthorities(users.filter((u) => u.id !== user?.id)))
                .catch(() => setNextAuthorities([]));
        }
    }, [isOpen, isApprove, user?.organisation_id, user?.id]);

    const handleSubmit = async () => {
        if (!isApprove && !remarks.trim()) {
            toast.error('Remarks are required for rejection');
            return;
        }

        setIsSubmitting(true);
        try {
            if (isApprove) {
                await filesService.approve(fileId, remarks || undefined, forwardTo || undefined);
            } else {
                await filesService.reject(fileId, remarks);
            }
            toast.success(`File ${isApprove ? 'approved' : 'rejected'} successfully`);
            onSuccess();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || `Failed to ${actionType} file`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={isApprove ? "Approve File" : "Reject File"}
            maxWidth="max-w-md"
        >
            <div className="space-y-4">
                <div className={`p-4 rounded-lg border flex flex-col gap-2 text-center ${isApprove
                        ? 'bg-success-50 border-success-100'
                        : 'bg-danger-50 border-danger-100'
                    }`}>
                    <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${isApprove ? 'bg-success-100 text-success-600' : 'bg-danger-100 text-danger-600'
                        }`}>
                        {isApprove ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                    </div>
                    <div>
                        <h3 className={`font-semibold ${isApprove ? 'text-success-900' : 'text-danger-900'
                            }`}>
                            {isApprove ? 'Approve this file?' : 'Reject this file?'}
                        </h3>
                        <p className={`text-sm mt-1 ${isApprove ? 'text-success-700' : 'text-danger-700'
                            }`}>
                            {isApprove
                                ? 'This check indicates your verification and agreement with the file contents.'
                                : 'Rejecting will close the file workflow immediately.'}
                        </p>
                    </div>
                </div>

                {isApprove && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">
                            Forward To (Optional)
                        </label>
                        <select
                            value={forwardTo}
                            onChange={(e) => setForwardTo(e.target.value)}
                            className="w-full border border-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        >
                            <option value="">End Workflow Here</option>
                            {nextAuthorities.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.first_name} {u.last_name}{u.role ? ` (${u.role.name})` : ''}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-slate-500 mt-1">
                            Select a user to forward this file for further action, or leave empty to complete your part.
                        </p>
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Remarks {isApprove ? '(Optional)' : <span className="text-danger-500">*</span>}
                    </label>
                    <textarea
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        rows={3}
                        placeholder={isApprove ? "Add any approval notes..." : "Reason for rejection..."}
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
                        className={`gap-2 text-white ${isApprove
                                ? 'bg-success-600 hover:bg-success-700'
                                : 'bg-danger-600 hover:bg-danger-700'
                            }`}
                    >
                        {isSubmitting ? (
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            isApprove ? <CheckCircle2 size={16} /> : <XCircle size={16} />
                        )}
                        {isApprove ? 'Confirm Approval' : 'Confirm Rejection'}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
