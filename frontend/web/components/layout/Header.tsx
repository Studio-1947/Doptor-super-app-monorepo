"use client";

import { Search, Bell, ChevronDown, Building2, Shield } from 'lucide-react';
import { Button } from '@doptor/shared';
import { useRole, UserRole } from '@/features/auth/RoleContext';
import Image from 'next/image';

export function Header() {
    const { role, setRole } = useRole();

    const roles: UserRole[] = ['super_admin', 'org_admin', 'manager', 'staff', 'student'];

    return (
        <header className="h-16 px-4 md:px-6 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-xl sticky top-0 z-10">
            {/* Left: Org Switcher */}
            <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 hover:bg-slate-50 p-2 rounded-lg transition-colors border border-transparent hover:border-slate-200">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600">
                        <Building2 size={18} />
                    </div>
                    <div className="hidden md:block text-left">
                        <p className="text-sm font-bold text-slate-900 leading-none">Acme Corp</p>
                        <p className="text-xs text-slate-500">Organisation</p>
                    </div>
                    <ChevronDown size={16} className="text-slate-400" />
                </button>
            </div>

            {/* Center: Search (Desktop) */}
            <div className="hidden md:flex items-center gap-4 w-96">
                <div className="relative w-full group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Search tasks, docs, people..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Right: Actions & Profile */}
            <div className="flex items-center gap-3">
                {/* Role Switcher (Dev Mode) */}
                <div className="hidden md:flex items-center gap-2 mr-2">
                    <select
                        value={role}
                        onChange={(e) => setRole(e.target.value as UserRole)}
                        className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-slate-50 text-slate-600 focus:outline-none focus:border-primary-500"
                    >
                        {roles.map(r => (
                            <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                {/* Role Badge */}
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-100 text-amber-700 text-xs font-semibold">
                    <Shield size={12} />
                    <span>{role.replace('_', ' ')}</span>
                </div>

                <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-lg hover:bg-slate-100">
                    <Bell size={20} />
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
                </button>

                <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-slate-300 relative">
                    <Image
                        src="https://ui-avatars.com/api/?name=John+Doe&background=random"
                        alt="Profile"
                        fill
                        className="object-cover"
                    />
                </div>
            </div>
        </header>
    );
}
