"use client";

import { Card, Button } from '@doptor/shared';
import { Search, Filter, Plus, Calendar, Flag, CheckCircle2, Clock } from 'lucide-react';
import { useState } from 'react';

const TASKS = [
    { id: 1, title: 'Update homepage banner', project: 'Marketing Website', priority: 'High', due: 'Today', status: 'In Progress' },
    { id: 2, title: 'Fix navigation bug on mobile', project: 'App Core', priority: 'Critical', due: 'Tomorrow', status: 'Pending' },
    { id: 3, title: 'Prepare Q3 financial report', project: 'Finance', priority: 'Medium', due: 'Next Week', status: 'Todo' },
    { id: 4, title: 'Interview candidates for Design role', project: 'HR', priority: 'High', due: 'Sep 24', status: 'Todo' },
    { id: 5, title: 'Update documentation', project: 'Platform', priority: 'Low', due: 'Sep 28', status: 'Done' },
];

export function TaskList() {
    const [activeTab, setActiveTab] = useState('my_tasks');

    return (
        <div className="flex flex-col h-full">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex bg-slate-100 rounded-lg p-1 w-full sm:w-auto">
                    <button
                        onClick={() => setActiveTab('my_tasks')}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'my_tasks' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        My Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('assigned')}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'assigned' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Assigned
                    </button>
                    <button
                        onClick={() => setActiveTab('completed')}
                        className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'completed' ? 'bg-white text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Completed
                    </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
                        />
                    </div>
                    <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500">
                        <Filter size={18} />
                    </button>
                    <Button variant="primary" size="sm" className="gap-2">
                        <Plus size={16} />
                        <span>New Task</span>
                    </Button>
                </div>
            </div>

            {/* Task List */}
            <div className="space-y-3">
                {TASKS.map((task) => (
                    <Card key={task.id} className="p-4 hover:shadow-md transition-all cursor-pointer group border-slate-200 hover:border-primary-200">
                        <div className="flex items-start gap-4">
                            <button className="mt-1 text-slate-300 hover:text-primary-600 transition-colors">
                                <CheckCircle2 size={20} />
                            </button>
                            <div className="flex-1">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="font-medium text-slate-900 group-hover:text-primary-600 transition-colors">{task.title}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-xs text-slate-500">{task.project}</span>
                                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                            <Badge priority={task.priority} />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex -space-x-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-indigo-700">JD</div>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                                            <Calendar size={12} />
                                            <span>{task.due}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

function Badge({ priority }: { priority: string }) {
    const styles = {
        'Critical': 'bg-red-50 text-red-700 border-red-100',
        'High': 'bg-orange-50 text-orange-700 border-orange-100',
        'Medium': 'bg-blue-50 text-blue-700 border-blue-100',
        'Low': 'bg-slate-50 text-slate-600 border-slate-100',
    }[priority] || 'bg-slate-50 text-slate-600';

    return (
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${styles}`}>
            {priority}
        </span>
    );
}
