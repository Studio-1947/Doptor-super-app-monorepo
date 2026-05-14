"use client";

import { Search, Bell, ChevronDown, Building2, Shield } from 'lucide-react';
import { useRole, UserRole } from '@/features/auth/RoleContext';
import Image from 'next/image';

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
        secondary: "bg-white text-slate-700 hover:bg-slate-50 border border-slate-200",
        ghost: "bg-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50"
    };
    
    return (
        <button onClick={onClick} className={`${baseStyles} ${variants[variant]} ${className}`}>
            {children}
        </button>
    );
};

export function Header() {
    const { role, setRole } = useRole();

    const roles: UserRole[] = ['super_admin', 'org_admin', 'manager', 'staff', 'student'];

    return (
        <header className="h-16 px-4 md:px-6 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
            {/* Left: Org Switcher - SHARP */}
            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-none transition-colors border border-transparent hover:border-slate-200">
                    <div className="w-8 h-8 bg-primary-100 rounded-none flex items-center justify-center text-primary-600 border border-primary-200">
                        <Building2 size={18} />
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-black text-slate-900 leading-none uppercase tracking-tight">Acme Corp</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Organisation</p>
                    </div>
                    <ChevronDown size={14} className="text-slate-400" />
                </button>
            </div>

            {/* Center: Search (Desktop) - SHARP */}
            <div className="hidden md:flex items-center gap-4 w-96">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={16} />
                    <input
                        type="text"
                        placeholder="SEARCH DOPTOR OS..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-none py-2 pl-10 pr-4 text-[10px] font-black text-slate-900 focus:outline-none focus:ring-0 focus:border-primary-500 transition-all placeholder:text-slate-400 uppercase tracking-widest"
                    />
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-3">
                {/* Role Switcher (Dev Mode) - SHARP */}
                <div className="hidden md:flex items-center gap-2 mr-2">
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="text-[10px] font-black border border-slate-200 rounded-none px-2 py-1 bg-slate-50 text-slate-500 focus:outline-none focus:border-primary-500 uppercase tracking-widest"
                    >
                        {roles.map(r => (
                            <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                {/* Role Badge - SHARP */}
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-none bg-primary-900 text-white text-[10px] font-black uppercase tracking-[0.15em]">
                    <Shield size={12} fill="currentColor" />
                    <span>{role.replace('_', ' ')}</span>
                </div>

                <button className="relative p-2 text-slate-400 hover:text-primary-600 transition-colors rounded-none hover:bg-slate-50 border border-transparent hover:border-slate-100">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-none bg-primary-500"></span>
                </button>

                {/* Avatar is the ONLY thing that can be round, but let's make it square for Doptor OS vibe */}
                <div className="w-8 h-8 rounded-none bg-slate-900 overflow-hidden border border-slate-900 relative">
                    <Image
                        src={`https://ui-avatars.com/api/?name=John+Doe&background=0f172a&color=fff&bold=true`}
                        alt="Profile"
                        fill
                        className="object-cover"
                    />
                </div>
            </div>
        </header>
    );
}
