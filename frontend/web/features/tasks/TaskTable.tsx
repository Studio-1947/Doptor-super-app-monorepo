"use client";

import { useCallback, useEffect, useState } from 'react';
import {
    Plus, Search, Archive, ChevronLeft, ChevronRight,
    ArrowUpDown, ArrowUp, ArrowDown, MessageSquare,
} from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { toast } from 'sonner';
import {
    tasksService, Task, TaskStatus, TaskPriority, TaskSortField,
    TaskLabel, CreateTaskPayload,
} from '@/services/tasks.service';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailDrawer } from './TaskDetailDrawer';
import { initials, displayName } from '@/lib/display';

/**
 * The table counterpart to the kanban board.
 *
 * Where the board deliberately loads everything at once (pagination inside a
 * column reads as missing data), this view is the one that actually uses the
 * server's filtering, sorting and pagination — all of which `findAll` has
 * supported since Phase 2 with nothing calling it. Filters are server-side
 * here on purpose: a client-side filter over one page would silently only
 * search the rows that happen to be loaded.
 */

const PAGE_SIZE = 25;

const STATUS_LABELS: Record<TaskStatus, string> = {
    'todo': 'To Do',
    'in-progress': 'In Progress',
    'review': 'Review',
    'done': 'Done',
};

const statusStyles: Record<TaskStatus, string> = {
    'todo': 'bg-slate-100 text-slate-700 border-slate-200',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
    'review': 'bg-orange-100 text-orange-700 border-orange-200',
    'done': 'bg-success-100 text-success-700 border-success-200',
};

const priorityStyles: Record<TaskPriority, string> = {
    urgent: 'bg-red-100 text-red-700 border-red-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    low: 'bg-slate-100 text-slate-700 border-slate-200',
};

const COLUMNS: { key: TaskSortField | null; label: string; className?: string }[] = [
    { key: 'number', label: 'Ref', className: 'w-24' },
    { key: null, label: 'Title' },
    { key: null, label: 'Status', className: 'w-32' },
    { key: 'priority', label: 'Priority', className: 'w-28' },
    { key: null, label: 'Assignees', className: 'w-32' },
    { key: 'due_date', label: 'Due', className: 'w-28' },
    { key: 'updated_at', label: 'Updated', className: 'w-28' },
];

export function TaskTable() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [status, setStatus] = useState<TaskStatus | ''>('');
    const [priority, setPriority] = useState<TaskPriority | ''>('');
    const [labelId, setLabelId] = useState('');
    const [showArchived, setShowArchived] = useState(false);
    const [sort, setSort] = useState<TaskSortField>('updated_at');
    const [order, setOrder] = useState<'asc' | 'desc'>('desc');

    const [labels, setLabels] = useState<TaskLabel[]>([]);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [openTaskId, setOpenTaskId] = useState<string | null>(null);

    // Debounced so typing doesn't fire a request per keystroke against the
    // server-side ILIKE search.
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    // Any filter change invalidates the current page number — staying on page 4
    // of a newly-filtered set usually lands on nothing at all.
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, status, priority, labelId, showArchived, sort, order]);

    const loadTasks = useCallback(() => {
        setLoading(true);
        tasksService
            .list({
                topLevelOnly: true,
                includeArchived: showArchived,
                search: debouncedSearch || undefined,
                status: status || undefined,
                priority: priority || undefined,
                labelId: labelId || undefined,
                sort,
                order,
                page,
                limit: PAGE_SIZE,
            })
            .then((res) => { setTasks(res.data); setTotal(res.total); })
            .catch(() => toast.error('Failed to load tasks'))
            .finally(() => setLoading(false));
    }, [debouncedSearch, status, priority, labelId, showArchived, sort, order, page]);

    useEffect(() => { loadTasks(); }, [loadTasks]);

    useEffect(() => {
        tasksService.listLabels().then(setLabels).catch(() => setLabels([]));
    }, []);

    const handleCreateTask = async (payload: CreateTaskPayload) => {
        await tasksService.create(payload);
        loadTasks();
    };

    const toggleSort = (field: TaskSortField) => {
        if (sort === field) {
            setOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        } else {
            setSort(field);
            setOrder('desc');
        }
    };

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
    const lastRow = Math.min(page * PAGE_SIZE, total);

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Task Table</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">Filter, sort and page through every task</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-full sm:w-64"
                        />
                    </div>
                    <Button variant="primary" onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
                        <Plus size={18} /> New Task
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
                <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus | '')}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                    <option value="">All statuses</option>
                    {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                </select>

                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority | '')}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                    <option value="">All priorities</option>
                    {(['urgent', 'high', 'medium', 'low'] as TaskPriority[]).map((p) => (
                        <option key={p} value={p} className="capitalize">{p}</option>
                    ))}
                </select>

                <select
                    value={labelId}
                    onChange={(e) => setLabelId(e.target.value)}
                    className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                    <option value="">All labels</option>
                    {labels.map((l) => (
                        <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                </select>

                <button
                    onClick={() => setShowArchived((v) => !v)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${showArchived
                        ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                    <Archive size={13} /> {showArchived ? 'Archived shown' : 'Archived hidden'}
                </button>

                <span className="ml-auto text-xs text-slate-400 dark:text-slate-400">
                    {loading ? 'Loading…' : total === 0 ? 'No tasks' : `${firstRow}–${lastRow} of ${total}`}
                </span>
            </div>

            <Card className="flex-1 overflow-auto p-0">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 z-10">
                        <tr>
                            {COLUMNS.map((col) => (
                                <th
                                    key={col.label}
                                    aria-sort={col.key
                                        ? (sort === col.key ? (order === 'asc' ? 'ascending' : 'descending') : 'none')
                                        : undefined}
                                    className={`px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ${col.className ?? ''}`}
                                >
                                    {col.key ? (
                                        <button
                                            onClick={() => toggleSort(col.key as TaskSortField)}
                                            className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                                        >
                                            {col.label}
                                            {sort === col.key
                                                ? (order === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
                                                : <ArrowUpDown size={11} className="opacity-40" />}
                                        </button>
                                    ) : col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100 dark:border-slate-800">
                                    <td colSpan={COLUMNS.length} className="px-4 py-3">
                                        <div className="h-5 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                                    </td>
                                </tr>
                            ))
                        ) : tasks.length === 0 ? (
                            <tr>
                                <td colSpan={COLUMNS.length} className="px-4 py-16 text-center">
                                    <p className="text-sm text-slate-500 dark:text-slate-400">No tasks match these filters.</p>
                                </td>
                            </tr>
                        ) : (
                            tasks.map((task) => (
                                <tr
                                    key={task.id}
                                    onClick={() => setOpenTaskId(task.id)}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={`Open ${task.reference ?? 'task'}: ${task.title}`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            setOpenTaskId(task.id);
                                        }
                                    }}
                                    className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${task.is_archived ? 'opacity-60' : ''}`}
                                >
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-400 whitespace-nowrap">
                                            {task.reference ?? '—'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                                {task.title}
                                            </span>
                                            {(task.comments?.length ?? 0) > 0 && (
                                                <span className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 shrink-0">
                                                    <MessageSquare size={11} />{task.comments!.length}
                                                </span>
                                            )}
                                        </div>
                                        {task.labels.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {task.labels.map((l) => (
                                                    <span
                                                        key={l.id}
                                                        className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                                                        style={{ backgroundColor: `${l.color}22`, color: l.color }}
                                                    >
                                                        {l.name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-2 py-1 rounded-full border ${statusStyles[task.status]}`}>
                                            {STATUS_LABELS[task.status]}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-block whitespace-nowrap text-[10px] font-bold px-2 py-1 rounded-full border capitalize ${priorityStyles[task.priority]}`}>
                                            {task.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex -space-x-1.5">
                                            {task.assignees.slice(0, 3).map((a) => (
                                                <span
                                                    key={a.id}
                                                    title={displayName(a)}
                                                    className="w-6 h-6 rounded-full bg-slate-100 border border-white text-slate-600 flex items-center justify-center text-[9px] font-bold"
                                                >
                                                    {initials(a)}
                                                </span>
                                            ))}
                                            {task.assignees.length > 3 && (
                                                <span className="w-6 h-6 rounded-full bg-slate-200 border border-white text-slate-600 flex items-center justify-center text-[9px] font-bold">
                                                    +{task.assignees.length - 3}
                                                </span>
                                            )}
                                            {task.assignees.length === 0 && (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                        {new Date(task.updated_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </Card>

            {/* Pagination */}
            <div className="flex items-center justify-between gap-3 mt-4 shrink-0">
                <span className="text-xs text-slate-400">
                    Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1 || loading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none hover:border-primary-500 transition-colors"
                    >
                        <ChevronLeft size={14} /> Previous
                    </button>
                    <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page >= totalPages || loading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none hover:border-primary-500 transition-colors"
                    >
                        Next <ChevronRight size={14} />
                    </button>
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
                onChanged={() => loadTasks()}
                onDeleted={() => { setOpenTaskId(null); loadTasks(); }}
            />
        </div>
    );
}
