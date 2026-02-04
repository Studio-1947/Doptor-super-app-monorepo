'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    FileText,
    Send,
    Clock,
    CheckCircle,
    XCircle,
    MoreVertical,
    Paperclip,
    Share2
} from 'lucide-react';
import Link from 'next/link';
import { filesService, File } from '../../../../services/files.service';
import { formatDistanceToNow } from 'date-fns';
import ForwardFileModal from '../../../../features/office/ForwardFileModal';

interface Note {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    is_final: boolean;
}

interface FileDetail extends File {
    notes: Note[];
    movements: any[];
}

export default function FileDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [file, setFile] = useState<FileDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'notes' | 'history'>('notes');
    const [newNote, setNewNote] = useState('');

    // Forward Modal State
    const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

    useEffect(() => {
        if (params.id) {
            loadFile(params.id as string);
        }
    }, [params.id]);

    const loadFile = async (id: string) => {
        try {
            setLoading(true);
            const data = await filesService.getFile(id);
            setFile(data);
        } catch (error) {
            console.error('Error loading file:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddNote = async () => {
        if (!file || !newNote.trim()) return;
        try {
            // API call to add note would go here
            await filesService.addNote(file.id, newNote); // Need to add this method to Service
            // Reload
            setNewNote('');
            loadFile(file.id);
        } catch (error) {
            console.error('Failed to add note', error);
        }
    };

    const handleForwardSuccess = () => {
        // If forwarded, it might leave our inbox?
        // For now, just reload to show new status/movement
        if (file) loadFile(file.id);
        router.push('/office'); // Go back to dashboard as I verified I don't have it anymore? or stay?
        // Actually usually if I forward it, it's gone from my 'Active' inbox but visible in 'Sent'.
        // Let's redirect to dashboard for clarity.
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!file) {
        return (
            <div className="p-8 text-center">
                <h2 className="text-xl font-semibold text-slate-700">File not found</h2>
                <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
            {/* Top Navigation Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-bold text-slate-900">{file.subject}</h1>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${file.priority === 'immediate' ? 'bg-red-50 text-red-700 border-red-100' :
                                file.priority === 'urgent' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                    'bg-blue-50 text-blue-700 border-blue-100'
                                }`}>
                                {file.priority.toUpperCase()}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-mono mt-0.5">{file.file_number} • {file.status.toUpperCase()}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 shadow-lg shadow-emerald-100">
                        <CheckCircle size={18} />
                        Approve
                    </button>
                    <button
                        onClick={() => setIsForwardModalOpen(true)}
                        className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium flex items-center gap-2"
                    >
                        <Share2 size={18} />
                        Forward
                    </button>
                    <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
                        <MoreVertical size={20} />
                    </button>
                </div>
            </div>

            {/* Modals */}
            <ForwardFileModal
                isOpen={isForwardModalOpen}
                onClose={() => setIsForwardModalOpen(false)}
                onSuccess={handleForwardSuccess}
                fileId={file.id}
                currentSubject={file.subject}
            />

            {/* Split View Container */}
            <div className="flex-1 flex gap-6 min-h-0">
                {/* LEFT PANEL: File Metadata & Documents */}
                <div className="w-1/2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-semibold text-slate-700 flex items-center gap-2">
                            <Paperclip size={18} className="text-slate-400" />
                            Documents & Meta
                        </h3>
                    </div>
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="space-y-6">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Description</label>
                                <p className="mt-2 text-slate-700 leading-relaxed">
                                    {file.description || "No description provided."}
                                </p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">Attachments</label>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer group">
                                        <div className="p-2 bg-white rounded border border-slate-200 text-red-500">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700">Financial_Proposal_v1.pdf</p>
                                            <p className="text-xs text-slate-500">2.4 MB • Added by Initiator</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: Green Sheet (Notes) */}
                <div className="w-1/2 bg-emerald-50/30 rounded-2xl border border-emerald-100 shadow-sm flex flex-col overflow-hidden relative">
                    {/* Watermark-like effect */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <FileText size={120} className="text-emerald-900" />
                    </div>

                    <div className="p-4 border-b border-emerald-100 bg-emerald-50/50 flex justify-between items-center z-10">
                        <div className="flex bg-emerald-100/50 p-1 rounded-lg">
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'notes' ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-600 hover:text-emerald-800'}`}
                            >
                                Green Sheet
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'history' ? 'bg-white text-emerald-800 shadow-sm' : 'text-emerald-600 hover:text-emerald-800'}`}
                            >
                                Movement History
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 z-10 scroll-smooth">
                        {file.notes && file.notes.map((note, index) => (
                            <div key={note.id} className="relative pl-8 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-px before:bg-emerald-200 last:before:hidden">
                                <div className="absolute left-0 top-2 w-6 h-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-700">
                                    {file.notes.length - index}
                                </div>
                                <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                                            Note #{file.notes.length - index}
                                        </span>
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                            <Clock size={12} />
                                            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-slate-800 leading-relaxed whitespace-pre-wrap font-serif">
                                        {note.content}
                                    </p>
                                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-200"></div>
                                        <span className="text-sm font-medium text-slate-600">User ID: {note.user_id}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Note Input Area */}
                    <div className="p-4 bg-white border-t border-emerald-100 z-10 shrink-0">
                        <div className="relative">
                            <textarea
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                placeholder="Type your note here... (This adds to the Green Sheet)"
                                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none h-24 bg-slate-50 focus:bg-white transition-colors"
                            />
                            <button
                                onClick={handleAddNote}
                                disabled={!newNote.trim()}
                                className="absolute right-3 bottom-3 p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
