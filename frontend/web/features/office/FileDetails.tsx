'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@doptor/shared';
import { format } from 'date-fns';
import { filesService, FileDetails as FileDetailsData } from '../../services/files.service';
import { useAuth } from '../../contexts/AuthContext';
import { FileMovementHistory } from './FileMovementHistory';
import { NoteSheetEditor } from './NoteSheetEditor';
import { FileActionPanel } from './FileActionPanel';
import { ReturnFileModal } from './ReturnFileModal';
import { ApproveRejectModal } from './ApproveRejectModal';
import ForwardFileModal from './ForwardFileModal';
import { toast } from 'sonner';

interface FileDetailsProps {
    fileId: string;
    onClose: () => void;
    onUpdate: () => void;
}

export default function FileDetails({ fileId, onClose, onUpdate }: FileDetailsProps) {
    const { user } = useAuth();
    const currentUserId = user?.id || '';

    const [activeTab, setActiveTab] = useState<'notes' | 'movements'>('notes');
    const [file, setFile] = useState<FileDetailsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Modals state
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [showReturnModal, setShowReturnModal] = useState(false);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);

    const loadFile = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await filesService.getFile(fileId);
            setFile(data);
        } catch (error) {
            console.error('Failed to load file:', error);
            setFile(null);
        } finally {
            setIsLoading(false);
        }
    }, [fileId]);

    useEffect(() => {
        loadFile();
    }, [loadFile]);

    const handleRefresh = () => {
        loadFile();
        onUpdate();
    };

    const handleAddNote = async (content: string, isFinal: boolean) => {
        await filesService.addNote(fileId, content, isFinal);
        handleRefresh();
    };

    const handleCloseFile = async () => {
        try {
            await filesService.closeFile(fileId);
            toast.success('File closed successfully');
            handleRefresh();
            onClose();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to close file');
        }
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                <Loader2 className="animate-spin text-primary-600" size={32} />
            </div>
        );
    }

    if (!file) {
        return (
            <div className="fixed inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
                <Card className="p-8 text-center text-slate-500">
                    <AlertCircle size={32} className="mx-auto mb-2 text-red-500" />
                    File not found
                </Card>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border border-slate-200 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-start shrink-0">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="font-mono text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                #{file.file_number}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                ${file.priority === 'urgent' ? 'bg-orange-50 text-orange-600 border border-orange-100' :
                                    file.priority === 'immediate' ? 'bg-red-50 text-red-600 border border-red-100' :
                                        'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                {file.priority}
                            </span>
                            {file.security_level && (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider
                                    ${file.security_level === 'confidential' || file.security_level === 'secret' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                                        'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                                    {file.security_level}
                                </span>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{file.subject}</h2>
                        <p className="text-sm text-slate-500 mt-0.5">{file.category || 'Uncategorized'} • Created on {format(new Date(file.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Main Layout */}
                <div className="flex-1 overflow-hidden flex flex-col lg:flex-row bg-slate-50/50">

                    {/* Left Panel: Tabs (Notes & History) */}
                    <div className="flex-1 flex flex-col min-w-0 border-r border-slate-200 bg-white shadow-[1px_0_20px_rgba(0,0,0,0.02)] z-10">
                        {/* Tabs Navigation */}
                        <div className="flex border-b border-slate-200 bg-slate-50/50">
                            <button
                                onClick={() => setActiveTab('notes')}
                                className={`flex-1 py-3 text-sm font-semibold transition-all relative ${activeTab === 'notes'
                                        ? 'text-primary-600 bg-white'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                            >
                                Note Sheets
                                {activeTab === 'notes' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary-600"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab('movements')}
                                className={`flex-1 py-3 text-sm font-semibold transition-all relative ${activeTab === 'movements'
                                        ? 'text-primary-600 bg-white'
                                        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
                                    }`}
                            >
                                Movement History
                                {activeTab === 'movements' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-primary-600"></div>}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                            {activeTab === 'notes' ? (
                                <NoteSheetEditor
                                    initialNotes={file.notes}
                                    currentUserId={currentUserId}
                                    onAddNote={handleAddNote}
                                />
                            ) : (
                                <FileMovementHistory movements={file.movements} />
                            )}
                        </div>
                    </div>

                    {/* Right Panel: Actions & Metadata */}
                    <div className="w-full lg:w-80 bg-slate-50 p-6 flex flex-col gap-6 overflow-y-auto shrink-0 border-l border-slate-200">

                        {/* Actions Component */}
                        <FileActionPanel
                            file={file}
                            currentUserId={currentUserId}
                            onForward={() => setShowForwardModal(true)}
                            onReturn={() => setShowReturnModal(true)}
                            onApprove={() => setShowApproveModal(true)}
                            onReject={() => setShowRejectModal(true)}
                            onCloseFile={handleCloseFile}
                        />

                        {/* Metadata Component */}
                        <Card className="p-4 border-slate-200">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">File Details</h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                                        <Clock size={12} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Description</span>
                                    </div>
                                    <p className="text-sm text-slate-700 leading-relaxed">
                                        {file.description || 'No description provided.'}
                                    </p>
                                </div>
                                {!!file.tags?.length && (
                                    <div className="pt-3 border-t border-slate-100">
                                        <div className="flex flex-wrap gap-2">
                                            {file.tags.map(tag => (
                                                <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full border border-slate-200">
                                                    #{tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <ForwardFileModal
                isOpen={showForwardModal}
                onClose={() => setShowForwardModal(false)}
                fileId={file.id}
                currentSubject={file.subject}
                onSuccess={handleRefresh}
            />

            <ReturnFileModal
                isOpen={showReturnModal}
                onClose={() => setShowReturnModal(false)}
                fileId={file.id}
                movements={file.movements}
                onSuccess={handleRefresh}
            />

            <ApproveRejectModal
                isOpen={showApproveModal}
                onClose={() => setShowApproveModal(false)}
                fileId={file.id}
                actionType="approve"
                onSuccess={handleRefresh}
            />

            <ApproveRejectModal
                isOpen={showRejectModal}
                onClose={() => setShowRejectModal(false)}
                fileId={file.id}
                actionType="reject"
                onSuccess={handleRefresh}
            />
        </div>
    );
}
