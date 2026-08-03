import { describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth", async () => ({
  ...(await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")),
  getUser: vi.fn(),
}));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PreDB } from "@/lib/db-test";
import { sessionResult, userRecord } from "../../../tests/fixtures";
import { listUsers } from "../list-users.action";

describe("listUsers action scenarios", () => {
  it("authenticates and returns the real Service result", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    await PreDB(db, schema, { user: [admin] });
    vi.mocked(getUser).mockResolvedValue(sessionResult(admin));
    await expect(listUsers()).resolves.toMatchObject({
      success: true,
      data: { total: 1, users: [{ id: admin.id }] },
    });
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(getUser).mockResolvedValue({
      user: null,
      sessionToken: null,
      isImpersonating: false,
      impersonatedBy: null,
      impersonationCredential: null,
    });
    await expect(listUsers()).resolves.toEqual({
      success: false,
      error: "Unauthorized - please sign in",
    });
  });
});
