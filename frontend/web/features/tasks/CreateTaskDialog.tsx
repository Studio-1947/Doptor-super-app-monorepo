"use client";

import { useEffect, useState } from 'react';
import { Dialog, Button } from '@doptor/shared';
import { Calendar, Users, Tag, AlignLeft, AlertCircle, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { usersService, UserListItem } from '@/services/users.service';
import { departmentService, Department } from '@/services/department.service';
import { tasksService, CreateTaskPayload, TaskPriority, TaskLabel } from '@/services/tasks.service';

interface CreateTaskDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (payload: CreateTaskPayload) => Promise<void> | void;
    /** Pre-selects the parent when creating a subtask. */
    parentTaskId?: string;
}

export function CreateTaskDialog({ isOpen, onClose, onSuccess, parentTaskId }: CreateTaskDialogProps) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<TaskPriority>('medium');
    const [dueDate, setDueDate] = useState('');
    const [departmentId, setDepartmentId] = useState('');
    const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
    const [labelIds, setLabelIds] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [orgUsers, setOrgUsers] = useState<UserListItem[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [labels, setLabels] = useState<TaskLabel[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        usersService.list().then(setOrgUsers).catch(() => setOrgUsers([]));
        departmentService.getAll().then(setDepartments).catch(() => setDepartments([]));
        tasksService.listLabels().then(setLabels).catch(() => setLabels([]));
    }, [isOpen]);

    // A task's reference comes from its department, so default to the first one
    // rather than making the user pick when there is only one sensible choice.
    useEffect(() => {
        if (!departmentId && departments.length > 0) {
            setDepartmentId(departments[0].id);
        }
    }, [departments, departmentId]);

    const toggle = (list: string[], id: string) =>
        list.includes(id) ? list.filter(x => x !== id) : [...list, id];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error('Task title is required');
            return;
        }
        if (!departmentId) {
            toast.error('Pick a department — it determines the task reference');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSuccess({
                title: title.trim(),
                description: description || undefined,
                department_id: departmentId,
                parent_task_id: parentTaskId,
                priority,
                due_date: dueDate || undefined,
                assignee_ids: assigneeIds.length > 0 ? assigneeIds : undefined,
                label_ids: labelIds.length > 0 ? labelIds : undefined,
            });
            toast.success(parentTaskId ? 'Subtask created' : 'Task created successfully');
            resetForm();
            onClose();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setAssigneeIds([]);
        setLabelIds([]);
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={parentTaskId ? 'Create Subtask' : 'Create New Task'}
            maxWidth="max-w-xl"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
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

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
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
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            Department <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <select
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 appearance-none bg-white"
                            >
                                <option value="">Select department</option>
                                {departments.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">Sets the task reference, e.g. FIN-12</p>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Priority</label>
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
                </div>

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Due Date</label>
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

                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        <Users size={14} className="inline mr-1.5 -mt-0.5 text-slate-400" />
                        Assignees
                    </label>
                    <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                        {orgUsers.length === 0 && (
                            <p className="text-xs text-slate-400 px-3 py-2">No users found</p>
                        )}
                        {orgUsers.map(user => (
                            <label key={user.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={assigneeIds.includes(user.id)}
                                    onChange={() => setAssigneeIds(prev => toggle(prev, user.id))}
                                    className="rounded border-slate-300"
                                />
                                <span className="text-sm text-slate-700">
                                    {user.first_name} {user.last_name}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>

                {labels.length > 0 && (
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                            <Tag size={14} className="inline mr-1.5 -mt-0.5 text-slate-400" />
                            Labels
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {labels.map(label => {
                                const selected = labelIds.includes(label.id);
                                return (
                                    <button
                                        key={label.id}
                                        type="button"
                                        onClick={() => setLabelIds(prev => toggle(prev, label.id))}
                                        className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${selected ? 'text-white' : 'text-slate-600 bg-white hover:bg-slate-50'}`}
                                        style={selected ? { backgroundColor: label.color, borderColor: label.color } : { borderColor: label.color }}
                                    >
                                        {label.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

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
