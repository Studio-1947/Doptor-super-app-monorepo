"use client";

import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { VerticalSwitcher } from './VerticalSwitcher';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
            {/* Context Switcher Rail */}
            <div className="hidden md:block flex-shrink-0 z-30">
                <VerticalSwitcher />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block flex-shrink-0 w-60 z-20">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <Header />
                <main className="flex-1 p-4 md:p-6 overflow-y-auto scrollbar-thin pb-20 md:pb-6">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
