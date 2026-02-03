"use client";

import { TaskList } from '@/features/tasks/TaskList';
import { TaskDetail } from '@/features/tasks/TaskDetail';

export default function TasksPage() {
    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            <div className="flex-1 min-w-0">
                <TaskList />
            </div>

            {/* Split View for Desktop */}
            <div className="hidden lg:block w-[450px] xl:w-[500px] border-l border-slate-200 pl-6 h-full">
                <TaskDetail />
            </div>
        </div>
    );
}
