import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";
import { SessionModel } from "@/shared/models/session";
import { createAdminAuth, signUpUser } from "../../../tests/fixtures";
import { ImpersonateUser } from "../impersonate-user.service";

describe("ImpersonateUser service scenarios", () => {
  it("creates a real impersonated Better Auth session", async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const admin = await createAdminAuth();
    const target = await signUpUser({ email: "target@example.com" });

    await expect(ImpersonateUser.execute({
      actor: admin.actor,
      sessionToken: admin.sessionToken,
      input: { userId: target.id },
    })).resolves.toEqual({ userId: target.id });

    const sessions = await SessionModel.listByUser(target.id);
    expect(sessions).toContainEqual(expect.objectContaining({
      userId: target.id,
      impersonatedBy: admin.actor.id,
    }));
  });
});
