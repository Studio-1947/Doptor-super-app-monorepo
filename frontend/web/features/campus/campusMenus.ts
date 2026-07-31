import { Users, Calendar, BarChart3, GraduationCap, Award } from 'lucide-react';
import type { VerticalMenu } from '@/components/layout/menuTypes';

/**
 * Campus navigation. **Campus is frozen, not deleted** — it is kept for a
 * future product and must stay intact and compiling, but it must not
 * intersect Office in any way.
 *
 * It lives here, beside the campus feature code, rather than in the shared
 * `Sidebar.tsx`, so that the two products' navigation cannot be edited as one
 * thing. Every campus route below is currently unreachable: the vertical is
 * disabled at signup, the switcher offers Office only, and `VerticalContext`
 * redirects any campus path away. Nothing renders these entries today.
 *
 * The isolation is enforced, not just intended — see
 * `e2e/product-isolation.spec.ts`, which fails if any non-campus module
 * imports campus code, or if a campus string reaches an office surface.
 */
export const campusMenus: VerticalMenu = {
    all: [],
    super_admin: [
        { icon: GraduationCap, label: 'Campus Dashboard', href: '/campus' },
        { icon: Award, label: 'Exam Results', href: '/campus/results' },
    ],
    org_admin: [
        { icon: GraduationCap, label: 'Campus Dashboard', href: '/campus' },
        { icon: Users, label: 'Students', href: '/campus/students' },
        { icon: Users, label: 'Faculty', href: '/campus/faculty' },
        { icon: Calendar, label: 'Attendance', href: '/campus/attendance/calendar' },
        { icon: Award, label: 'Exam Results', href: '/campus/results' },
    ],
    manager: [
        { icon: Users, label: 'Students', href: '/campus/students' },
        { icon: Users, label: 'Faculty', href: '/campus/faculty' },
        { icon: BarChart3, label: 'Reports', href: '/campus/attendance/reports' },
    ],
    staff: [
        { icon: Calendar, label: 'Mark Attendance', href: '/campus/attendance/mark' },
    ],
    // The only vertical that has students at all.
    student: [],
};
