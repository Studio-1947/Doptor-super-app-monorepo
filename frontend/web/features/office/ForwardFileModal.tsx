'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Share2, User as UserIcon, Loader2 } from 'lucide-react';
import { usersService, UserListItem } from '../../services/users.service';
import { filesService } from '../../services/files.service';

type User = UserListItem;

interface ForwardFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    fileId: string;
    currentSubject: string;
}

export default function ForwardFileModal({ isOpen, onClose, onSuccess, fileId, currentSubject }: ForwardFileModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (isOpen && searchQuery.length > 1) {
            const timer = setTimeout(searchUsers, 500);
            return () => clearTimeout(timer);
        }
    }, [searchQuery, isOpen]);

    const searchUsers = async () => {
        try {
            const results = await usersService.list({ search: searchQuery });
            setUsers(results);
        } catch (error) {
            console.error(error);
        }
    };

    const handleForward = async () => {
        if (!selectedUser) return;
        setIsLoading(true);
        try {
            await filesService.forward(fileId, selectedUser.id, remarks || undefined);
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Failed to forward', error);
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
                    className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Share2 className="text-blue-600" />
                            Forward File
                        </h2>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-blue-600 font-bold uppercase">Moving File</p>
                            <p className="text-sm font-medium text-blue-900 truncate">{currentSubject}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">To Whom?</label>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => {
                                    setSearchQuery(e.target.value);
                                    if (selectedUser) setSelectedUser(null);
                                }}
                                placeholder="Search by name or email..."
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            />

                            {/* Search Results Dropdown */}
                            {users.length > 0 && !selectedUser && searchQuery.length > 1 && (
                                <div className="mt-2 border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                                    {users.map(user => (
                                        <div
                                            key={user.id}
                                            onClick={() => {
                                                setSelectedUser(user);
                                                setSearchQuery(`${user.first_name} ${user.last_name}`);
                                                setUsers([]);
                                            }}
                                            className="p-2 hover:bg-slate-50 cursor-pointer flex items-center gap-3 border-b border-slate-50 last:border-0"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500">
                                                <UserIcon size={14} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-slate-900">{user.first_name} {user.last_name}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Remarks / Instruction</label>
                            <textarea
                                value={remarks}
                                onChange={e => setRemarks(e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none h-24 resize-none"
                                placeholder="Any specific instructions for the receiver..."
                            />
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-slate-700 font-medium hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleForward}
                            disabled={!selectedUser}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading && <Loader2 className="animate-spin" size={16} />}
                            Forward File
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
