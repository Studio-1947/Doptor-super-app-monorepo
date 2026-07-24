"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ReadyUI } from '@/components/ReadyUI';
import { FileText, Archive, Clock, CheckCircle2, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { filesService, File as RegistryFile, FileAnalytics } from '@/services/files.service';

const STATUS_STYLES: Record<string, string> = {
    active: 'text-blue-600 border-blue-100 bg-blue-50',
    approved: 'text-emerald-600 border-emerald-100 bg-emerald-50',
    rejected: 'text-rose-600 border-rose-100 bg-rose-50',
    closed: 'text-slate-500 border-slate-100 bg-slate-50',
    archived: 'text-slate-400 border-slate-100 bg-slate-50',
};

export default function RegistryPage() {
    const router = useRouter();
    const [files, setFiles] = useState<RegistryFile[] | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    // Stats are org-wide, so they come from /files/analytics rather than being
    // counted off the current page — otherwise they'd only describe one page.
    const [analytics, setAnalytics] = useState<FileAnalytics | null>(null);

    useEffect(() => {
        filesService
            .getRegistry({ page })
            .then((res) => {
                setFiles(res.data);
                setTotalPages(res.totalPages);
            })
            .catch(() => setFiles([]));
    }, [page]);

    useEffect(() => {
        filesService.getAnalytics().then(setAnalytics).catch(() => setAnalytics(null));
    }, []);

    const byStatus = analytics?.byStatus ?? {};
    const closed = (byStatus.closed ?? 0) + (byStatus.archived ?? 0);
    const show = (value: number) => (analytics === null ? '-' : String(value));

    const stats = [
        { label: 'Total Files', value: show(analytics?.totalFiles ?? 0), icon: FileText, color: 'bg-primary-500' },
        { label: 'Active', value: show(byStatus.active ?? 0), icon: Clock, color: 'bg-blue-500' },
        { label: 'Approved', value: show(byStatus.approved ?? 0), icon: CheckCircle2, color: 'bg-emerald-500' },
        { label: 'Closed/Archived', value: show(closed), icon: Archive, color: 'bg-slate-500' },
    ] as any[];

    return (
        <ReadyUI
            title="File Registry"
            description="Organisation-wide searchable ledger of every file (e-Dak) initiated across departments."
            moduleName="Office"
            stats={stats}
        >
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">File No.</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Initiated By</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Holder</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {(files ?? []).map((file) => (
                            <tr key={file.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-6 py-4">
                                    <span className="text-xs font-black text-primary-600 tracking-tighter">{file.file_number}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-sm font-bold text-slate-900">{file.subject}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">
                                        {file.initiator ? `${file.initiator.first_name ?? ''} ${file.initiator.last_name ?? ''}`.trim() || file.initiator.email : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-bold text-slate-600">
                                        {file.currentHolder ? `${file.currentHolder.first_name ?? ''} ${file.currentHolder.last_name ?? ''}`.trim() || file.currentHolder.email : '—'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border ${STATUS_STYLES[file.status] ?? 'text-slate-400 border-slate-100 bg-slate-50'}`}>
                                        {file.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => router.push(`/office/files/${file.id}`)}
                                        className="text-[10px] font-black text-slate-900 uppercase tracking-widest inline-flex items-center gap-1 group-hover:gap-3 transition-all hover:text-primary-600"
                                    >
                                        Open <ArrowRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {files !== null && files.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-400">
                                    No files have been initiated yet.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="inline-flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border border-slate-200 hover:border-primary-500 hover:text-primary-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            <ChevronLeft size={14} /> Prev
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="inline-flex items-center gap-1 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-900 border border-slate-200 hover:border-primary-500 hover:text-primary-600 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                        >
                            Next <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            )}
        </ReadyUI>
    );
}
