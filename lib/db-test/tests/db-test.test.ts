import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { PreDB } from "../predb";
import { PostDB } from "../postdb";

// Schema for integration testing
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

describe("PreDB + PostDB Integration", () => {
  const client = createClient({ url: ":memory:" });
  const db = drizzle(client, { schema });

  beforeAll(async () => {
    // Create tables
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
  });

  beforeEach(async () => {
    // Clean up tables before each test
    await db.run(sql`DELETE FROM records`);
    await db.run(sql`DELETE FROM users`);
    await db.run(sql`DELETE FROM sqlite_sequence WHERE name IN ('users', 'records')`);
  });

  it("works together for deterministic testing workflow", async () => {
    // 1. Set up initial state with PreDB
    await PreDB(db, schema, {
      users: [{ id: 1, name: "Ed" }],
      records: []
    });

    // 2. Verify initial state with PostDB
    await expect(
      PostDB(db, schema, {
        users: [{ id: 1, name: "Ed" }],
        records: []
      })
    ).resolves.toBe(true);

    // 3. Simulate creating a record (manual insert for this test)
    await db.insert(records).values({ id: 10, userId: 1, label: "First record" });

    // 4. Assert the final state with PostDB
    await expect(
      PostDB(db, schema, {
        users: [{ id: 1, name: "Ed" }],
        records: [{ id: 10, userId: 1, label: "First record" }]
      })
    ).resolves.toBe(true);
  });

  it("supports subset assertions in PostDB after PreDB setup", async () => {
    // Set up state with all columns
    await PreDB(db, schema, {
      users: [{ id: 1, name: "Ed" }, { id: 2, name: "Luiz" }],
      records: [{ id: 20, userId: 1, label: "First record" }, { id: 21, userId: 2, label: "Second record" }]
    });

    // Assert with subset (only checking id and userId, ignoring label)
    await expect(
      PostDB(db, schema, {
        records: [{ id: 20, userId: 1 }, { id: 21, userId: 2 }]
      })
    ).resolves.toBe(true);
  });

  it("detects changes correctly", async () => {
    // Set up initial state
    await PreDB(db, schema, {
      users: [{ id: 1, name: "Ed" }],
      records: [{ id: 30, userId: 1, label: "Original label" }]
    });

    // Simulate updating the record label
    await db.run(sql`UPDATE records SET label = 'Updated label' WHERE id = 30`);

    // PostDB should detect the change
    await expect(
      PostDB(db, schema, {
        records: [{ id: 30, userId: 1, label: "Original label" }] // This should fail
      })
    ).rejects.toThrow(/PostDB assertion failed:/);

    // But should pass with the correct new label
    await expect(
      PostDB(db, schema, {
        records: [{ id: 30, userId: 1, label: "Updated label" }]
      })
    ).resolves.toBe(true);
  });
});
