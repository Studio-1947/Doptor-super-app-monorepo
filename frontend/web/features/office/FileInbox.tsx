'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, Clock, MoreVertical, Search, Filter } from 'lucide-react';
import { filesService, File } from '../../services/files.service';
import { formatDistanceToNow } from 'date-fns';

export default function FileInbox({ refreshTrigger }: { refreshTrigger: number }) {
    const router = useRouter();
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFiles();
    }, [refreshTrigger]);

    const loadFiles = async () => {
        try {
            setIsLoading(true);
            const data = await filesService.getInbox();
            setFiles(data);
        } catch (error) {
            console.error('Failed to load inbox:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl p-8 flex justify-center items-center h-64 border border-slate-100">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="text-slate-400" size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Inbox is Empty</h3>
                <p className="text-slate-500 mt-1">No pending files found in your inbox.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h2 className="font-semibold text-slate-700">Inbox ({files.length})</h2>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500">
                        <Search size={18} />
                    </button>
                    <button className="p-2 hover:bg-white rounded-lg transition-colors text-slate-500">
                        <Filter size={18} />
                    </button>
                </div>
            </div>

            <div className="divide-y divide-slate-100">
                {files.map((file) => (
                    <motion.div
                        key={file.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={() => router.push(`/office/files/${file.id}`)}
                        className="group p-4 hover:bg-blue-50/30 transition-colors cursor-pointer flex items-center gap-4"
                    >
                        <div className={`
                            p-3 rounded-xl shrink-0
                            ${file.priority === 'immediate' ? 'bg-red-50 text-red-600' :
                                file.priority === 'urgent' ? 'bg-orange-50 text-orange-600' :
                                    'bg-blue-50 text-blue-600'}
                        `}>
                            <FileText size={24} />
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h3 className="text-sm font-semibold text-slate-900 truncate pr-4">{file.subject}</h3>
                                <span className="text-xs text-slate-400 whitespace-nowrap flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatDistanceToNow(new Date(file.updated_at), { addSuffix: true })}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-2">
                                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">{file.file_number}</span>
                                <span>•</span>
                                <span>Initiated by {file.initiator ? `${file.initiator.first_name} ${file.initiator.last_name}` : 'Unknown'}</span>
                            </p>
                        </div>

                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600">
                                <MoreVertical size={18} />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
