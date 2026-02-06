"use client";

import { useState } from 'react';
import {
    FileText,
    Save,
    Send,
    Clock,
    CheckCircle2,
    AlertCircle,
    Bold,
    Italic,
    List,
    AlignLeft
} from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { NoteSheet, getUserName, getUserDesignation } from './office-mock.db';
import { toast } from 'sonner';

interface NoteSheetEditorProps {
    initialNotes: NoteSheet[];
    currentUserId: string;
    onAddNote?: (note: string, isFinal: boolean) => void;
    className?: string;
}

export function NoteSheetEditor({
    initialNotes,
    currentUserId,
    onAddNote,
    className = ''
}: NoteSheetEditorProps) {
    const [notes, setNotes] = useState<NoteSheet[]>(
        [...initialNotes].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    );
    const [newNoteContent, setNewNoteContent] = useState('');
    const [isFinal, setIsFinal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async (submit: boolean = false) => {
        if (!newNoteContent.trim()) {
            toast.error('Note content cannot be empty');
            return;
        }

        setIsSaving(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Creating mock new note
        const newNote: NoteSheet = {
            id: `new-${Date.now()}`,
            fileId: notes[0]?.fileId || 'unknown',
            userId: currentUserId,
            content: newNoteContent,
            version: 1,
            isFinal: submit || isFinal,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        setNotes([...notes, newNote]);
        setNewNoteContent('');
        setIsFinal(false);
        setIsSaving(false);

        toast.success(submit ? 'Note submitted successfully' : 'Draft saved successfully');

        if (onAddNote) {
            onAddNote(newNoteContent, submit || isFinal);
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
                        <Card key={note.id} className={`p-0 overflow-hidden border-slate-200 ${note.userId === currentUserId ? 'border-primary-200' : ''
                            }`}>
                            {/* Note Header */}
                            <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <span className="font-semibold text-slate-900 text-sm block">
                                            {getUserName(note.userId)}
                                        </span>
                                        <span className="text-xs text-slate-500">
                                            {getUserDesignation(note.userId)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="text-slate-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        {new Date(note.createdAt).toLocaleString('en-IN', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </span>
                                    {note.isFinal ? (
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

                            {/* Note Content */}
                            <div
                                className="p-4 text-sm text-slate-700 prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: note.content }}
                            />
                        </Card>
                    ))
                )}
            </div>

            {/* New Note Editor */}
            <Card className="p-4 border-slate-200 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                    <label className="text-sm font-semibold text-slate-700">Add Note</label>
                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                        <button className="p-1 hover:bg-white rounded text-slate-600" title="Bold">
                            <Bold size={16} />
                        </button>
                        <button className="p-1 hover:bg-white rounded text-slate-600" title="Italic">
                            <Italic size={16} />
                        </button>
                        <div className="w-px bg-slate-300 mx-1" />
                        <button className="p-1 hover:bg-white rounded text-slate-600" title="List">
                            <List size={16} />
                        </button>
                        <button className="p-1 hover:bg-white rounded text-slate-600" title="Align Left">
                            <AlignLeft size={16} />
                        </button>
                    </div>
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
        </div>
    );
}
