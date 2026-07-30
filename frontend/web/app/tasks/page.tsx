"use client";

import { useEffect, useState } from 'react';
import { LayoutGrid, Table2 } from 'lucide-react';
import { TaskKanban } from '@/features/tasks/TaskKanban';
import { TaskTable } from '@/features/tasks/TaskTable';

type TaskView = 'board' | 'table';

const STORAGE_KEY = 'doptor.tasks.view';

/**
 * The two views answer different questions — "what is everyone working on right
 * now" (board) vs "find me these specific tasks" (table) — so the choice is
 * remembered per browser rather than reset on every visit.
 *
 * The initial render is always the board: reading localStorage during render
 * would make the server and client markup disagree and hydrate mismatched. The
 * stored preference is applied in an effect, after mount.
 */
export default function TasksPage() {
    const [view, setView] = useState<TaskView>('board');

    useEffect(() => {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored === 'table' || stored === 'board') setView(stored);
    }, []);

    const choose = (next: TaskView) => {
        setView(next);
        window.localStorage.setItem(STORAGE_KEY, next);
    };

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex justify-end shrink-0 mb-2">
                <div className="inline-flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                    <ViewButton
                        active={view === 'board'}
                        onClick={() => choose('board')}
                        icon={<LayoutGrid size={14} />}
                        label="Board"
                    />
                    <ViewButton
                        active={view === 'table'}
                        onClick={() => choose('table')}
                        icon={<Table2 size={14} />}
                        label="Table"
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0">
                {view === 'board' ? <TaskKanban /> : <TaskTable />}
            </div>
        </div>
    );
}

function ViewButton({ active, onClick, icon, label }: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            aria-pressed={active}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-colors ${active
                ? 'bg-primary-600 text-white'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
        >
            {icon} {label}
        </button>
    );
}
