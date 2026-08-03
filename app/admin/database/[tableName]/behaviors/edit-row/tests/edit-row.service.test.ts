import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { EditRow } from "../edit-row.service";

const now = new Date("2026-01-01T00:00:00.000Z");
const admin = {
  id: "admin",
  email: "admin@example.com",
  name: "Before",
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

describe("EditRow", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("updates a non-sensitive row for an administrator in test", async () => {
    await seed();

    const updated = await EditRow.execute({
      actor: { id: admin.id, role: admin.role },
      input: {
        tableName: "test_record",
        id: existingRecord.id,
        data: { title: "After" },
      },
    });

    expect(updated).toMatchObject({ id: existingRecord.id, title: "After" });
    await PostDB(db, schema, {
      test_record: [{ id: existingRecord.id, title: "After", body: existingRecord.body }],
    });
  });

  it("rejects a sensitive-table write without changing the database", async () => {
    await seed();

    await expect(EditRow.execute({
      actor: { id: admin.id, role: admin.role },
      input: { tableName: "user", id: admin.id, data: { name: "Blocked" } },
    })).rejects.toThrow("Forbidden - database write access denied");
    await PostDB(db, schema, {
      user: [{ id: admin.id, name: admin.name, role: "admin" }],
    });
  });

  it("rejects a production write without changing the database", async () => {
    await seed();
    vi.stubEnv("NODE_ENV", "production");

    await expect(EditRow.execute({
      actor: { id: admin.id, role: admin.role },
      input: {
        tableName: "test_record",
        id: existingRecord.id,
        data: { title: "Blocked" },
      },
    })).rejects.toThrow("Forbidden - database write access denied");
    await PostDB(db, schema, {
      test_record: [{ id: existingRecord.id, title: existingRecord.title }],
    });
  });

  it("rejects a non-administrator without changing the database", async () => {
    await seed();

    await expect(EditRow.execute({
      actor: { id: "member", role: "user" },
      input: {
        tableName: "test_record",
        id: existingRecord.id,
        data: { title: "Blocked" },
      },
    })).rejects.toThrow("Forbidden - database write access denied");
    await PostDB(db, schema, {
      test_record: [{ id: existingRecord.id, title: existingRecord.title }],
    });
  });
});

async function seed() {
  await PreDB(db, schema, { user: [admin], test_record: [existingRecord] });
}
