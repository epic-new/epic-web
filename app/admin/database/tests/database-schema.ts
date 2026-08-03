import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { user } from "../../../../db/schema";

export * from "../../../../db/schema";

/**
 * A neutral, Vitest-only table for exercising the generic database admin.
 * It is resolved through the Vitest alias and never becomes part of the
 * production application schema or migrations.
 */
export const testRecord = sqliteTable("test_record", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }),
});
