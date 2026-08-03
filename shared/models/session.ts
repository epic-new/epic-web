import "server-only";

import { db, type DatabaseExecutor } from "@/db";
import { session } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export type SessionRecord = typeof session.$inferSelect;
export type NewSessionRecord = typeof session.$inferInsert;

export class SessionModel {
  static async findByToken(token: string): Promise<SessionRecord | null> {
    const [record] = await db
      .select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);
    return record ?? null;
  }

  static async listByUser(userId: string): Promise<SessionRecord[]> {
    return db
      .select()
      .from(session)
      .where(eq(session.userId, userId))
      .orderBy(asc(session.createdAt));
  }

  static async deleteByToken(token: string): Promise<boolean> {
    const [record] = await db
      .delete(session)
      .where(eq(session.token, token))
      .returning({ id: session.id });
    return !!record;
  }

  static async deleteByUser(
    userId: string,
    executor: DatabaseExecutor = db,
  ): Promise<number> {
    const records = await executor
      .delete(session)
      .where(eq(session.userId, userId))
      .returning({ id: session.id });
    return records.length;
  }
}
