import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";
import {
  createAdminAuth,
  signUpUser,
} from "../../../tests/fixtures";
import { SetPassword } from "../set-password.service";
import { auth } from "@/lib/auth";

describe("SetPassword service scenarios", () => {
  it("changes a real Better Auth credential", async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const admin = await createAdminAuth();
    const target = await signUpUser({ email: "target@example.com" });

    await expect(SetPassword.execute({
      actor: admin.actor,
      sessionToken: admin.sessionToken,
      input: { userId: target.id, newPassword: "new-password-123" },
    })).resolves.toEqual({ userId: target.id });

    await expect(auth.api.signInEmail({
      body: { email: target.email, password: "new-password-123" },
    })).resolves.toBeDefined();
  });
});
