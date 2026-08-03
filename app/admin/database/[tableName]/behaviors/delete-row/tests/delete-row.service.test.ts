import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { DeleteRow } from "../delete-row.service";

const now = new Date("2026-01-01T00:00:00.000Z");
const admin = {
  id: "admin",
  email: "admin@example.com",
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
  role: "admin",
};
const existingRecord = {
  id: "record-one",
  userId: admin.id,
  title: "Before",
  body: "Body",
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};

describe("DeleteRow", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("deletes a non-sensitive row for an administrator in test", async () => {
    await seed();

    await expect(DeleteRow.execute({
      actor: { id: admin.id, role: admin.role },
      input: { tableName: "test_record", id: existingRecord.id },
    })).resolves.toEqual({ id: existingRecord.id });
    await PostDB(db, schema, { test_record: [] });
  });

  it("rejects a sensitive-table write without changing the database", async () => {
    await seed();

    await expect(DeleteRow.execute({
      actor: { id: admin.id, role: admin.role },
      input: { tableName: "user", id: admin.id },
    })).rejects.toThrow("Forbidden - database write access denied");
    await PostDB(db, schema, {
      user: [{ id: admin.id, email: admin.email, role: "admin" }],
    });
  });

  it("rejects a production write without changing the database", async () => {
    await seed();
    vi.stubEnv("NODE_ENV", "production");

    await expect(DeleteRow.execute({
      actor: { id: admin.id, role: admin.role },
      input: { tableName: "test_record", id: existingRecord.id },
    })).rejects.toThrow("Forbidden - database write access denied");
    await PostDB(db, schema, {
      test_record: [{ id: existingRecord.id, title: existingRecord.title }],
    });
  });

  it("rejects a non-administrator without changing the database", async () => {
    await seed();

    await expect(DeleteRow.execute({
      actor: { id: "member", role: "user" },
      input: { tableName: "test_record", id: existingRecord.id },
    })).rejects.toThrow("Forbidden - database write access denied");
    await PostDB(db, schema, {
      test_record: [{ id: existingRecord.id, title: existingRecord.title }],
    });
  });
});

async function seed() {
  await PreDB(db, schema, { user: [admin], test_record: [existingRecord] });
}
