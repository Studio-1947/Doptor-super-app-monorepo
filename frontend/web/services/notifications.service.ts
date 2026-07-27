import apiClient from "../lib/api-client";

/**
 * Must stay in sync with NOTIFICATION_TYPES in the backend's
 * notifications.service.ts. `AppNotification.type` is widened with `| string`
 * so an unknown kind from a newer backend still renders (with a fallback icon)
 * rather than breaking the bell.
 */
export type NotificationType =
  | "task_assigned"
  | "task_commented"
  | "file_forwarded"
  | "file_approved"
  | "file_rejected"
  | "leave_approved"
  | "leave_rejected"
  | "document_approved"
  | "document_rejected";

export interface NotificationActor {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface AppNotification {
  id: string;
  type: NotificationType | string;
  title: string;
  body: string | null;
  link: string | null;
  data: Record<string, unknown>;
  actor?: NotificationActor | null;
  read_at: string | null;
  created_at: string;
}

export interface PaginatedNotifications {
  data: AppNotification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

class NotificationsService {
  async list(opts: { page?: number; limit?: number; unreadOnly?: boolean } = {}): Promise<PaginatedNotifications> {
    const response = await apiClient.get("/notifications", {
      params: {
        page: opts.page,
        limit: opts.limit,
        unread_only: opts.unreadOnly ? "true" : undefined,
      },
    });
    return response.data;
  }

  async unreadCount(): Promise<number> {
    const response = await apiClient.get("/notifications/unread-count");
    return response.data?.unread ?? 0;
  }

  async markRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`);
  }

  async markAllRead(): Promise<void> {
    await apiClient.patch("/notifications/read-all");
  }
}

export const notificationsService = new NotificationsService();
