import "server-only";

import { db, type DatabaseExecutor } from "@/db";
import { user } from "@/db/schema";
import {
  and,
  asc,
  count,
  desc,
  eq,
  like,
  sql,
  type SQL,
} from "drizzle-orm";

export type UserRecord = typeof user.$inferSelect;
export type NewUserRecord = typeof user.$inferInsert;

export type UserSearchField = "email" | "name";
export type UserSearchOperator = "contains" | "starts_with" | "ends_with";
export type UserSortField = "email" | "name" | "role" | "createdAt" | "updatedAt";

export interface ListUserRecordsOptions {
  searchValue?: string;
  searchField?: UserSearchField;
  searchOperator?: UserSearchOperator;
  role?: string;
  limit: number;
  offset: number;
  sortBy?: UserSortField;
  sortDirection: "asc" | "desc";
}

export interface UserRecordPage {
  users: UserRecord[];
  total: number;
}

export type UserStats = {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
};

export class UserModel {
  static async find(
    id: string,
    executor: DatabaseExecutor = db,
  ): Promise<UserRecord | null> {
    const [record] = await executor
      .select()
      .from(user)
      .where(eq(user.id, id))
      .limit(1);
    return record ?? null;
  }

  static async findByEmail(email: string): Promise<UserRecord | null> {
    const [record] = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);
    return record ?? null;
  }

  static async findFirstByRole(role: string): Promise<UserRecord | null> {
    const [record] = await db
      .select()
      .from(user)
      .where(eq(user.role, role))
      .limit(1);

    return record ?? null;
  }

  static async list(options: ListUserRecordsOptions): Promise<UserRecordPage> {
    const conditions: SQL[] = [];

    if (options.searchValue) {
      const column = options.searchField === "name" ? user.name : user.email;
      const pattern =
        options.searchOperator === "starts_with"
          ? `${options.searchValue}%`
          : options.searchOperator === "ends_with"
            ? `%${options.searchValue}`
            : `%${options.searchValue}%`;
      conditions.push(like(column, pattern));
    }

    if (options.role) conditions.push(eq(user.role, options.role));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const sortColumns = {
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } as const;
    const sortColumn = sortColumns[options.sortBy ?? "createdAt"];
    const order = options.sortDirection === "desc" ? desc(sortColumn) : asc(sortColumn);

    const [users, [totalResult]] = await Promise.all([
      db
        .select()
        .from(user)
        .where(where)
        .orderBy(order)
        .limit(options.limit)
        .offset(options.offset),
      db.select({ value: count() }).from(user).where(where),
    ]);

    return { users, total: totalResult?.value ?? 0 };
  }

  static async update(
    id: string,
    changes: Partial<
      Pick<
        UserRecord,
        "email" | "name" | "role" | "banned" | "banReason" | "banExpires"
      >
    >,
    executor: DatabaseExecutor = db,
  ): Promise<UserRecord | null> {
    const [record] = await executor
      .update(user)
      .set({ ...changes, updatedAt: new Date() })
      .where(eq(user.id, id))
      .returning();
    return record ?? null;
  }

  static async delete(id: string): Promise<boolean> {
    const [record] = await db
      .delete(user)
      .where(eq(user.id, id))
      .returning({ id: user.id });
    return !!record;
  }

  static async getStats(): Promise<UserStats> {
    const [result] = await db
      .select({
        totalUsers: count(),
        bannedUsers: sql<number>`count(case when ${user.banned} = 1 then 1 end)`.mapWith(Number),
      })
      .from(user);

    const totalUsers = result.totalUsers;
    const bannedUsers = result.bannedUsers;

    return {
      totalUsers,
      activeUsers: totalUsers - bannedUsers,
      bannedUsers,
    };
  }
}
