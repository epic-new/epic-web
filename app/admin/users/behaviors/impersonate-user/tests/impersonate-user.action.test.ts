import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => { throw new Error("NEXT_REDIRECT"); }),
  unstable_rethrow: vi.fn((error: unknown) => {
    if (error instanceof Error && error.message === "NEXT_REDIRECT") throw error;
  }),
}));
vi.mock("@/lib/auth", async () => ({
  ...(await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")),
  getUser: vi.fn(),
}));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PreDB } from "@/lib/db-test";
import { SessionModel } from "@/shared/models/session";
import {
  createAdminAuth,
  sessionResult,
  signUpUser,
} from "../../../tests/fixtures";
import { impersonateUser } from "../impersonate-user.action";

describe("impersonateUser action scenarios", () => {
  it("creates the real session before redirecting", async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const admin = await createAdminAuth();
    const target = await signUpUser({ email: "target@example.com" });
    vi.mocked(getUser).mockResolvedValue(
      sessionResult(admin.actor, null, admin.sessionToken),
    );

    await expect(impersonateUser({ userId: target.id })).rejects.toThrow(
      "NEXT_REDIRECT",
    );
    expect(await SessionModel.listByUser(target.id)).toContainEqual(
      expect.objectContaining({ impersonatedBy: admin.actor.id }),
    );
  });
});
