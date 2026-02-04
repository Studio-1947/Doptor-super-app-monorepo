'use client';

import { useState } from 'react';
import { filesService } from '../../services/files.service';
import { X, FileText, AlertCircle } from 'lucide-react';

interface FileCreateFormProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function FileCreateForm({ onClose, onSuccess }: FileCreateFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        file_number: '',
        subject: '',
        description: '',
        priority: 'normal' as 'normal' | 'urgent' | 'immediate',
        initial_note: ''
    });

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        try {
            setLoading(true);
            await filesService.create(formData);
            onSuccess();
            onClose();
        } catch (error) {
            console.error('Failed to create file', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-sm w-full max-w-lg shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-sm transition-colors text-slate-400 hover:text-slate-600"
                >
                    <X size={20} />
                </button>

                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-200 text-slate-700 rounded-sm">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 uppercase tracking-tight">New File</h2>
                            <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">Initiate e-Dak correspondence</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            File Number <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.file_number}
                            onChange={(e) => setFormData({ ...formData, file_number: e.target.value })}
                            placeholder="e.g. FILE/2026/01/001"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-sm focus:outline-none focus:border-slate-400 font-light text-slate-800 placeholder:text-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Subject <span className="text-red-500">*</span>
                        </label>
                        <input
                            required
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                            placeholder="Enter file subject"
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-sm focus:outline-none focus:border-slate-400 font-light text-slate-800 placeholder:text-slate-400"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Description
                        </label>
                        <textarea
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Brief description of the file content..."
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-sm focus:outline-none focus:border-slate-400 font-light text-slate-800 placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Priority
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {(['normal', 'urgent', 'immediate'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, priority: p })}
                                    className={`py-2 px-3 rounded-sm text-xs font-bold uppercase tracking-wide border transition-all
                    ${formData.priority === p
                                            ? p === 'normal' ? 'bg-slate-100 border-slate-300 text-slate-900'
                                                : p === 'urgent' ? 'bg-orange-50 border-orange-200 text-orange-700'
                                                    : 'bg-red-50 border-red-200 text-red-700'
                                            : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                            Initial Note
                        </label>
                        <textarea
                            rows={4}
                            value={formData.initial_note}
                            onChange={(e) => setFormData({ ...formData, initial_note: e.target.value })}
                            placeholder="Add an initial note to the file..."
                            className="w-full px-4 py-2.5 border border-slate-200 rounded-sm focus:outline-none focus:border-slate-400 font-light text-slate-800 placeholder:text-slate-400 resize-none"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-sm hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-3 bg-slate-900 text-white text-sm font-medium rounded-sm hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? 'Creating...' : 'Create File'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
