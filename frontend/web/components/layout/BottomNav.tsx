"use client";

import { Menu } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useRole } from '@/features/auth/RoleContext';
import { useVertical } from '@/contexts/VerticalContext';
import { verticalMenus } from './Sidebar';

const MAX_TABS = 4;

export function BottomNav() {
    const pathname = usePathname();
    const { role } = useRole();
    const { activeVertical } = useVertical();

    const verticalSpecific = verticalMenus[activeVertical];
    const roleSpecific = verticalSpecific[role] || [];
    const commonMenus = verticalSpecific['all'] || [];
    const menuItems = [...commonMenus, ...roleSpecific].slice(0, MAX_TABS);

    const tabs = [
        ...menuItems,
        { icon: Menu, label: 'Menu', href: '/menu' },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-6 py-2 z-50 md:hidden pb-4 transition-colors">
            <div className="flex items-center justify-between">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={`flex flex-col items-center gap-1 p-2 relative transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                 }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="bottomNavActive"
                                    className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary-500 dark:bg-primary-400 rounded-none"
                                />
                            )}
                            <tab.icon size={20} className={isActive ? 'animate-pulse' : ''} />
                            <span className={`text-[10px] uppercase tracking-widest ${isActive ? 'font-black' : 'font-bold'}`}>{tab.label}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
