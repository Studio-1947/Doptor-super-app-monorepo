"use client";

import { useEffect, useState } from 'react';
import {
    Plus,
    MoreHorizontal,
    Calendar,
    Search,
    Filter
} from 'lucide-react';
import { Card, Button } from '@doptor/shared';
import { toast } from 'sonner';
import { tasksService, Task, TaskStatus, CreateTaskPayload } from '@/services/tasks.service';
import { CreateTaskDialog } from './CreateTaskDialog';

export function TaskKanban() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const loadTasks = () => {
        tasksService
            .list()
            .then(setTasks)
            .catch(() => toast.error('Failed to load tasks'))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadTasks();
    }, []);

    const columns: { id: TaskStatus; title: string; color: string }[] = [
        { id: 'todo', title: 'To Do', color: 'bg-slate-500' },
        { id: 'in-progress', title: 'In Progress', color: 'bg-blue-500' },
        { id: 'review', title: 'Review', color: 'bg-orange-500' },
        { id: 'done', title: 'Done', color: 'bg-emerald-500' }
    ];

    const getPriorityColor = (priority: Task['priority']) => {
        switch (priority) {
            case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
            case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'medium': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const handleCreateTask = async (payload: CreateTaskPayload) => {
        const newTask = await tasksService.create(payload);
        setTasks(prev => [newTask, ...prev]);
        setIsCreateModalOpen(false);
    };

    const moveTask = async (taskId: string, newStatus: TaskStatus) => {
        const previous = tasks;
        setTasks(tasks.map(t =>
            t.id === taskId ? { ...t, status: newStatus } : t
        ));
        try {
            await tasksService.updateStatus(taskId, newStatus);
        } catch {
            toast.error('Failed to update task status');
            setTasks(previous);
        }
    };

    const filteredTasks = tasks.filter(t =>
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Task Board</h1>
                    <p className="text-slate-500 mt-1">Manage and track project tasks</p>
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
                    <Button variant="secondary" className="hidden sm:flex items-center gap-2">
                        <Filter size={16} /> Filter
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Plus size={18} /> New Task
                    </Button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden">
                <div className="h-full flex gap-6 min-w-[1000px] pb-4">
                    {columns.map(column => (
                        <div key={column.id} className="flex-1 flex flex-col min-w-[280px] bg-slate-50 rounded-xl border border-slate-200 h-full">
                            {/* Column Header */}
                            <div className="p-4 flex items-center justify-between border-b border-slate-200 shrink-0">
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                    <span className="font-semibold text-slate-900">{column.title}</span>
                                    <span className="text-xs text-slate-500 font-medium bg-slate-200 px-2 py-0.5 rounded-full">
                                        {filteredTasks.filter(t => t.status === column.id).length}
                                    </span>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <MoreHorizontal size={16} />
                                </button>
                            </div>

                            {/* Task List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-thin">
                                {loading ? (
                                    Array.from({ length: 2 }).map((_, i) => (
                                        <div key={i} className="h-28 rounded-lg bg-slate-100 animate-pulse" />
                                    ))
                                ) : filteredTasks
                                    .filter(task => task.status === column.id)
                                    .map(task => (
                                        <Card
                                            key={task.id}
                                            className="p-4 border-slate-200 hover:shadow-md transition-shadow cursor-pointer bg-white group"
                                        >
                                            {/* Priority & Options */}
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>

                                                {/* Status Mover (Simulated Drag/Drop) */}
                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <select
                                                        value={task.status}
                                                        onChange={(e) => moveTask(task.id, e.target.value as TaskStatus)}
                                                        className="text-xs border border-slate-200 rounded px-1 py-0.5 focus:outline-none"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        {columns.map(c => (
                                                            <option key={c.id} value={c.id}>{c.title}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <h3 className="font-semibold text-slate-900 mb-1 leading-snug">{task.title}</h3>
                                            {task.description && (
                                                <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                                            )}

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-1.5 mb-3">
                                                {task.tags.map(tag => (
                                                    <span key={tag} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Footer */}
                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                                <div className="flex items-center gap-2">
                                                    {task.due_date && (
                                                        <span className={`text-[10px] font-medium ${new Date(task.due_date) < new Date() ? 'text-red-500' : 'text-slate-400'
                                                            }`}>
                                                            {new Date(task.due_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Assignee Avatar */}
                                                {task.assignee && (
                                                    <div
                                                        className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold border border-indigo-200"
                                                        title={`${task.assignee.first_name} ${task.assignee.last_name}`}
                                                    >
                                                        {task.assignee.first_name?.[0]}{task.assignee.last_name?.[0]}
                                                    </div>
                                                )}
                                            </div>
                                        </Card>
                                    ))}
                                {!loading && filteredTasks.filter(t => t.status === column.id).length === 0 && (
                                    <p className="text-xs text-slate-400 text-center py-6">No tasks here</p>
                                )}
                            </div>

                            {/* Add Button Footer */}
                            <button
                                onClick={() => setIsCreateModalOpen(true)}
                                className="p-3 m-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center gap-2 transition-colors"
                            >
                                <Plus size={16} /> Add Task
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <CreateTaskDialog
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateTask}
            />
        </div>
    );
}
