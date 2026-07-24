"use client";

import { useEffect, useState, useCallback } from 'react';
import {
    X, Loader2, Send, Trash2, Archive, ArchiveRestore,
    Tag, Users, Clock, Building2, Calendar, CornerDownRight,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    tasksService, Task, TaskStatus, TaskPriority, TaskLabel, TaskAuditEntry,
} from '@/services/tasks.service';
import { usersService, UserListItem } from '@/services/users.service';

const STATUSES: { id: TaskStatus; label: string }[] = [
    { id: 'todo', label: 'To Do' },
    { id: 'in-progress', label: 'In Progress' },
    { id: 'review', label: 'Review' },
    { id: 'done', label: 'Done' },
];

const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent'];

const initials = (u: { first_name?: string; last_name?: string }) =>
    `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || '?';

const fullName = (u: { first_name?: string; last_name?: string; email?: string }) =>
    `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim() || u.email || 'Unknown';

/** Renders an audit row as a readable sentence. */
function describeEntry(entry: TaskAuditEntry): string {
    const val = (v: unknown) => {
        if (v === null || v === undefined || v === '') return 'empty';
        if (typeof v === 'object') return JSON.stringify(v);
        return String(v);
    };
    switch (entry.action) {
        case 'created': return 'created this task';
        case 'commented': return 'added a comment';
        case 'assignee_added': return 'added an assignee';
        case 'assignee_removed': return 'removed an assignee';
        case 'label_added': return 'added a label';
        case 'label_removed': return 'removed a label';
        case 'updated':
            return `changed ${entry.field} from ${val(entry.before_value)} to ${val(entry.after_value)}`;
        default:
            return entry.action;
    }
}

interface TaskDetailDrawerProps {
    taskId: string | null;
    onClose: () => void;
    /** Called whenever the task changes, so the board can refresh. */
    onChanged: (task: Task) => void;
    onDeleted: (taskId: string) => void;
}

export function TaskDetailDrawer({ taskId, onClose, onChanged, onDeleted }: TaskDetailDrawerProps) {
    const [task, setTask] = useState<Task | null>(null);
    const [history, setHistory] = useState<TaskAuditEntry[]>([]);
    const [labels, setLabels] = useState<TaskLabel[]>([]);
    const [orgUsers, setOrgUsers] = useState<UserListItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [comment, setComment] = useState('');
    const [isPosting, setIsPosting] = useState(false);
    const [titleDraft, setTitleDraft] = useState('');
    const [descDraft, setDescDraft] = useState('');

    const apply = useCallback((updated: Task) => {
        setTask(updated);
        setTitleDraft(updated.title);
        setDescDraft(updated.description ?? '');
        onChanged(updated);
    }, [onChanged]);

    const loadHistory = useCallback((id: string) => {
        tasksService.getHistory(id).then(setHistory).catch(() => setHistory([]));
    }, []);

    useEffect(() => {
        if (!taskId) { setTask(null); return; }
        setLoading(true);
        tasksService.getById(taskId)
            .then((t) => { setTask(t); setTitleDraft(t.title); setDescDraft(t.description ?? ''); })
            .catch(() => toast.error('Failed to load task'))
            .finally(() => setLoading(false));
        loadHistory(taskId);
    }, [taskId, loadHistory]);

    useEffect(() => {
        if (!taskId) return;
        tasksService.listLabels().then(setLabels).catch(() => setLabels([]));
        usersService.list().then(setOrgUsers).catch(() => setOrgUsers([]));
    }, [taskId]);

    if (!taskId) return null;

    const run = async (fn: () => Promise<Task>, errorMessage: string) => {
        try {
            const updated = await fn();
            apply(updated);
            loadHistory(updated.id);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || errorMessage);
        }
    };

    const saveField = async (field: 'title' | 'description', value: string) => {
        if (!task) return;
        const current = field === 'title' ? task.title : (task.description ?? '');
        if (value === current) return;
        if (field === 'title' && !value.trim()) {
            setTitleDraft(task.title);
            return;
        }
        await run(() => tasksService.update(task.id, { [field]: value }), `Failed to update ${field}`);
    };

    const postComment = async () => {
        if (!task || !comment.trim()) return;
        setIsPosting(true);
        try {
            await tasksService.addComment(task.id, comment.trim());
            setComment('');
            const refreshed = await tasksService.getById(task.id);
            apply(refreshed);
            loadHistory(task.id);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to add comment');
        } finally {
            setIsPosting(false);
        }
    };

    const handleDelete = async () => {
        if (!task) return;
        await tasksService.remove(task.id);
        toast.success('Task deleted');
        onDeleted(task.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-slate-900/30" onClick={onClose} />

            <aside className="relative w-full max-w-xl bg-white h-full shadow-xl flex flex-col overflow-hidden">
                {loading || !task ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-slate-400" size={28} />
                    </div>
                ) : (
                    <>
                        <header className="flex items-start justify-between gap-4 px-6 py-4 border-b border-slate-100 shrink-0">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {task.reference && (
                                        <span className="text-xs font-black text-primary-600 tracking-tight">
                                            {task.reference}
                                        </span>
                                    )}
                                    {task.is_archived && (
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                                            Archived
                                        </span>
                                    )}
                                </div>
                                {task.parent && (
                                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                                        <CornerDownRight size={12} /> Subtask of {task.parent.title}
                                    </p>
                                )}
                            </div>
                            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
                                <X size={20} />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                            <div>
                                <input
                                    value={titleDraft}
                                    onChange={(e) => setTitleDraft(e.target.value)}
                                    onBlur={() => saveField('title', titleDraft.trim())}
                                    className="w-full text-lg font-bold text-slate-900 border border-transparent hover:border-slate-200 focus:border-primary-500 rounded-lg px-2 py-1 -ml-2 focus:outline-none"
                                />
                                <textarea
                                    value={descDraft}
                                    onChange={(e) => setDescDraft(e.target.value)}
                                    onBlur={() => saveField('description', descDraft)}
                                    rows={3}
                                    placeholder="Add a description..."
                                    className="mt-2 w-full text-sm text-slate-600 border border-transparent hover:border-slate-200 focus:border-primary-500 rounded-lg px-2 py-1 -ml-2 focus:outline-none resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Status">
                                    <select
                                        value={task.status}
                                        onChange={(e) => run(
                                            () => tasksService.updateStatus(task.id, e.target.value as TaskStatus),
                                            'Failed to update status',
                                        )}
                                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-primary-500"
                                    >
                                        {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                    </select>
                                </Field>

                                <Field label="Priority">
                                    <select
                                        value={task.priority}
                                        onChange={(e) => run(
                                            () => tasksService.update(task.id, { priority: e.target.value as TaskPriority }),
                                            'Failed to update priority',
                                        )}
                                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white capitalize focus:outline-none focus:border-primary-500"
                                    >
                                        {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                </Field>

                                <Field label="Due date" icon={<Calendar size={12} />}>
                                    <input
                                        type="date"
                                        value={task.due_date ?? ''}
                                        onChange={(e) => run(
                                            () => tasksService.update(task.id, { due_date: e.target.value || undefined }),
                                            'Failed to update due date',
                                        )}
                                        className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-primary-500"
                                    />
                                </Field>

                                <Field label="Department" icon={<Building2 size={12} />}>
                                    <p className="text-sm text-slate-600 py-1.5">
                                        {task.department?.name ?? '—'}
                                    </p>
                                </Field>
                            </div>

                            <Field label="Assignees" icon={<Users size={12} />}>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {task.assignees.length === 0 && (
                                        <span className="text-xs text-slate-400">Nobody assigned</span>
                                    )}
                                    {task.assignees.map(a => (
                                        <button
                                            key={a.id}
                                            onClick={() => run(
                                                () => tasksService.removeAssignee(task.id, a.id),
                                                'Failed to remove assignee',
                                            )}
                                            title={`Remove ${fullName(a)}`}
                                            className="group flex items-center gap-1.5 text-xs bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 rounded-full pl-1 pr-2 py-0.5 transition-colors"
                                        >
                                            <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[9px] font-bold">
                                                {initials(a)}
                                            </span>
                                            <span className="text-slate-700 group-hover:text-red-600">{fullName(a)}</span>
                                        </button>
                                    ))}
                                </div>
                                <select
                                    value=""
                                    onChange={(e) => {
                                        if (!e.target.value) return;
                                        run(() => tasksService.addAssignee(task.id, e.target.value), 'Failed to add assignee');
                                    }}
                                    className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-primary-500"
                                >
                                    <option value="">Add assignee…</option>
                                    {orgUsers
                                        .filter(u => !task.assignees.some(a => a.id === u.id))
                                        .map(u => (
                                            <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>
                                        ))}
                                </select>
                            </Field>

                            <Field label="Labels" icon={<Tag size={12} />}>
                                <div className="flex flex-wrap gap-2">
                                    {labels.length === 0 && (
                                        <span className="text-xs text-slate-400">No labels defined yet</span>
                                    )}
                                    {labels.map(label => {
                                        const on = task.labels.some(l => l.id === label.id);
                                        return (
                                            <button
                                                key={label.id}
                                                onClick={() => run(
                                                    () => tasksService.toggleLabel(task.id, label.id),
                                                    'Failed to toggle label',
                                                )}
                                                className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${on ? 'text-white' : 'text-slate-600 bg-white hover:bg-slate-50'}`}
                                                style={on
                                                    ? { backgroundColor: label.color, borderColor: label.color }
                                                    : { borderColor: label.color }}
                                            >
                                                {label.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Field>

                            {task.subtasks && task.subtasks.length > 0 && (
                                <Field label={`Subtasks (${task.subtasks.length})`}>
                                    <ul className="space-y-1">
                                        {task.subtasks.map(st => (
                                            <li key={st.id} className="text-sm text-slate-600 flex items-center gap-2">
                                                <CornerDownRight size={12} className="text-slate-300 shrink-0" />
                                                <span className={st.status === 'done' ? 'line-through text-slate-400' : ''}>
                                                    {st.title}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </Field>
                            )}

                            <Field label="Comments">
                                <div className="space-y-3">
                                    {(task.comments ?? []).length === 0 && (
                                        <p className="text-xs text-slate-400">No comments yet</p>
                                    )}
                                    {(task.comments ?? []).map(c => (
                                        <div key={c.id} className="flex gap-2.5">
                                            <span className="w-7 h-7 shrink-0 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                                                {c.author ? initials(c.author) : '?'}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs">
                                                    <span className="font-semibold text-slate-700">
                                                        {c.author ? fullName(c.author) : 'Unknown'}
                                                    </span>
                                                    <span className="text-slate-400 ml-2">
                                                        {new Date(c.created_at).toLocaleString()}
                                                    </span>
                                                </p>
                                                <p className="text-sm text-slate-600 whitespace-pre-wrap break-words">{c.body}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex items-end gap-2 mt-3">
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={2}
                                        placeholder="Write a comment…"
                                        className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-primary-500"
                                    />
                                    <button
                                        onClick={postComment}
                                        disabled={isPosting || !comment.trim()}
                                        className="p-2 rounded-lg bg-primary-600 text-white disabled:opacity-40 hover:bg-primary-700 transition-colors"
                                    >
                                        {isPosting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                                    </button>
                                </div>
                            </Field>

                            <Field label="History" icon={<Clock size={12} />}>
                                <ul className="space-y-2">
                                    {history.length === 0 && (
                                        <li className="text-xs text-slate-400">No activity recorded</li>
                                    )}
                                    {history.map(entry => (
                                        <li key={entry.id} className="text-xs text-slate-500 flex gap-2">
                                            <span className="text-slate-300 shrink-0">•</span>
                                            <span>
                                                <span className="font-semibold text-slate-700">
                                                    {entry.actor ? fullName(entry.actor) : 'System'}
                                                </span>{' '}
                                                {describeEntry(entry)}
                                                <span className="text-slate-300 ml-1.5">
                                                    {new Date(entry.created_at).toLocaleString()}
                                                </span>
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </Field>
                        </div>

                        <footer className="flex items-center justify-between gap-3 px-6 py-3 border-t border-slate-100 shrink-0">
                            <button
                                onClick={() => run(
                                    () => tasksService.setArchived(task.id, !task.is_archived),
                                    'Failed to archive task',
                                )}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
                            >
                                {task.is_archived
                                    ? <><ArchiveRestore size={14} /> Restore</>
                                    : <><Archive size={14} /> Archive</>}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700"
                            >
                                <Trash2 size={14} /> Delete
                            </button>
                        </footer>
                    </>
                )}
            </aside>
        </div>
    );
}

function Field({ label, icon, children }: {
    label: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                {icon} {label}
            </p>
            {children}
        </div>
    );
}
