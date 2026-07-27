import { relations } from "drizzle-orm";
import { documents } from "./document.schema";
import { users } from "./user.schema";

export const documentsRelations = relations(documents, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [documents.uploaded_by],
    references: [users.id],
  }),
  reviewer: one(users, {
    fields: [documents.reviewed_by],
    references: [users.id],
  }),
}));
