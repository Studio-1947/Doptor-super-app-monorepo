import type { UserRole } from '@/features/auth/RoleContext';

export interface MenuItem {
    icon: any;
    label: string;
    href: string;
}

/**
 * One vertical's navigation, keyed by role.
 *
 * **Partial on purpose.** It used to be a total `Record<UserRole | 'all', …>`,
 * which forced every vertical to declare every role — so the Office and core
 * menus each carried an empty `student: []` for a role that does not exist in
 * an office organisation, purely to satisfy the type. That is the kind of
 * enforced intersection that lets one product bleed into the other.
 *
 * Now each vertical declares only the roles it actually has, and callers treat
 * a missing role as "no navigation" via `menuFor()`.
 */
export type VerticalMenu = Partial<Record<UserRole | 'all', MenuItem[]>>;

/** A vertical's menu for one role; absent role means no entries, never a crash. */
export function menuFor(menu: VerticalMenu | undefined, role: UserRole): MenuItem[] {
    return menu?.[role] ?? [];
}
