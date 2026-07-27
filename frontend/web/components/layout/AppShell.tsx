"use client";

import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { VerticalSwitcher } from './VerticalSwitcher';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { isPublicRoute } from '@/lib/routes';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    const pathname = usePathname();

    // Public pages render bare. The chrome is for signed-in users, and mounting
    // it on /login also mounted the notification bell, which immediately polled
    // an authenticated endpoint and 401'd. These pages are full-screen layouts
    // in their own right, so the shell only got in their way.
    if (isPublicRoute(pathname)) {
        return <>{children}</>;
    }

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
                    <RoleGuard>{children}</RoleGuard>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
