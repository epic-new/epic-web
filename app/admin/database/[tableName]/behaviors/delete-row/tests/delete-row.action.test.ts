import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUser: vi.fn() }));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { deleteRow } from "../delete-row.action";

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

describe("deleteRow", () => {
  beforeEach(async () => {
    await PreDB(db, schema, { user: [admin], test_record: [existingRecord] });
    vi.mocked(getUser).mockResolvedValue({
      user: { id: admin.id, role: admin.role },
    } as never);
  });

  it("deletes a non-sensitive row through the real Service and Model", async () => {
    await expect(deleteRow({ tableName: "test_record", id: existingRecord.id }))
      .resolves.toEqual({ success: true, data: { id: existingRecord.id } });
    await PostDB(db, schema, { test_record: [] });
  });

  it("returns a forbidden response for a sensitive table without deleting", async () => {
    await expect(deleteRow({ tableName: "user", id: admin.id }))
      .resolves.toEqual({
        success: false,
        error: "Forbidden - database write access denied",
      });
    await PostDB(db, schema, {
      user: [{ id: admin.id, email: admin.email, role: "admin" }],
    });
  });

  it("rejects an unauthenticated request without deleting", async () => {
    vi.mocked(getUser).mockResolvedValue({ user: null } as never);

    await expect(deleteRow({ tableName: "test_record", id: existingRecord.id }))
      .resolves.toEqual({ success: false, error: "Unauthorized" });
    await PostDB(db, schema, {
      test_record: [{ id: existingRecord.id, title: existingRecord.title }],
    });
  });
});
