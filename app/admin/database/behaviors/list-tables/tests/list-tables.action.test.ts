import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUser: vi.fn() }));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PreDB } from "@/lib/db-test";
import { listTables } from "../list-tables.action";

describe("listTables", () => {
  beforeEach(async () => {
    await PreDB(db, schema, { user: [] });
    vi.mocked(getUser).mockResolvedValue({
      user: { id: "admin", role: "admin" },
    } as never);
  });

  it("returns table summaries through the real Service and Model", async () => {
    const result = await listTables();

    expect(result.success).toBe(true);
    if (!result.success) throw new Error(result.error);
    expect(result.data).toContainEqual({ name: "user", rowCount: 0 });
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(getUser).mockResolvedValue({ user: null } as never);
    await expect(listTables()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });
});
