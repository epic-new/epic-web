import { describe, it, expect, beforeAll } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { PostDB } from "../postdb";

// Minimal schema for testing (same as PreState tests)
const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
});

const records = sqliteTable("records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull(),
  label: text("label").notNull(),
});

const schema = { users, records };

describe("PostDB", () => {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });

  beforeAll(async () => {
    // Create tables with foreign keys
    await db.run(sql`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);

    await db.run(sql`
      CREATE TABLE records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        label TEXT NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
      )
    `);

    // Insert test data
    await db.insert(users).values([
      { id: 1, name: "Ed" },
      { id: 2, name: "Luiz" }
    ]);
    await db.insert(records).values([
      { id: 10, userId: 1, label: "First record" }
    ]);
  });

  it("asserts exact match (order-independent)", async () => {
    await expect(
      PostDB(db, schema, {
        users: [{ id: 2, name: "Luiz" }, { id: 1, name: "Ed" }], // Different order
        records: [{ id: 10, userId: 1, label: "First record" }],
      })
    ).resolves.toBe(true);
  });

  it("throws with readable diff when mismatched", async () => {
    await expect(
      PostDB(db, schema, {
        records: [{ id: 10, userId: 1, label: "Different record" }], // Wrong label
      })
    ).rejects.toThrow(/PostDB assertion failed:/);
  });

  it("supports subset assertions (partial columns)", async () => {
    await expect(
      PostDB(db, schema, {
        records: [{ id: 10, userId: 1 }], // Omit 'label' column
      })
    ).resolves.toBe(true);
  });

  it("allows extra rows when allowExtraRows=true", async () => {
    await expect(
      PostDB(db, schema, {
        users: [{ id: 1, name: "Ed" }], // Only expect 1 user, but 2 exist
      }, { allowExtraRows: true })
    ).resolves.toBe(true);
  });

  it("compares loosely when loose=true", async () => {
    await expect(
      PostDB(db, schema, {
        users: [{ id: "1", name: "Ed" }, { id: "2", name: "Luiz" }], // String IDs
      }, { loose: true })
    ).resolves.toBe(true);
  });

  it("respects 'only' option to target specific tables", async () => {
    await expect(
      PostDB(db, schema, {
        users: [{ id: 1, name: "Ed" }, { id: 2, name: "Luiz" }],
        records: [] // This would fail if checked, but we only check users
      }, { only: ["users"] })
    ).resolves.toBe(true);
  });

  it("throws error for non-existent table", async () => {
    await expect(
      PostDB(db, schema, {
        nonexistent: [{ id: 1, name: "test" }]
      })
    ).rejects.toThrow("Table 'nonexistent' not found in schema");
  });

  it("handles empty expected state", async () => {
    // This should fail since we have data but expect empty
    await expect(
      PostDB(db, schema, {
        users: [],
        records: []
      })
    ).rejects.toThrow(/PostDB assertion failed:/);
  });
});
