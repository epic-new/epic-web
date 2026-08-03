import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUser: vi.fn() }));
vi.mock("@/lib/auth/transport", () => ({ clearAuthSession: vi.fn() }));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { clearAuthSession } from "@/lib/auth/transport";
import { PostDB, PreDB } from "@/lib/db-test";
import type { SessionRecord } from "@/shared/models/session";
import { headers } from "next/headers";
import { signOut } from "../sign-out.action";

const now = new Date("2026-01-01T00:00:00.000Z");
const actor = {
  id: "admin",
  name: "Admin",
  email: "admin@example.com",
  emailVerified: true,
  role: "admin",
  createdAt: now,
  updatedAt: now,
};
const currentSession: SessionRecord = {
  id: "session",
  token: "session-token",
  userId: actor.id,
  expiresAt: new Date("2027-01-01T00:00:00.000Z"),
  createdAt: now,
  updatedAt: now,
  ipAddress: null,
  userAgent: null,
  impersonatedBy: null,
};

describe("signOut action scenarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("revokes the authenticated session and clears provider transport", async () => {
    await PreDB(db, schema, {
      user: [actor],
      session: [currentSession],
    });
    const requestHeaders = new Headers({ cookie: "session=signed-token" });
    vi.mocked(getUser).mockResolvedValue({
      user: actor,
      sessionToken: currentSession.token,
      isImpersonating: false,
      impersonatedBy: null,
      impersonationCredential: null,
    } as never);
    vi.mocked(headers).mockResolvedValue(requestHeaders as never);
    vi.mocked(clearAuthSession).mockResolvedValue(undefined);

    await expect(signOut()).resolves.toEqual({
      success: true,
      data: { signedOut: true },
    });
    const [transportHeaders] = vi.mocked(clearAuthSession).mock.calls[0] ?? [];
    expect(transportHeaders?.get("cookie")).toBe("session=signed-token");
    await PostDB(db, schema, { session: [] });
  });

  it("rejects an unauthenticated request without changing the database", async () => {
    await PreDB(db, schema, {
      user: [actor],
      session: [currentSession],
    });
    vi.mocked(getUser).mockResolvedValue({
      user: null,
      sessionToken: null,
      isImpersonating: false,
      impersonatedBy: null,
      impersonationCredential: null,
    });

    await expect(signOut()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
    expect(clearAuthSession).not.toHaveBeenCalled();
    await PostDB(db, schema, { session: [currentSession] });
  });
});
