import { describe, expect, it } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { DatabaseTableModel } from "../database-table";

const now = new Date("2026-01-01T00:00:00.000Z");

function user(id: string, email: string, name?: string) {
  return {
    id,
    email,
    name,
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  };
}

describe("DatabaseTableModel", () => {
  it("lists schema tables with their persisted row counts", async () => {
    await PreDB(db, schema, { user: [user("one", "one@example.com")] });

    const tables = await DatabaseTableModel.list();

    expect(tables).toContainEqual({ name: "user", rowCount: 1 });
    expect(tables).toContainEqual({ name: "test_record", rowCount: 0 });
  });

  it("reads filtered, sorted, and paginated table rows", async () => {
    await PreDB(db, schema, {
      user: [
        user("charlie", "charlie@example.com", "Charlie"),
        user("alice", "alice@example.com", "Alice"),
        user("bob", "bob@example.com", "Bob"),
      ],
    });

    const result = await DatabaseTableModel.rows({
      tableName: "user",
      page: 1,
      limit: 1,
      filter: "example.com",
      sort: { column: "email", direction: "asc" },
    });

    expect(result.total).toBe(3);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({ id: "alice", email: "alice@example.com" });
  });

  it("inserts a plain row into a schema table", async () => {
    await PreDB(db, schema, { user: [] });

    const created = await DatabaseTableModel.insert("user", {
      id: "new-user",
      email: "new@example.com",
      email_verified: 1,
      created_at: now.getTime(),
      updated_at: now.getTime(),
    });

    expect(created).toMatchObject({ id: "new-user", email: "new@example.com" });
    await PostDB(db, schema, {
      user: [{ id: "new-user", email: "new@example.com", emailVerified: true }],
    });
  });

  it("updates a row by the table primary key", async () => {
    await PreDB(db, schema, { user: [user("one", "one@example.com", "Before")] });

    const updated = await DatabaseTableModel.update("user", "one", {
      name: "After",
      updated_at: now.getTime() + 1_000,
    });

    expect(updated).toMatchObject({ id: "one", name: "After" });
    await PostDB(db, schema, { user: [{ id: "one", name: "After" }] });
  });

  it("deletes only the requested row", async () => {
    await PreDB(db, schema, {
      user: [user("one", "one@example.com"), user("two", "two@example.com")],
    });

    await DatabaseTableModel.delete("user", "one");

    await PostDB(db, schema, { user: [{ id: "two", email: "two@example.com" }] });
  });
});
