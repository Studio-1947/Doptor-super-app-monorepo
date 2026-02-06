"use client";

import {
    ArrowRight,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Archive,
    MoreVertical,
    Share2
} from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { OfficeFile, getUserName } from './office-mock.db';

interface FileActionPanelProps {
    file: OfficeFile;
    currentUserId: string;
    onForward: () => void;
    onReturn: () => void;
    onApprove: () => void;
    onReject: () => void;
    onCloseFile: () => void;
    className?: string;
}

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
    // Check if current user is the holder
    const isHolder = file.currentHolderId === currentUserId;
    const isClosed = file.status === 'closed';

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
                        <p>Currently with <span className="font-semibold text-slate-900">{getUserName(file.currentHolderId)}</span></p>
                    )}
                </div>
            </Card>
        );
    }

    return (
        <Card className={`p-4 border-slate-200 ${className}`}>
            <h3 className="font-bold text-slate-900 mb-4 text-sm uppercase tracking-wide">
                Workflow Actions
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                    variant="primary"
                    onClick={onForward}
                    className="w-full justify-center gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                    <ArrowRight size={18} />
                    Forward File
                </Button>

                <Button
                    variant="outline"
                    onClick={onReturn}
                    className="w-full justify-center gap-2 text-slate-700 border-slate-300 hover:bg-slate-50"
                >
                    <RotateCcw size={18} />
                    Return File
                </Button>

                <Button
                    variant="outline"
                    onClick={onApprove}
                    className="w-full justify-center gap-2 text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300"
                >
                    <CheckCircle2 size={18} />
                    Approve
                </Button>

                <Button
                    variant="outline"
                    onClick={onReject}
                    className="w-full justify-center gap-2 text-red-700 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300"
                >
                    <XCircle size={18} />
                    Reject
                </Button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3">
                <Button
                    variant="ghost"
                    onClick={onCloseFile}
                    className="w-full justify-center gap-2 text-slate-500 hover:text-slate-700"
                >
                    <Archive size={16} />
                    Close File
                </Button>
                <Button
                    variant="ghost"
                    className="w-full justify-center gap-2 text-slate-500 hover:text-slate-700"
                >
                    <Share2 size={16} />
                    Share
                </Button>
            </div>
        </Card>
    );
}
