import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";
import { SessionModel } from "@/shared/models/session";
import {
  createAdminAuth,
  createImpersonationAuth,
  signUpUser,
} from "../../../tests/fixtures";
import { StopImpersonating } from "../stop-impersonating.service";

describe("StopImpersonating service scenarios", () => {
  it("ends a real Better Auth impersonation session", async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const admin = await createAdminAuth();
    const target = await signUpUser({ email: "target@example.com" });
    const impersonation = await createImpersonationAuth(admin, target);

    await expect(StopImpersonating.execute({
      actor: { ...target, impersonatedBy: admin.actor.id },
      sessionToken: impersonation.sessionToken,
      impersonationCredential: impersonation.impersonationCredential,
    })).resolves.toEqual({ stopped: true });

    const sessions = await SessionModel.listByUser(target.id);
    expect(sessions.every((entry) => !entry.impersonatedBy)).toBe(true);
  });
});
