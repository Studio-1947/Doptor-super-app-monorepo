"use client";

import { useState } from 'react';
import { Dialog, Button } from '@doptor/shared';
import { Calendar, User, Tag, AlignLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MOCK_USERS } from './tasks-mock.db';
import { TaskPriority, TaskType } from './tasks-mock.db';

interface CreateTaskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (task: any) => void;
}

export function CreateTaskDialog({ isOpen, onClose, onSuccess }: CreateTaskDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [type, setType] = useState<TaskType>('general');
    const [dueDate, setDueDate] = useState('');
    const [assignee, setAssignee] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Task title is required');
            return;
        }

        setIsSubmitting(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const newTask = {
            title,
            description,
            priority,
            type,
            dueDate: dueDate || new Date().toISOString(),
            assigneeId: assignee || 'u1', // Default to current user if empty
            tags: [type]
        };

        toast.success('Task created successfully');
        setIsSubmitting(false);
        onSuccess(newTask);
        resetForm();
        onClose();
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setType('general');
        setDueDate('');
        setAssignee('');
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Create New Task" maxWidth="max-w-xl">
            <form onSubmit={handleSubmit} className="space-y-4">

                {/* Title */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Task Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g., Review Monthly Report"
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        autoFocus
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Description
                    </label>
                    <div className="relative">
                        <AlignLeft size={16} className="absolute left-3 top-3 text-slate-400" />
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details about this task..."
                            rows={3}
                            className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Priority */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Priority
                        </label>
                        <div className="relative">
                            <AlertCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none bg-white"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="urgent">Urgent</option>
                            </select>
                        </div>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Task Type
                        </label>
                        <div className="relative">
                            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as TaskType)}
                                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none bg-white"
                            >
                                <option value="general">General</option>
                                <option value="file-review">File Review</option>
                                <option value="meeting">Meeting</option>
                                <option value="approval">Approval</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {/* Due Date */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Due Date
                        </label>
                        <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    {/* Assignee */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Assignee
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={assignee}
                                onChange={(e) => setAssignee(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none bg-white"
                            >
                                <option value="">Select User</option>
                                {MOCK_USERS.map(user => (
                                    <option key={user.id} value={user.id}>{user.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="button" variant="primary" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Creating...' : 'Create Task'}
                    </Button>
                </div>
            </form>
        </Dialog>
    );
}
