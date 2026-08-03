import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", async () => ({
  ...(await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")),
  getUser: vi.fn(),
}));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth, getUser } from "@/lib/auth";
import { PreDB } from "@/lib/db-test";
import {
  createAdminAuth,
  sessionResult,
  signUpUser,
} from "../../../tests/fixtures";
import { setPassword } from "../set-password.action";

describe("setPassword action scenarios", () => {
  it("changes a real credential through the Controller", async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const admin = await createAdminAuth();
    const target = await signUpUser({ email: "target@example.com" });
    vi.mocked(getUser).mockResolvedValue(
      sessionResult(admin.actor, null, admin.sessionToken),
    );

    await expect(setPassword({
      userId: target.id,
      newPassword: "new-password-123",
    })).resolves.toEqual({ success: true, data: { userId: target.id } });
    await expect(auth.api.signInEmail({
      body: { email: target.email, password: "new-password-123" },
    })).resolves.toBeDefined();
  });
});
