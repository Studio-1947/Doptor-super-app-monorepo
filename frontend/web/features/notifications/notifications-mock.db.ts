// Notifications Mock Database

export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "mention";

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  userId: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
}

export const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "File Forwarded",
    message: "File EST-2024-001 has been forwarded to you by Jane Smith.",
    type: "info",
    userId: "u1",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    link: "/office/files/f1",
  },
  {
    id: "n2",
    title: "Task Due Soon",
    message: 'Task "Review Quarterly Budget" is due tomorrow.',
    type: "warning",
    userId: "u1",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    link: "/tasks",
  },
  {
    id: "n3",
    title: "Leave Approved",
    message: "Your leave request for Feb 20 has been approved.",
    type: "success",
    userId: "u1",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: "n4",
    title: "New Comment",
    message: 'Robert mentioned you in "Board Meeting Slides".',
    type: "mention",
    userId: "u1",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    link: "/tasks/t4",
  },
];

export function getNotifications(userId: string): Notification[] {
  return MOCK_NOTIFICATIONS.filter((n) => n.userId === userId).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function markAsRead(notificationId: string): void {
  // In a real app we'd update state/DB
  const notification = MOCK_NOTIFICATIONS.find((n) => n.id === notificationId);
  if (notification) {
    notification.isRead = true;
  }
}

export function markAllAsRead(userId: string): void {
  MOCK_NOTIFICATIONS.filter((n) => n.userId === userId).forEach(
    (n) => (n.isRead = true),
  );
}
