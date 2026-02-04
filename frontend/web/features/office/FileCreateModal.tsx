'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { filesService, CreateFileData } from '../../services/files.service';

interface FileCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function FileCreateModal({ isOpen, onClose, onSuccess }: FileCreateModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [formData, setFormData] = useState<CreateFileData>({
        file_number: '',
        subject: '',
        description: '',
        priority: 'normal',
        initial_note: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await filesService.create(formData);
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                file_number: '',
                subject: '',
                description: '',
                priority: 'normal',
                initial_note: ''
            });
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to create file');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="text-blue-600" />
                            Create New File (e-Dak)
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                                <AlertCircle size={16} />
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">File Number</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.file_number}
                                    onChange={e => setFormData({ ...formData, file_number: e.target.value })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    placeholder="e.g. FIN-2024-001"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                <select
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value as any })}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                >
                                    <option value="normal">Normal</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="immediate">Immediate</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                            <input
                                type="text"
                                required
                                value={formData.subject}
                                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="Brief subject of the file..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                            <textarea
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-24 resize-none"
                                placeholder="Start typing details..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Green Sheet Note</label>
                            <textarea
                                value={formData.initial_note}
                                onChange={e => setFormData({ ...formData, initial_note: e.target.value })}
                                className="w-full px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none h-32 resize-none font-mono text-sm text-emerald-900"
                                placeholder="Enter the first note for this file..."
                            />
                        </div>

                        <div className="pt-4 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70 flex items-center gap-2"
                            >
                                {isLoading && <Loader2 className="animate-spin" size={16} />}
                                Create File
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
