import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUser: vi.fn() }));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PreDB } from "@/lib/db-test";
import { viewTable } from "../view-table.action";

describe("viewTable", () => {
  beforeEach(async () => {
    const now = new Date();
    await PreDB(db, schema, {
      user: [{
        id: "one",
        email: "one@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      }],
    });
    vi.mocked(getUser).mockResolvedValue({
      user: { id: "admin", role: "admin" },
    } as never);
  });

  it("returns table data through the real Service and Model", async () => {
    const result = await viewTable({ tableName: "user", page: 1, limit: 10 });

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(result.data.rows[0]).toMatchObject({ id: "one" });
  });

  it("translates a Service failure", async () => {
    await expect(viewTable({
      tableName: "missing",
      page: 1,
      limit: 10,
    })).resolves.toEqual({
      success: false,
      error: 'Table "missing" not found',
    });
  });
});
