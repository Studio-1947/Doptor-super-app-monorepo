import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { VerticalSwitcher } from './VerticalSwitcher';

interface AppShellProps {
    children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
    return (
        <div className="flex min-h-screen bg-slate-50">
            {/* Context Switcher Rail */}
            <div className="hidden md:block">
                <VerticalSwitcher />
            </div>

            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
                    {children}
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <BottomNav />
        </div>
    );
}
