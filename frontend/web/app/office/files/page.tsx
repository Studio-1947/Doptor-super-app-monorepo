"use client";

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Search, Inbox, Send, Loader2 } from 'lucide-react';
import { Button } from '@doptor/shared';
import { filesService, File } from '@/services/files.service';
import FileList from '@/features/office/FileList';
import FileCreateModal from '@/features/office/FileCreateModal';

export default function OfficeFilesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('filter') === 'sent' ? 'sent' : 'inbox';

    const [tab, setTab] = useState<'inbox' | 'sent'>(initialTab);
    const [inbox, setInbox] = useState<File[]>([]);
    const [outbox, setOutbox] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);

    const loadFiles = async () => {
        try {
            setIsLoading(true);
            const [inboxData, outboxData] = await Promise.all([
                filesService.getInbox(),
                filesService.getOutbox(),
            ]);
            setInbox(inboxData);
            setOutbox(outboxData);
        } catch (error) {
            console.error('Failed to load files:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, []);

    const activeFiles = tab === 'inbox' ? inbox : outbox;

    const filteredFiles = useMemo(() => {
        if (!search.trim()) return activeFiles;
        const q = search.toLowerCase();
        return activeFiles.filter(
            (f) =>
                f.subject.toLowerCase().includes(q) ||
                f.file_number.toLowerCase().includes(q),
        );
    }, [activeFiles, search]);

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">e-Dak Files</h1>
                    <p className="text-slate-500 mt-1">Track and manage official correspondence and digital document workflows.</p>
                </div>
                <Button variant="primary" onClick={() => setShowCreateModal(true)} className="gap-2">
                    <Plus size={18} />
                    New File Entry
                </Button>
            </div>

            <div className="flex items-center justify-between gap-4">
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setTab('inbox')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${tab === 'inbox' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Inbox size={16} />
                        Inbox ({inbox.length})
                    </button>
                    <button
                        onClick={() => setTab('sent')}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors ${tab === 'sent' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <Send size={16} />
                        Sent ({outbox.length})
                    </button>
                </div>

                <div className="relative w-64">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search files..."
                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="animate-spin text-indigo-600" size={28} />
                </div>
            ) : (
                <FileList
                    files={filteredFiles}
                    onFileClick={(file) => router.push(`/office/files/${file.id}`)}
                />
            )}

            <FileCreateModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSuccess={loadFiles}
            />
        </div>
    );
}
