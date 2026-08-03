"use client";

import { useEffect, useState } from 'react';
import {
    FileText,
    Save,
    Send,
    Clock,
    CheckCircle2
} from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { NoteSheet } from '../../services/files.service';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';

interface NoteSheetEditorProps {
    initialNotes: NoteSheet[];
    currentUserId: string;
    onAddNote: (note: string, isFinal: boolean) => Promise<void>;
    className?: string;
}

/**
 * The note sheet is the working record of an e-file: anyone who can see the
 * file sees every note on it.
 *
 * Two things that were wrong here until 2026-08-03, and are worth stating so
 * they are not reintroduced:
 *
 * 1. **Note bodies were rendered with `dangerouslySetInnerHTML`.** Nothing
 *    sanitises them — not the API, not this component — and they arrive from a
 *    plain `<textarea>`. So any note author could store script that ran in the
 *    browser of every colleague who later opened the file. The auth cookies are
 *    httpOnly, so a token could not be read, but the script ran same-origin
 *    with those cookies attached and could do anything the viewer could.
 *    Notes are plain text and always have been; they are rendered as text now,
 *    with `whitespace-pre-wrap` preserving the line breaks that were the only
 *    real reason the HTML path appeared to be needed.
 *
 * 2. **A Bold/Italic/List/Align toolbar sat above the textarea with no
 *    `onClick` on any of the four buttons.** It formatted nothing. It also
 *    implied notes were rich text, which is exactly the belief that makes
 *    rendering them as HTML look reasonable — the fake toolbar and the XSS
 *    were the same mistake seen from two ends. Removed, per M-17.
 */
export function NoteSheetEditor({
    initialNotes,
    currentUserId,
    onAddNote,
    className = ''
}: NoteSheetEditorProps) {
    const [notes, setNotes] = useState<NoteSheet[]>(
        [...initialNotes].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    );
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isFinal, setIsFinal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { hasPermission } = useAuth();
    const canAddNote = hasPermission('create', 'files');

    useEffect(() => {
        setNotes([...initialNotes].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    }, [initialNotes]);

    const handleSave = async (submit: boolean = false) => {
        if (!newNoteContent.trim()) {
            toast.error('Note content cannot be empty');
            return;
        }

        setIsSaving(true);
        try {
            await onAddNote(newNoteContent, submit || isFinal);
            setNewNoteContent('');
            setIsFinal(false);
            toast.success(submit ? 'Note submitted successfully' : 'Draft saved successfully');
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to save note');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={18} className="text-slate-500" />
                    Note Sheets
                </h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    Total Notes: {notes.length}
                </span>
            </div>

            {/* Previous Notes */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {notes.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        No notes added yet
                    </div>
                ) : (
                    notes.map((note, index) => (
                        <Card key={note.id} className={`p-0 overflow-hidden border-slate-200 ${note.user_id === currentUserId ? 'border-primary-200' : ''
                            }`}>
                            {/* Note Header */}
                            <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900 text-sm block">
                                            {note.user ? `${note.user.first_name} ${note.user.last_name}` : 'Unknown'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(note.created_at).toLocaleString('en-IN', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                    {note.is_final ? (
                                        <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                                            <CheckCircle2 size={12} /> Final
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                            <Clock size={12} /> Draft
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Note Content — plain text by design; see the
                                component docblock before changing this back. */}
                            <div className="p-4 text-sm text-slate-700 whitespace-pre-wrap break-words">
                                {note.content}
                            </div>
                        </Card>
                    ))
                )}
            </div>

            {/* New Note Editor — only for roles the API will actually accept a
                note from (`create:files`). An Auditor holds `read:files` alone
                and would otherwise be shown a composer that 403s on submit. */}
            {!canAddNote ? null : (
            <Card className="p-4 border-slate-200 shadow-sm">
                <div className="mb-3">
                    <label className="text-sm font-semibold text-slate-700">Add Note</label>
                </div>

                <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Type your note here..."
                    className="w-full h-32 p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none text-sm"
                />

                <div className="mt-4 flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={isFinal}
                            onChange={(e) => setIsFinal(e.target.checked)}
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500 border-slate-300"
                        />
                        <span className="text-sm text-slate-700">Mark as Final</span>
                    </label>

                    <div className="flex gap-2">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleSave(false)}
                            disabled={isSaving || !newNoteContent.trim()}
                            className="gap-2"
                        >
                            <Save size={16} />
                            Save Draft
                        </Button>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleSave(true)}
                            disabled={isSaving || !newNoteContent.trim()}
                            className="gap-2"
                        >
                            <Send size={16} />
                            Submit Note
                        </Button>
                    </div>
                </div>
            </Card>
            )}
        </div>
    );
}
