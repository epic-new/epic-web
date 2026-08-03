import { describe, expect, it, vi } from "vitest";
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth", async () => ({
  ...(await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")),
  getUser: vi.fn(),
}));
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { sessionResult, userRecord } from "../../../tests/fixtures";
import { revokeAllSessions } from "../revoke-all-sessions.action";

describe("revokeAllSessions action scenarios", () => {
  it("revokes every persisted target session", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    const base = {
      userId: target.id,
      expiresAt: new Date("2027-01-01"),
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
    };
    await PreDB(db, schema, {
      user: [admin, target],
      session: [
        { ...base, id: "one", token: "one" },
        { ...base, id: "two", token: "two" },
      ],
    });
    vi.mocked(getUser).mockResolvedValue(sessionResult(admin));
    await expect(revokeAllSessions({ userId: target.id })).resolves.toEqual({
      success: true,
      data: { userId: target.id, revokedCount: 2 },
    });
    await PostDB(db, schema, { session: [] });
  });
});
