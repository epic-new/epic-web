import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUser: vi.fn() }));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { editRow } from "../edit-row.action";

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

describe("editRow", () => {
  beforeEach(async () => {
    await PreDB(db, schema, { user: [admin], test_record: [existingRecord] });
    vi.mocked(getUser).mockResolvedValue({
      user: { id: admin.id, role: admin.role },
    } as never);
  });

  it("returns a non-sensitive updated row through the real Service and Model", async () => {
    const result = await editRow({
      tableName: "test_record",
      id: existingRecord.id,
      data: { title: "After" },
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(result.data).toMatchObject({ id: existingRecord.id, title: "After" });
    await PostDB(db, schema, {
      test_record: [{ id: existingRecord.id, title: "After", body: existingRecord.body }],
    });
  });

  it("returns a forbidden response for a sensitive table without updating", async () => {
    await expect(editRow({
      tableName: "user",
      id: admin.id,
      data: { name: "Blocked" },
    })).resolves.toEqual({
      success: false,
      error: "Forbidden - database write access denied",
    });
    await PostDB(db, schema, {
      user: [{ id: admin.id, name: admin.name, role: "admin" }],
    });
  });

  it("rejects an unauthenticated request without updating", async () => {
    vi.mocked(getUser).mockResolvedValue({ user: null } as never);

    await expect(editRow({
      tableName: "test_record",
      id: existingRecord.id,
      data: { title: "Blocked" },
    })).resolves.toEqual({ success: false, error: "Unauthorized" });
    await PostDB(db, schema, {
      test_record: [{ id: existingRecord.id, title: existingRecord.title }],
    });
  });
});
