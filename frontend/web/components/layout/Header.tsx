"use client";

import { Building2, Shield } from 'lucide-react';
import { useRole } from '@/features/auth/RoleContext';
import { useAuth } from '@/contexts/AuthContext';
import { useVertical, verticalTheme } from '@/contexts/VerticalContext';
import Image from 'next/image';
import { ThemeToggle } from '../ui/ThemeToggle';
import { NotificationBell } from './NotificationBell';

// SharpButton implementation to avoid shared component dependency issues during build
const SharpButton = ({ 
    children, 
    onClick, 
    className = "", 
    variant = "secondary" 
}: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    className?: string;
    variant?: "primary" | "secondary" | "ghost" 
}) => {
    const baseStyles = "inline-flex items-center justify-center rounded-none font-bold transition-all active:scale-95 text-xs uppercase tracking-widest";
    const variants = {
        primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-md",
        secondary: "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700",
        ghost: "bg-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800"
    };
    
    return (
        <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

export function Header() {
    const { role } = useRole();
    const { user } = useAuth();
    const { activeVertical, organisation } = useVertical();
    const theme = verticalTheme[activeVertical];

    const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'User';
    const avatarName = displayName === user?.email ? (user?.email?.split('@')[0] ?? 'User') : displayName;

    return (
        <header className="h-16 px-4 md:px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10">
            {/*
              Organisation identity, not a switcher.
              This was a <button> with a ChevronDown and no onClick — clicking it
              did nothing on every authenticated page in the product. The chevron
              was the worse half: `users.organisation_id` is a single non-null
              column and there is no membership join table, so a user belongs to
              exactly one organisation and there is nothing to switch to. It
              advertised a capability the data model cannot support.
              Now a plain element that states which organisation you are in.
            */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 p-2">
                    <div className={`w-8 h-8 rounded-none flex items-center justify-center border ${theme.bgClass} ${theme.textClass} ${theme.borderClass}`}>
                        <Building2 size={18} />
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-black text-slate-900 dark:text-white leading-none uppercase tracking-tight">
                            {organisation?.name ?? '...'}
                        </p>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${theme.textClass}`}>
                            {activeVertical === 'core' ? 'Organisation' : theme.label}
                        </p>
                    </div>
                </div>
            </div>

            {/*
              A global search box lived here. It had no `value`, no `onChange`,
              no `onKeyDown` and no surrounding form: you could type "SEARCH
              DOPTOR OS..." into it on every authenticated page and nothing
              whatsoever happened. There is no global search endpoint to wire it
              to — the searches that exist are per-page and reach the server on
              their own (see the registry search in `page-shell.spec.ts`).

              This is the same defect M-17 removed from `ReadyUI`, and it
              survived that sweep twice over: M-17 only looked at the page shell,
              and the guard it left behind asserts `getByRole('searchbox')` is
              absent — which never matched this, because `type="text"` has the
              role `textbox`. Removed rather than stubbed, per the M-17 rule
              that a control must do something or not be shipped.
            */}

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-3">
                {/* Theme Toggle */}
                <ThemeToggle />

                <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

                {/* Role Badge - SHARP */}
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-primary-900 dark:bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.15em]">
                    <Shield size={12} fill="currentColor" />
                    <span>{role.replace('_', ' ')}</span>
                </div>

                <NotificationBell />

                {/* Avatar is the ONLY thing that can be round, but let's make it square for Doptor OS vibe */}
                <div className="w-8 h-8 rounded-none bg-slate-900 dark:bg-slate-800 overflow-hidden border border-slate-900 dark:border-slate-700 relative">
                    <Image
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=0f172a&color=fff&bold=true`}
                        alt="Profile"
                        fill
                        className="object-cover"
                    />
                </div>
            </div>
        </header>
    );
}
