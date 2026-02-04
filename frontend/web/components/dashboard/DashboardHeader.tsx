import { Bell, Search, Menu } from 'lucide-react';

interface DashboardHeaderProps {
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export function DashboardHeader({ title, subtitle, action }: DashboardHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{title}</h1>
                {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
            </div>

            {action && (
                <div className="flex items-center gap-3">
                    {action}
                </div>
            )}
        </div>
    );
}
