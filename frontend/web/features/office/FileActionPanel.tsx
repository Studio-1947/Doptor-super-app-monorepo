"use client";

import {
    ArrowRight,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Archive
} from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { File } from '../../services/files.service';
import { useAuth } from '../../contexts/AuthContext';

interface FileActionPanelProps {
    file: File;
    currentUserId: string;
    onForward: () => void;
    onReturn: () => void;
    onApprove: () => void;
    onReject: () => void;
    onCloseFile: () => void;
    className?: string;
}

/**
 * Holding a file is necessary to act on it, but it was never sufficient — the
 * API gates these routes on `forward:files`, `approve:files` and
 * `update:files` (2026-08-03). Until then this panel offered every action to
 * every holder, so a Staff member — who by `default-roles.ts` may forward but
 * not approve — was shown an Approve button that now returns 403.
 *
 * Rendering an action the caller cannot perform is the same defect ReadyUI was
 * stripped of in M-17: chrome that implies a capability the product does not
 * grant. The permission names here must stay in step with
 * `files.controller.ts`.
 */
export function FileActionPanel({
    file,
    currentUserId,
    onForward,
    onReturn,
    onApprove,
    onReject,
    onCloseFile,
    className = ''
}: FileActionPanelProps) {
    const { hasPermission } = useAuth();

    // Check if current user is the holder
    const isHolder = file.current_user_id === currentUserId;
    const isClosed = file.status === 'closed';

    const canForward = hasPermission('forward', 'files');
    const canApprove = hasPermission('approve', 'files');
    const canClose = hasPermission('update', 'files');
    const canDoAnything = canForward || canApprove || canClose;

    if (!isHolder || isClosed) {
        return (
            <Card className={`p-4 border-slate-200 bg-slate-50 ${className}`}>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">Current Status:</span>
                    <span className={`font-medium px-2.5 py-0.5 rounded-full text-xs ${file.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        file.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            file.status === 'closed' ? 'bg-slate-200 text-slate-700' :
                                'bg-blue-100 text-blue-700'
                        }`}>
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                    </span>
                </div>
                <div className="mt-2 text-sm text-slate-600">
                    {isClosed ? (
                        <p>This file is closed and archived.</p>
                    ) : (
                        <p>Currently with <span className="font-semibold text-slate-900">{file.currentHolder ? `${file.currentHolder.first_name} ${file.currentHolder.last_name}` : 'Unknown'}</span></p>
                    )}
                </div>
            </Card>
        );
    }

    if (!canDoAnything) {
        return (
            <Card className={`p-4 border-slate-200 bg-slate-50 ${className}`}>
                <h3 className="font-bold text-slate-900 mb-2 text-sm uppercase tracking-wide">
                    Workflow Actions
                </h3>
                <p className="text-sm text-slate-600">
                    This file is with you, but your role cannot move or approve
                    files. You can still add notes and attachments.
                </p>
            </Card>
        );
    }

    return (
        <Card className={`p-4 border-slate-200 ${className}`}>
            <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">
                Workflow Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {canForward && (
                    <Button
                        variant="primary"
                        onClick={onForward}
                        className="w-full justify-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                    >
                        <ArrowRight size={18} />
                        Forward File
                    </Button>
                )}

                {canForward && (
                    <Button
                        variant="secondary"
                        onClick={onReturn}
                        className="w-full justify-center gap-2 text-slate-700 border-slate-300 hover:bg-slate-50"
                    >
                        <RotateCcw size={18} />
                        Return File
                    </Button>
                )}

                {canApprove && (
                    <Button
                        variant="secondary"
                        onClick={onApprove}
                        className="w-full justify-center gap-2 text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300"
                    >
                        <CheckCircle2 size={18} />
                        Approve
                    </Button>
                )}

                {canApprove && (
                    <Button
                        variant="secondary"
                        onClick={onReject}
                        className="w-full justify-center gap-2 text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
                    >
                        <XCircle size={18} />
                        Reject
                    </Button>
                )}
            </div>

            {canClose && (
                <div className="mt-3 pt-3 border-t border-slate-100">
                    {/* A "Share" button sat here with no `onClick` at all — it
                        rendered, it was clickable, and it did nothing. Removed
                        rather than wired up: there is no sharing model on files,
                        and M-17 already established that chrome implying an
                        absent capability is worse than an absent button. */}
                    <Button
                        variant="ghost"
                        onClick={onCloseFile}
                        className="w-full justify-center gap-2 text-slate-500 hover:text-slate-700"
                    >
                        <Archive size={16} />
                        Close File
                    </Button>
                </div>
            )}
        </Card>
    );
}
