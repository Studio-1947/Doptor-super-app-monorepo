'use client';

import { useState } from 'react';
import { filesService, FileDetails as FileDetailsType, NoteSheet } from '../../services/files.service';
import { X, Send, RotateCcw, Archive, Plus, User, Clock, FileText, CheckCircle2, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';

interface FileDetailsProps {
    fileId: string;
    onClose: () => void;
    onUpdate: () => void;
}

export default function FileDetails({ fileId, onClose, onUpdate }: FileDetailsProps) {
    const [file, setFile] = useState<FileDetailsType | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'notes' | 'movements'>('notes');
    const [noteContent, setNoteContent] = useState('');
    const [actionModal, setActionModal] = useState<'forward' | 'return' | 'close' | null>(null);
    const [actionUserId, setActionUserId] = useState('');
    const [actionRemarks, setActionRemarks] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Load file details
    useState(() => {
        loadDetails();
    });

    async function loadDetails() {
        try {
            setLoading(true);
            const data = await filesService.getFile(fileId);
            setFile(data);
        } catch (error) {
            console.error('Failed to load file details', error);
        } finally {
            setLoading(false);
        }
    }

    async function handleAddNote() {
        if (!noteContent.trim() || !file) return;

        try {
            setSubmitting(true);
            await filesService.addNote(file.id, noteContent);
            setNoteContent('');
            loadDetails(); // Reload to show new note
            onUpdate();
        } catch (error) {
            console.error('Failed to add note', error);
        } finally {
            setSubmitting(false);
        }
    }

    async function handleAction() {
        if (!file || !actionModal) return;

        try {
            setSubmitting(true);
            if (actionModal === 'forward') {
                await filesService.forward(file.id, actionUserId, actionRemarks);
            } else if (actionModal === 'return') {
                await filesService.returnFile(file.id, actionUserId, actionRemarks);
            } else if (actionModal === 'close') {
                await filesService.closeFile(file.id, actionRemarks);
            }

            setActionModal(null);
            setActionUserId('');
            setActionRemarks('');
            onUpdate();
            onClose();
        } catch (error) {
            console.error(`Failed to ${actionModal} file`, error);
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-sm p-8 animate-pulse text-center">
                    <div className="w-8 h-8 bg-slate-200 rounded-sm mx-auto mb-4 animate-spin"></div>
                    <p className="text-xs font-mono text-slate-400">LOADING FILE_DATA...</p>
                </div>
            </div>
        );
    }

    if (!file) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl border border-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-200 bg-white flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-sm">
                                #{file.file_number}
                            </span>
                            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider 
                                ${file.priority === 'urgent' ? 'bg-orange-50 text-orange-600' :
                                    file.priority === 'immediate' ? 'bg-red-50 text-red-600' :
                                        'bg-slate-100 text-slate-600'}`}>
                                {file.priority}
                            </span>
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 leading-tight">{file.subject}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-sm text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/50">
                    {/* Main Info */}
                    <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-white">
                        {/* Tabs */}
                        <div className="flex border-b border-slate-200">
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`flex-1 py-3 text-sm font-medium transition-all relative ${activeTab === 'notes' ? 'text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Note Sheets
                                {activeTab === 'notes' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab('movements')}
                                className={`flex-1 py-3 text-sm font-medium transition-all relative ${activeTab === 'movements' ? 'text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                Movement History
                                {activeTab === 'movements' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-indigo-600"></div>}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                            {activeTab === 'notes' ? (
                                <div className="space-y-6">
                                    {/* Note List */}
                                    <div className="space-y-8">
                                        {file.notes.map((note) => (
                                            <div key={note.id} className="relative pl-8">
                                                {/* Timeline Logic */}
                                                <div className="absolute left-[11px] top-8 bottom-0 w-px bg-slate-200 last:hidden"></div>
                                                <div className="absolute left-0 top-1 w-6 h-6 rounded-sm bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 z-10">
                                                    <span className="text-[10px] font-bold">{note.version}</span>
                                                </div>

                                                <div className="bg-slate-50 rounded-sm p-4 border border-slate-100 hover:border-slate-200 transition-colors">
                                                    <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs font-bold text-slate-700">User Name</span>
                                                            <span className="text-[10px] text-slate-400 border-l border-slate-200 pl-2">
                                                                {format(new Date(note.created_at), 'MMM dd, HH:mm')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap font-light">
                                                        {note.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Add Note Input */}
                                    <div className="bg-white border border-slate-200 rounded-sm shadow-sm mt-8">
                                        <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center gap-2 text-xs text-slate-500 font-medium uppercase tracking-wider">
                                            <FileText size={14} /> New Note
                                        </div>
                                        <textarea
                                            value={noteContent}
                                            onChange={(e) => setNoteContent(e.target.value)}
                                            placeholder="Type your note here..."
                                            className="w-full text-sm border-0 focus:ring-0 p-4 resize-none min-h-[120px] placeholder:text-slate-400 font-light"
                                        />
                                        <div className="flex justify-end p-3 bg-slate-50 border-t border-slate-200">
                                            <button
                                                onClick={handleAddNote}
                                                disabled={!noteContent.trim() || submitting}
                                                className="px-4 py-2 bg-slate-900 text-white text-xs font-medium rounded-sm hover:bg-slate-800 transition disabled:opacity-50 uppercase tracking-wide"
                                            >
                                                Add Note
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-0 relative">
                                    <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-200"></div>
                                    {file.movements.map((movement, idx) => (
                                        <div key={movement.id} className="relative pl-10 pb-8 last:pb-0">
                                            <div className="absolute left-[15px] top-1.5 w-2 h-2 rounded-full border border-white bg-slate-400 z-10 box-content shadow-sm ring-4 ring-white"></div>

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-baseline justify-between">
                                                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">{movement.action}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">
                                                        {format(new Date(movement.created_at), 'MMM dd, HH:mm')}
                                                    </span>
                                                </div>

                                                <div className="text-sm font-light text-slate-600 mt-1">
                                                    Moved from <span className="font-medium text-slate-900">User A</span> to <span className="font-medium text-slate-900">User B</span>
                                                </div>

                                                {movement.remarks && (
                                                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 p-2 rounded-sm border-l-2 border-slate-300">
                                                        {movement.remarks}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Actions */}
                    <div className="w-full lg:w-80 bg-slate-50 p-6 flex flex-col gap-6 overflow-y-auto">
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Workflow Actions</h3>
                            <div className="space-y-3">
                                <ActionButton
                                    icon={Send}
                                    label="Forward File"
                                    desc="Send to another user"
                                    color="indigo"
                                    onClick={() => setActionModal('forward')}
                                />
                                <ActionButton
                                    icon={RotateCcw}
                                    label="Return File"
                                    desc="Send back to sender"
                                    color="orange"
                                    onClick={() => setActionModal('return')}
                                />
                                <ActionButton
                                    icon={CheckCircle2}
                                    label="Close File"
                                    desc="Archive and complete"
                                    color="emerald"
                                    onClick={() => setActionModal('close')}
                                />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">File Metadata</h3>
                            <div className="bg-white border border-slate-200 rounded-sm p-4 space-y-4">
                                <MetadataItem icon={Clock} label="Created On" value={format(new Date(file.created_at), 'MMM dd, yyyy')} />
                                <MetadataItem icon={User} label="Initiator" value={`${file.initiator?.first_name || 'System'} ${file.initiator?.last_name || ''}`} />
                                <MetadataItem icon={User} label="Current Holder" value="John Doe" />

                                <div className="pt-3 border-t border-slate-100">
                                    <p className="text-xs text-slate-400 mb-2">Description</p>
                                    <p className="text-xs text-slate-600 leading-relaxed font-light">{file.description}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Modals */}
                {actionModal && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                        <div className="w-full max-w-md">
                            <h3 className="text-2xl font-light text-slate-900 mb-6 capitalize text-center">
                                {actionModal} File
                            </h3>

                            <div className="space-y-5">
                                {actionModal !== 'close' && (
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Select User</label>
                                        <input
                                            type="text"
                                            placeholder="Enter user ID..."
                                            value={actionUserId}
                                            onChange={(e) => setActionUserId(e.target.value)}
                                            className="w-full px-4 py-3 border border-slate-200 rounded-sm focus:outline-none focus:border-slate-400 font-light"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Remarks</label>
                                    <textarea
                                        value={actionRemarks}
                                        onChange={(e) => setActionRemarks(e.target.value)}
                                        placeholder="Add context..."
                                        className="w-full px-4 py-3 border border-slate-200 rounded-sm focus:outline-none focus:border-slate-400 min-h-[120px] font-light resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-4">
                                    <button
                                        onClick={() => setActionModal(null)}
                                        className="py-3 text-slate-600 text-sm font-medium hover:bg-slate-50 rounded-sm transition border border-slate-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleAction}
                                        disabled={submitting}
                                        className="py-3 bg-slate-900 text-white text-sm font-medium rounded-sm hover:bg-slate-800 transition disabled:opacity-50"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ActionButton({ icon: Icon, label, desc, color, onClick }: any) {
    const colorClasses: any = {
        indigo: 'text-indigo-600 bg-indigo-50 group-hover:bg-indigo-600 group-hover:text-white',
        orange: 'text-orange-600 bg-orange-50 group-hover:bg-orange-600 group-hover:text-white',
        emerald: 'text-emerald-600 bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white',
    };

    return (
        <button
            onClick={onClick}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 hover:border-slate-300 rounded-sm text-left transition-all group shadow-sm hover:shadow"
        >
            <div className={`p-2 rounded-sm transition-colors ${colorClasses[color]}`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="font-medium text-slate-900 text-sm">{label}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wide">{desc}</p>
            </div>
        </button>
    );
}

function MetadataItem({ icon: Icon, label, value }: any) {
    return (
        <div>
            <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                <Icon size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
            </div>
            <p className="text-sm font-light text-slate-900">{value}</p>
        </div>
    );
}
