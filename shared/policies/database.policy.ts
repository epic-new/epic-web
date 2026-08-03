import type { DatabaseRowRecord } from "@/shared/models/database-table";

export interface DatabaseActor {
  id: string;
  role?: string | null;
}

export interface DatabaseModificationContext {
  tableName: string;
  environment: string | undefined;
}

const writableEnvironments = new Set(["development", "test"]);
const sensitiveTables = new Set([
  "user",
  "users",
  "session",
  "sessions",
  "account",
  "accounts",
  "verification",
  "verifications",
]);

export class DatabasePolicy {
  static inspect(
    actor: DatabaseActor,
    records: readonly DatabaseRowRecord[],
  ): boolean {
    void records;
    return actor.role === "admin";
  }

  static modify(
    actor: DatabaseActor,
    records: readonly DatabaseRowRecord[],
    context: DatabaseModificationContext,
  ): boolean {
    void records;
    return actor.role === "admin" &&
      writableEnvironments.has(context.environment ?? "") &&
      !sensitiveTables.has(context.tableName.trim().toLowerCase());
  }
}
