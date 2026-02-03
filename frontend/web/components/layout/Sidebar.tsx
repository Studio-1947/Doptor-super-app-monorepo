"use client";

import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, Bell, ChevronLeft, Menu, ClipboardList, CheckSquare, MessageSquare, Calendar, BarChart3, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useRole, UserRole } from '@/features/auth/RoleContext';

const roleMenus: Record<UserRole, { icon: any, label: string, href: string }[]> = {
    super_admin: [
        { icon: LayoutDashboard, label: 'Overview', href: '/' },
        { icon: Building2, label: 'Organisations', href: '/organisations' },
        { icon: Users, label: 'Users', href: '/users' },
        { icon: FileText, label: 'e-Dak Files', href: '/office/files' },
        { icon: Settings, label: 'System', href: '/system' },
    ],
    org_admin: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
        { icon: ClipboardList, label: 'Tasks', href: '/tasks' },
        { icon: CheckSquare, label: 'Approvals', href: '/approvals' },
        { icon: FileText, label: 'Documents', href: '/documents' },
        { icon: Users, label: 'Staff', href: '/office/registry' },
        { icon: FileText, label: 'e-Dak Files', href: '/office/files' },
        { icon: Settings, label: 'Settings', href: '/settings' },
    ],
    manager: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
        { icon: ClipboardList, label: 'Team Tasks', href: '/tasks' },
        { icon: CheckSquare, label: 'Approvals', href: '/approvals' },
        { icon: FileText, label: 'e-Dak Files', href: '/office/files' },
        { icon: Calendar, label: 'Attendance', href: '/attendance' },
        { icon: BarChart3, label: 'Reports', href: '/reports' },
    ],
    staff: [
        { icon: LayoutDashboard, label: 'My Dashboard', href: '/' },
        { icon: ClipboardList, label: 'My Tasks', href: '/tasks' },
        { icon: MessageSquare, label: 'Chat', href: '/chat' },
        { icon: Calendar, label: 'Attendance', href: '/attendance' },
    ],
    student: [
        { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
        { icon: FileText, label: 'Assignments', href: '/assignments' },
        { icon: MessageSquare, label: 'Notices', href: '/notices' },
    ]
};

export function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const pathname = usePathname();
    const { role } = useRole();

    const menuItems = roleMenus[role] || roleMenus['student'];

    return (
        <motion.div
            initial={{ width: 240 }}
            animate={{ width: collapsed ? 80 : 240 }}
            className="h-screen bg-white border-r border-slate-200 flex flex-col relative z-20 shadow-sm transition-all duration-300"
        >
            <div className="p-4 flex items-center justify-between">
                <AnimatePresence>
                    {!collapsed && (
                        <motion.h1
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-xl font-bold bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent"
                        >
                            Doptor
                        </motion.h1>
                    )}
                </AnimatePresence>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
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
                            className={`flex items-center px-3 py-2.5 rounded-xl transition-all group relative overflow-hidden ${isActive ? 'text-primary-600 font-medium' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-primary-50 border border-primary-100 rounded-xl"
                                    initial={false}
                                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                />
                            )}
                            <item.icon size={20} className={`relative z-10 ${isActive ? 'text-primary-600' : ''}`} />
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

            <div className="p-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
                        JD
                    </div>
                    {!collapsed && (
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-medium text-slate-900 truncate">John Doe</p>
                            <p className="text-xs text-slate-500 truncate capitalize">{role.replace('_', ' ')}</p>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
