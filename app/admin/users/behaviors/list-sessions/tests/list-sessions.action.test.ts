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
import { listSessions } from "../list-sessions.action";

describe("listSessions action scenarios", () => {
  it("returns persisted target sessions", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, {
      user: [admin, target],
      session: [{
        id: "session",
        token: "token",
        userId: target.id,
        expiresAt: new Date("2027-01-01"),
        createdAt: target.createdAt,
        updatedAt: target.updatedAt,
      }],
    });
    vi.mocked(getUser).mockResolvedValue(sessionResult(admin));
    await expect(listSessions({ userId: target.id })).resolves.toMatchObject({
      success: true,
      data: [{ id: "session", userId: target.id }],
    });
  });
});
