'use client';

import {
    Building2,
    GraduationCap,
    Globe2,
    LayoutGrid,
    Settings
} from 'lucide-react';
import { useVertical, VerticalType } from '../../contexts/VerticalContext';
// import { Tooltip } from './Tooltip'; // We might need to create a simple tooltip component or use title attribute

export function VerticalSwitcher() {
    const { activeVertical, setActiveVertical, enabledVerticals } = useVertical();

    const verticals = [
        { id: 'core', label: 'Dashboard', icon: LayoutGrid, color: 'text-gray-600', activeBg: 'bg-gray-100' },
        { id: 'office', label: 'Office', icon: Building2, color: 'text-blue-600', activeBg: 'bg-blue-50' },
        { id: 'campus', label: 'Campus', icon: GraduationCap, color: 'text-emerald-600', activeBg: 'bg-emerald-50' },
        { id: 'network', label: 'Network', icon: Globe2, color: 'text-purple-600', activeBg: 'bg-purple-50' },
    ];

    return (
        <div className="flex flex-col items-center w-16 py-4 bg-white border-r border-slate-200 z-30 h-screen sticky top-0">
            <div className="mb-6">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                    <span className="text-white font-bold text-xl">D</span>
                </div>
            </div>

            <div className="flex-1 flex flex-col gap-4 w-full px-2">
                {verticals.map((v) => {
                    if (!enabledVerticals.includes(v.id as VerticalType) && v.id !== 'core') return null;

                    const Icon = v.icon;
                    const isActive = activeVertical === v.id;

                    return (
                        <button
                            key={v.id}
                            onClick={() => setActiveVertical(v.id as VerticalType)}
                            className={`
                group relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                ${isActive ? `${v.activeBg} shadow-sm ring-1 ring-inset ring-black/5` : 'hover:bg-gray-50 text-gray-400 hover:text-gray-600'}
              `}
                            title={v.label}
                        >
                            <Icon
                                size={22}
                                className={`transition-colors duration-200 ${isActive ? v.color : 'text-slate-400 group-hover:text-slate-600'}`}
                            />

                            {/* Active Indicator */}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-slate-900 rounded-r-full -ml-3" />
                            )}

                            {/* Tooltip (Simple Hover) */}
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                                {v.label}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="mt-auto px-2">
                <button
                    className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-gray-50 text-slate-400 hover:text-slate-600 transition-colors"
                    title="Settings"
                >
                    <Settings size={22} />
                </button>
            </div>
        </div>
    );
}
