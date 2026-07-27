import { relations } from "drizzle-orm";
import { notifications } from "./notification.schema";
import { users } from "./user.schema";

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.user_id],
    references: [users.id],
  }),
  actor: one(users, {
    fields: [notifications.actor_id],
    references: [users.id],
  }),
}));
