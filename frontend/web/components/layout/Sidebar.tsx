'use client';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, Bell, ChevronLeft, Menu, ClipboardList, CheckSquare, Calendar, BarChart3, Building2, Shield, FolderOpen } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useRole } from '@/features/auth/RoleContext';
import { useVertical, VerticalType } from '@/contexts/VerticalContext';
import { useAuth } from '@/contexts/AuthContext';
import { type VerticalMenu, menuFor } from './menuTypes';
// The single, deliberate seam between the two products: campus *navigation
// data* is composed in here so one Sidebar can serve either vertical. No
// campus component, service or page is imported anywhere outside `campus/` —
// `e2e/product-isolation.spec.ts` enforces that.
import { campusMenus } from '@/features/campus/campusMenus';

/**
 * Navigation per vertical.
 *
 * `core` and `office` are the shipping product and are defined here. `campus`
 * is imported from the campus feature and is **the only vertical with a
 * `student` role** — Office declares no student navigation at all, because an
 * office organisation has no students. The roles it really has are
 * Organisation Admin, Manager, Department Head, Staff, Auditor and HR Manager.
 *
 * The type is deliberately `Partial`, so neither product has to declare a role
 * belonging to the other just to satisfy it. See `menuTypes.ts`.
 */
export const verticalMenus: Record<VerticalType, VerticalMenu> = {
    core: {
        all: [],
        super_admin: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
            { icon: BarChart3, label: 'Analytics', href: '/analytics' },
            { icon: ClipboardList, label: 'Tasks', href: '/tasks' },
            { icon: FolderOpen, label: 'Documents', href: '/documents' },
            { icon: CheckSquare, label: 'Approvals', href: '/approvals' },
            { icon: Calendar, label: 'Attendance', href: '/attendance' },
            { icon: Settings, label: 'Settings', href: '/settings' },
        ],
        org_admin: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
            { icon: BarChart3, label: 'Analytics', href: '/analytics' },
            { icon: ClipboardList, label: 'Tasks', href: '/tasks' },
            { icon: FolderOpen, label: 'Documents', href: '/documents' },
            { icon: CheckSquare, label: 'Approvals', href: '/approvals' },
            { icon: Calendar, label: 'Attendance', href: '/attendance' },
            { icon: Settings, label: 'Settings', href: '/settings' },
        ],
        manager: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
            { icon: ClipboardList, label: 'Tasks', href: '/tasks' },
            { icon: FolderOpen, label: 'Documents', href: '/documents' },
            { icon: CheckSquare, label: 'Approvals', href: '/approvals' },
            { icon: Calendar, label: 'Attendance', href: '/attendance' },
            { icon: Settings, label: 'Settings', href: '/settings' },
        ],
        staff: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
            { icon: ClipboardList, label: 'Tasks', href: '/tasks' },
            { icon: FolderOpen, label: 'Documents', href: '/documents' },
            { icon: Calendar, label: 'Attendance', href: '/attendance' },
            { icon: Settings, label: 'Settings', href: '/settings' },
        ],
        // No `student` key: an office organisation has no students, and the
        // role cannot be reached here — `deriveLegacyRole` falls back to
        // `staff`.
    },
    office: {
        all: [],
        super_admin: [
            { icon: Building2, label: 'Office Admin', href: '/office/admin' },
            { icon: FileText, label: 'e-Dak Files', href: '/office/files' },
            { icon: Users, label: 'Employee Registry', href: '/office/registry' },
        ],
        org_admin: [
            { icon: Building2, label: 'Office Dashboard', href: '/office' },
            { icon: FileText, label: 'e-Dak Files', href: '/office/files' },
            { icon: Users, label: 'Staff Registry', href: '/office/registry' },
            { icon: BarChart3, label: 'Reports', href: '/office/reports' },
        ],
        manager: [
            { icon: FileText, label: 'My Files', href: '/office/files' },
            { icon: Users, label: 'Team', href: '/office/team' },
        ],
        staff: [
            { icon: FileText, label: 'My Files', href: '/office/files' },
        ],
        // No `student` key — see `core` above.
    },
    // Defined in the campus feature, deliberately not inlined here.
    campus: campusMenus,
};

const adminMenus = [
    { icon: Building2, label: 'Organisation', href: '/admin/settings' },
    { icon: Shield, label: 'Roles', href: '/admin/roles' },
    { icon: Users, label: 'Departments', href: '/admin/departments' },
];

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { role } = useRole();
    const { activeVertical } = useVertical();
    const { user } = useAuth();

    const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email || 'User';
    const initials = (
        [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('') ||
        user?.email?.[0] ||
        '?'
    ).toUpperCase();

    // Combine 'all' menus with role-specific menus for the active vertical
    const verticalSpecific = verticalMenus[activeVertical];
    const roleSpecific = menuFor(verticalSpecific, role);
    const commonMenus = verticalSpecific['all'] || [];

    let menuItems = [...commonMenus, ...roleSpecific];

    // Add Admin links if in Core vertical and user is admin
    if (activeVertical === 'core' && (role === 'super_admin' || role === 'org_admin')) {
        menuItems = [...menuItems, ...adminMenus];
    }

    return (
        <motion.div
            initial={{ width: 240 }}
            animate={{ width: collapsed ? 80 : 240 }}
            className="h-full bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col relative z-20 shadow-sm transition-all duration-300"
        >
            <div className="p-4 flex items-center justify-between">
                <AnimatePresence>
                    {!collapsed && (
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent capitalize"
                        >
                            {activeVertical === 'core' ? 'Doptor' : activeVertical}
                        </motion.h1>
                    )}
                </AnimatePresence>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    {collapsed ? <Menu size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center px-3 py-2.5 rounded-none transition-all group relative overflow-hidden ${isActive ? 'text-primary-600 dark:text-primary-400 font-bold' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-900'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800/50 rounded-none"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <item.icon size={20} className={`relative z-10 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                            <AnimatePresence>
                                {!collapsed && (
                                    <motion.span
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        className="ml-3 relative z-10 whitespace-nowrap"
                                    >
                                        {item.label}
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        {initials}
                    </div>
                    {!collapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{displayName}</p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 truncate capitalize font-medium">{role.replace('_', ' ')}</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
