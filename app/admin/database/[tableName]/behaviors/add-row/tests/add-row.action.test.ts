import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUser: vi.fn() }));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { addRow } from "../add-row.action";

const now = new Date("2026-01-01T00:00:00.000Z");
const admin = {
  id: "admin",
  email: "admin@example.com",
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
  role: "admin",
};

describe("addRow", () => {
  beforeEach(async () => {
    await PreDB(db, schema, { user: [admin], test_record: [] });
    vi.mocked(getUser).mockResolvedValue({
      user: { id: admin.id, role: admin.role },
    } as never);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("returns a non-sensitive inserted row through the real Service and Model", async () => {
    const result = await addRow({
      tableName: "test_record",
      data: { user_id: admin.id, title: "Created", body: "Body" },
    });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(result.data).toMatchObject({ title: "Created", body: "Body" });
    await PostDB(db, schema, {
      test_record: [{
        id: result.data.id,
        userId: admin.id,
        title: "Created",
        body: "Body",
        deletedAt: null,
      }],
    });
  });

  it("returns a forbidden response for a sensitive table without inserting", async () => {
    await expect(addRow({
      tableName: "user",
      data: { email: "blocked@example.com", email_verified: 1 },
    })).resolves.toEqual({
      success: false,
      error: "Forbidden - database write access denied",
    });
    await PostDB(db, schema, {
      user: [{ id: admin.id, email: admin.email, role: "admin" }],
    });
  });

  it("returns a forbidden response in production without inserting", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(addRow({
      tableName: "test_record",
      data: { user_id: admin.id, title: "Blocked", body: "Body" },
    })).resolves.toEqual({
      success: false,
      error: "Forbidden - database write access denied",
    });
    await PostDB(db, schema, { test_record: [] });
  });

  it("rejects an unauthenticated request without inserting", async () => {
    vi.mocked(getUser).mockResolvedValue({ user: null } as never);

    await expect(addRow({
      tableName: "test_record",
      data: { user_id: admin.id, title: "Blocked", body: "Body" },
    })).resolves.toEqual({ success: false, error: "Unauthorized" });
    await PostDB(db, schema, { test_record: [] });
  });
});
