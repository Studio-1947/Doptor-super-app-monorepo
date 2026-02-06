"use client";

import { useMemo } from 'react';
import {
    FileText,
    ArrowRight,
    RotateCcw,
    CheckCircle2,
    XCircle,
    Archive,
    Clock,
    User
} from 'lucide-react';
import { Card } from '@doptor/shared';
import {
    FileMovement,
    getUserName,
    getUserDesignation
} from './office-mock.db';

interface FileMovementHistoryProps {
    movements: FileMovement[];
    className?: string;
}

export function FileMovementHistory({ movements, className = '' }: FileMovementHistoryProps) {
    // Sort movements by date (newest first)
    const sortedMovements = useMemo(() => {
        return [...movements].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }, [movements]);

    const getActionIcon = (action: FileMovement['action']) => {
        switch (action) {
            case 'create':
                return <FileText size={16} />;
            case 'forward':
                return <ArrowRight size={16} />;
            case 'return':
                return <RotateCcw size={16} />;
            case 'approve':
                return <CheckCircle2 size={16} />;
            case 'reject':
                return <XCircle size={16} />;
            case 'close':
                return <Archive size={16} />;
            default:
                return <Clock size={16} />;
        }
    };

    const getActionColor = (action: FileMovement['action']) => {
        switch (action) {
            case 'create':
                return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'forward':
                return 'bg-violet-100 text-violet-700 border-violet-200';
            case 'return':
                return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'approve':
                return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'reject':
                return 'bg-red-100 text-red-700 border-red-200';
            case 'close':
                return 'bg-slate-100 text-slate-700 border-slate-200';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getActionLabel = (action: FileMovement['action']) => {
        switch (action) {
            case 'create': return 'Created File';
            case 'forward': return 'Forwarded';
            case 'return': return 'Returned';
            case 'approve': return 'Approved';
            case 'reject': return 'Rejected';
            case 'close': return 'Closed';
            default: return action;
        }
    };

    if (movements.length === 0) {
        return (
            <Card className={`p-8 text-center border-slate-200 ${className}`}>
                <Clock className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500">No movement history available</p>
            </Card>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock size={18} className="text-slate-500" />
                Movement History
            </h3>

            <div className="relative pl-6 border-l-2 border-slate-200 space-y-8">
                {sortedMovements.map((movement, index) => (
                    <div key={movement.id} className="relative">
                        {/* Timeline Dot */}
                        <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 border-white ring-2 ${index === 0 ? 'bg-primary-500 ring-primary-100' : 'bg-slate-300 ring-slate-100'
                            }`} />

                        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                            {/* Action Badge */}
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shrink-0 self-start ${getActionColor(movement.action)}`}>
                                {getActionIcon(movement.action)}
                                <span>{getActionLabel(movement.action)}</span>
                            </div>

                            {/* Date */}
                            <div className="text-xs text-slate-500 mt-1 sm:mt-0.5 whitespace-nowrap">
                                {new Date(movement.createdAt).toLocaleString('en-IN', {
                                    day: 'numeric', month: 'short', year: 'numeric',
                                    hour: '2-digit', minute: '2-digit'
                                })}
                            </div>
                        </div>

                        {/* Movement Details */}
                        <Card className="mt-3 p-4 border-slate-200 bg-white hover:border-primary-200 transition-colors">
                            <div className="flex flex-col gap-3">

                                {/* From -> To */}
                                <div className="flex items-center gap-3 text-sm">
                                    {movement.fromUserId ? (
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500">
                                                {getUserName(movement.fromUserId).charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-medium text-slate-900">{getUserName(movement.fromUserId)}</span>
                                                <span className="text-xs text-slate-500 block">{getUserDesignation(movement.fromUserId)}</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-slate-500 italic">System</span>
                                    )}

                                    <ArrowRight size={16} className="text-slate-400 shrink-0" />

                                    <div className="flex items-center gap-2 text-slate-600">
                                        <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-xs font-bold text-primary-600">
                                            {getUserName(movement.toUserId).charAt(0)}
                                        </div>
                                        <div>
                                            <span className="font-medium text-slate-900">{getUserName(movement.toUserId)}</span>
                                            <span className="text-xs text-slate-500 block">{getUserDesignation(movement.toUserId)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Remarks */}
                                {movement.remarks && (
                                    <div className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                        <span className="font-medium text-slate-700 block mb-1 text-xs uppercase tracking-wider">Remarks:</span>
                                        {movement.remarks}
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
}
