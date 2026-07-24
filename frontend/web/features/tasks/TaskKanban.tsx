"use client";

import { useCallback, useEffect, useState } from 'react';
import { Plus, Search, Archive, MessageSquare, CornerDownRight } from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { toast } from 'sonner';
import { tasksService, Task, TaskStatus, CreateTaskPayload } from '@/services/tasks.service';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailDrawer } from './TaskDetailDrawer';

const COLUMNS: { id: TaskStatus; title: string; color: string }[] = [
    { id: 'todo', title: 'To Do', color: 'bg-slate-500' },
    { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500' },
    { id: 'review', title: 'Review', color: 'bg-orange-500' },
    { id: 'done', title: 'Done', color: 'bg-emerald-500' },
];

// A board shows every open task at once, so request the server's max page
// rather than paginating — pagination on a kanban column reads as missing data.
const BOARD_LIMIT = 200;

const priorityStyles: Record<Task['priority'], string> = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
};

const initials = (u: { first_name?: string; last_name?: string }) =>
    `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase() || '?';

export function TaskKanban() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [openTaskId, setOpenTaskId] = useState<string | null>(null);

    const loadTasks = useCallback(() => {
        setLoading(true);
        tasksService
            .list({
                // Subtasks are shown inside their parent's drawer, not as board cards.
                topLevelOnly: true,
                includeArchived: showArchived,
                limit: BOARD_LIMIT,
            })
            .then((res) => setTasks(res.data))
            .catch(() => toast.error('Failed to load tasks'))
            .finally(() => setLoading(false));
    }, [showArchived]);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    const handleCreateTask = async (payload: CreateTaskPayload) => {
        const newTask = await tasksService.create(payload);
        setTasks(prev => [newTask, ...prev]);
    };

    const moveTask = async (taskId: string, newStatus: TaskStatus) => {
        const previous = tasks;
        setTasks(tasks.map(t => (t.id === taskId ? { ...t, status: newStatus } : t)));
        try {
            const updated = await tasksService.updateStatus(taskId, newStatus);
            setTasks(prev => prev.map(t => (t.id === taskId ? updated : t)));
        } catch {
            toast.error('Failed to update task status');
            setTasks(previous);
        }
    };

    // Search is applied client-side across the loaded board so filtering stays
    // instant; the server-side `search` filter is used by the list view instead.
    const term = searchQuery.trim().toLowerCase();
    const filteredTasks = term
        ? tasks.filter(t =>
            t.title.toLowerCase().includes(term) ||
            t.reference?.toLowerCase().includes(term) ||
            t.labels.some(l => l.name.toLowerCase().includes(term)))
        : tasks;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
                    <p className="text-slate-500 mt-1">Manage and track your team&apos;s work</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full sm:w-64"
                        />
                    </div>
                    <Button
                        variant="secondary"
                        onClick={() => setShowArchived(v => !v)}
                        className="hidden sm:flex items-center gap-2"
                    >
                        <Archive size={16} /> {showArchived ? 'Hide archived' : 'Show archived'}
                    </Button>
                    <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
                        <Plus size={18} /> New Task
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="h-full flex gap-6 min-w-[1000px] pb-4">
                    {COLUMNS.map(column => {
                        const columnTasks = filteredTasks.filter(t => t.status === column.id);
                        return (
                            <div key={column.id} className="flex-1 flex flex-col min-w-[280px] bg-slate-50 rounded-xl border border-slate-200 h-full">
                                <div className="p-4 flex items-center justify-between border-b border-slate-200 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                        <span className="font-semibold text-slate-900">{column.title}</span>
                                        <span className="text-xs text-slate-500 font-medium bg-slate-200 px-2 py-0.5 rounded-full">
                                            {columnTasks.length}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                                    {loading ? (
                                        Array.from({ length: 2 }).map((_, i) => (
                                            <div key={i} className="h-28 rounded-lg bg-slate-100 animate-pulse" />
                                        ))
                                    ) : columnTasks.map(task => (
                                        // Card is a presentational primitive with no onClick, so the
                                        // click target is a wrapper rather than a change to the shared component.
                                        <div key={task.id} onClick={() => setOpenTaskId(task.id)} role="button" tabIndex={0}
                                            onKeyDown={(e) => { if (e.key === 'Enter') setOpenTaskId(task.id); }}>
                                        <Card
                                            className={`p-4 border-slate-200 hover:shadow-md transition-shadow cursor-pointer bg-white group ${task.is_archived ? 'opacity-60' : ''}`}
                                        >
                                            <div className="flex items-start justify-between mb-2 gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {task.reference && (
                                                        <span className="text-[10px] font-black text-primary-600 tracking-tight shrink-0">
                                                            {task.reference}
                                                        </span>
                                                    )}
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0 ${priorityStyles[task.priority]}`}>
                                                        {task.priority}
                                                    </span>
                                                </div>

                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                                                        className="text-xs border border-slate-200 rounded px-1 py-0.5 focus:outline-none"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {COLUMNS.map(c => (
                                                            <option key={c.id} value={c.id}>{c.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <h3 className="font-semibold text-slate-900 mb-1 leading-snug">{task.title}</h3>
                                            {task.description && (
                                                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                                            )}

                                            {task.labels.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mb-3">
                                                    {task.labels.map(label => (
                                                        <span
                                                            key={label.id}
                                                            className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
                                                            style={{
                                                                color: label.color,
                                                                borderColor: label.color,
                                                                backgroundColor: `${label.color}14`,
                                                            }}
                                                        >
                                                            {label.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                <div className="flex items-center gap-3 text-slate-400">
                                                    {task.due_date && (
                                                        <span className={`text-[10px] font-medium ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-500' : 'text-slate-400'}`}>
                                                            {new Date(task.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                    {task.subtasks && task.subtasks.length > 0 && (
                                                        <span className="text-[10px] flex items-center gap-0.5">
                                                            <CornerDownRight size={11} /> {task.subtasks.length}
                                                        </span>
                                                    )}
                                                    {task.comments && task.comments.length > 0 && (
                                                        <span className="text-[10px] flex items-center gap-0.5">
                                                            <MessageSquare size={11} /> {task.comments.length}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex -space-x-1.5">
                                                    {task.assignees.slice(0, 3).map(a => (
                                                        <div
                                                            key={a.id}
                                                            className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-white ring-1 ring-indigo-200"
                                                            title={`${a.first_name} ${a.last_name}`}
                                                        >
                                                            {initials(a)}
                                                        </div>
                                                    ))}
                                                    {task.assignees.length > 3 && (
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-bold border border-white ring-1 ring-slate-200">
                                                            +{task.assignees.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </Card>
                                        </div>
                                    ))}
                                    {!loading && columnTasks.length === 0 && (
                                        <p className="text-xs text-slate-400 text-center py-6">No tasks here</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setIsCreateOpen(true)}
                                    className="p-3 m-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Plus size={16} /> Add Task
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>

            <CreateTaskDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={handleCreateTask}
            />

            <TaskDetailDrawer
                taskId={openTaskId}
                onClose={() => setOpenTaskId(null)}
                onChanged={(updated) => {
                    setTasks(prev => {
                        // An archived task drops off the board unless archived are shown.
                        if (updated.is_archived && !showArchived) {
                            return prev.filter(t => t.id !== updated.id);
                        }
                        return prev.map(t => (t.id === updated.id ? updated : t));
                    });
                }}
                onDeleted={(id) => setTasks(prev => prev.filter(t => t.id !== id))}
            />
        </div>
    );
}
