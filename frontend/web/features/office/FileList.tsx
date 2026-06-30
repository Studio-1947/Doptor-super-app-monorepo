'use client';

import { File } from '@/services/files.service';
import { FileText, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

interface FileListProps {
    files: File[];
    onFileClick: (file: File) => void;
}

const priorityConfig = {
    normal: { color: 'text-slate-600 bg-slate-100', priorityColor: 'bg-slate-300', label: 'NORMAL' },
    urgent: { color: 'text-orange-600 bg-orange-50', priorityColor: 'bg-orange-500', label: 'URGENT' },
    immediate: { color: 'text-red-600 bg-red-50', priorityColor: 'bg-red-500', label: 'IMMEDIATE' },
};

const statusConfig = {
    active: { color: 'text-green-600 bg-green-100', label: 'Active' },
    approved: { color: 'text-emerald-600 bg-emerald-100', label: 'Approved' },
    rejected: { color: 'text-red-600 bg-red-100', label: 'Rejected' },
    closed: { color: 'text-slate-600 bg-slate-100', label: 'Closed' },
    archived: { color: 'text-slate-500 bg-slate-50', label: 'Archived' },
};

export default function FileList({ files, onFileClick }: FileListProps) {
    if (files.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white border border-dashed border-slate-300 rounded-sm">
                <div className="p-4 bg-slate-50 rounded-full mb-4">
                    <FileText size={32} className="text-slate-300" />
                </div>
                <h3 className="text-sm font-medium text-slate-900">No files found</h3>
                <p className="text-xs text-slate-500 mt-1">There are no files in this view</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3">
            {files.map((file) => {
                const priority = priorityConfig[file.priority];
                const status = statusConfig[file.status];

                return (
                    <div
                        key={file.id}
                        onClick={() => onFileClick(file)}
                        className="group bg-white border border-slate-200 rounded-sm p-4 hover:border-indigo-500/50 hover:shadow-sm transition-all cursor-pointer relative overflow-hidden"
                    >
                        {/* Status Line */}
                        <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${priority.priorityColor}`} />

                        <div className="flex items-start justify-between gap-4 pl-2">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                                        {file.file_number}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${priority.color}`}>
                                        {priority.label}
                                    </span>
                                </div>

                                <h3 className="font-medium text-slate-900 group-hover:text-indigo-600 transition-colors truncate text-base mb-1">
                                    {file.subject}
                                </h3>

                                {file.description && (
                                    <p className="text-sm text-slate-500 line-clamp-1 mb-3 font-light">
                                        {file.description}
                                    </p>
                                )}

                                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Clock size={14} />
                                        <span>
                                            {format(new Date(file.created_at), 'MMM dd, yyyy')}
                                        </span>
                                    </div>
                                    <div className="w-1 h-1 rounded-full bg-slate-300" />
                                    {file.initiator && (
                                        <div className="flex items-center gap-1.5 text-slate-600">
                                            <div className="w-4 h-4 rounded-sm bg-indigo-100 text-indigo-700 flex items-center justify-center text-[8px] font-bold">
                                                {file.initiator.first_name[0]}{file.initiator.last_name[0]}
                                            </div>
                                            <span>
                                                {file.initiator.first_name} {file.initiator.last_name}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity self-center">
                                <div className="p-2 text-indigo-600 bg-indigo-50 rounded-sm">
                                    <FileText size={18} />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
