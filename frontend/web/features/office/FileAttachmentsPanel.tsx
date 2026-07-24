'use client';

import { useEffect, useState, useRef } from 'react';
import { Card } from '@doptor/shared';
import { Paperclip, Download, Upload, Loader2 } from 'lucide-react';
import { filesService, FileAttachment } from '../../services/files.service';
import { toast } from 'sonner';

interface FileAttachmentsPanelProps {
    fileId: string;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileAttachmentsPanel({ fileId }: FileAttachmentsPanelProps) {
    const [attachments, setAttachments] = useState<FileAttachment[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const load = () => {
        filesService.getAttachments(fileId).then(setAttachments).catch(() => setAttachments([]));
    };

    useEffect(() => {
        load();
    }, [fileId]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await filesService.uploadAttachment(fileId, file);
            toast.success('Attachment uploaded');
            load();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to upload attachment');
        } finally {
            setIsUploading(false);
            if (inputRef.current) inputRef.current.value = '';
        }
    };

    const handleDownload = async (attachment: FileAttachment) => {
        setIsDownloading(attachment.id);
        try {
            await filesService.downloadAttachment(attachment.id, attachment.original_name);
        } catch {
            toast.error('Failed to download attachment');
        } finally {
            setIsDownloading(null);
        }
    };

    return (
        <Card className="p-4 border-slate-200">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attachments</h3>
                <button
                    onClick={() => inputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1 text-xs font-semibold text-primary-600 hover:text-primary-700 disabled:opacity-50"
                >
                    {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    Upload
                </button>
                <input ref={inputRef} type="file" className="hidden" onChange={handleFileSelect} />
            </div>

            {attachments.length === 0 ? (
                <p className="text-sm text-slate-400">No attachments yet.</p>
            ) : (
                <div className="space-y-2">
                    {attachments.map((att) => (
                        <div key={att.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-slate-50 border border-slate-100">
                            <div className="flex items-center gap-2 min-w-0">
                                <Paperclip size={14} className="text-slate-400 shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-xs font-medium text-slate-700 truncate">{att.original_name}</p>
                                    <p className="text-[10px] text-slate-400">{formatSize(att.size_bytes)}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDownload(att)}
                                disabled={isDownloading === att.id}
                                className="p-1.5 text-slate-400 hover:text-primary-600 shrink-0"
                            >
                                {isDownloading === att.id ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </Card>
    );
}
