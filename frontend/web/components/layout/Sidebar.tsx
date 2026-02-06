'use client';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileText, Settings, Bell, ChevronLeft, Menu, ClipboardList, CheckSquare, MessageSquare, Calendar, BarChart3, Building2, Shield, GraduationCap, Globe2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useRole, UserRole } from '@/features/auth/RoleContext';
import { useVertical, VerticalType } from '@/contexts/VerticalContext';

// Define menus for each vertical and role
const verticalMenus: Record<VerticalType, Record<UserRole | 'all', { icon: any, label: string, href: string }[]>> = {
    core: {
        all: [
            { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
            { icon: ClipboardList, label: 'Tasks', href: '/tasks' },
            { icon: CheckSquare, label: 'Approvals', href: '/approvals' },
            { icon: MessageSquare, label: 'Communication', href: '/communication' },
            { icon: Calendar, label: 'Attendance', href: '/attendance' },
            { icon: Settings, label: 'Settings', href: '/settings' },
        ],
        super_admin: [],
        org_admin: [],
        manager: [],
        staff: [],
        student: []
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
        student: []
    },
    campus: {
        all: [],
        super_admin: [
            { icon: GraduationCap, label: 'Campus Admin', href: '/campus/admin' },
        ],
        org_admin: [
            { icon: GraduationCap, label: 'Campus Dashboard', href: '/campus' },
            { icon: Users, label: 'Students', href: '/campus/students' },
            { icon: Users, label: 'Faculty', href: '/campus/faculty' },
            { icon: FileText, label: 'Academics', href: '/campus/academics' },
            { icon: Calendar, label: 'Attendance', href: '/campus/attendance/calendar' },
        ],
        manager: [
            { icon: GraduationCap, label: 'Department', href: '/campus/department' },
        ],
        staff: [
            { icon: GraduationCap, label: 'Classes', href: '/campus/classes' },
        ],
        student: [
            { icon: FileText, label: 'My Courses', href: '/campus/courses' },
            { icon: Calendar, label: 'Timetable', href: '/campus/timetable' },
            { icon: FileText, label: 'Results', href: '/campus/results' },
        ]
    },
    network: {
        all: [],
        super_admin: [
            { icon: Globe2, label: 'Network Admin', href: '/network/admin' },
        ],
        org_admin: [
            { icon: Globe2, label: 'Network Dashboard', href: '/network' },
            { icon: Users, label: 'Volunteers', href: '/network/volunteers' },
            { icon: MessageSquare, label: 'Campaigns', href: '/network/campaigns' },
        ],
        manager: [
            { icon: Users, label: 'Local Group', href: '/network/group' },
        ],
        staff: [],
        student: [
            { icon: Globe2, label: 'Volunteer Feed', href: '/network/feed' },
            { icon: CheckSquare, label: 'Opportunities', href: '/network/opportunities' },
        ]
    }
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

    // Combine 'all' menus with role-specific menus for the active vertical
    const verticalSpecific = verticalMenus[activeVertical];
    const roleSpecific = verticalSpecific[role] || [];
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
            className="h-full bg-white border-r border-slate-200 flex flex-col relative z-20 shadow-sm transition-all duration-300"
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
