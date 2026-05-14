'use client';

import {
    Building2,
    GraduationCap,
    Globe2,
    LayoutGrid,
    Settings
} from 'lucide-react';
import { useVertical, VerticalType } from '../../contexts/VerticalContext';

export function VerticalSwitcher() {
    const { activeVertical, setActiveVertical, enabledVerticals } = useVertical();

    const verticals = [
        { id: 'core', label: 'Dashboard', icon: LayoutGrid, color: 'text-primary-600', activeBg: 'bg-primary-50' },
        { id: 'office', label: 'Office', icon: Building2, color: 'text-indigo-600', activeBg: 'bg-indigo-50' },
        { id: 'campus', label: 'Campus', icon: GraduationCap, color: 'text-emerald-600', activeBg: 'bg-emerald-50' },
        { id: 'network', label: 'Network', icon: Globe2, color: 'text-rose-600', activeBg: 'bg-rose-50' },
    ];

    return (
        <div className="flex flex-col items-center w-16 py-6 bg-white border-r border-slate-200 z-30 h-full">
            <div className="mb-8">
                <div className="w-10 h-10 bg-slate-900 rounded-none flex items-center justify-center shadow-lg shadow-slate-200">
                    <span className="text-white font-black text-xl">D</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-5 w-full px-2">
                {verticals.map((v) => {
                    if (!enabledVerticals.includes(v.id as VerticalType) && v.id !== 'core') return null;

                    const Icon = v.icon;
                    const isActive = activeVertical === v.id;

                    return (
                        <button
                            key={v.id}
                            onClick={() => setActiveVertical(v.id as VerticalType)}
                            className={`
                                group relative w-12 h-12 rounded-none flex items-center justify-center transition-all duration-200 mx-auto
                                ${isActive ? `${v.activeBg} border border-current border-opacity-20` : 'hover:bg-slate-50 text-slate-400 hover:text-slate-900'}
                            `}
                            title={v.label}
                        >
                            <Icon
                                size={22}
                                className={`transition-colors duration-200 ${isActive ? v.color : 'text-slate-400 group-hover:text-slate-900'}`}
                            />

                            {/* Active Indicator - SHARP */}
                            {isActive && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900" />
                            )}

                            {/* Tooltip (Doptor Style) */}
                            <div className="absolute left-full ml-4 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                                {v.label}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-auto px-2">
                <button
                    className="w-12 h-12 rounded-none flex items-center justify-center hover:bg-slate-50 text-slate-400 hover:text-slate-900 transition-colors mx-auto border border-transparent hover:border-slate-100"
                    title="Settings"
                >
                    <Settings size={20} />
                </button>
            </div>
        </div>
    );
}
