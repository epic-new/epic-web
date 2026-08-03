import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { userRecord } from "../../../tests/fixtures";
import { RevokeSession } from "../revoke-session.service";

describe("RevokeSession service scenarios", () => {
  it("revokes one target session by token", async () => {
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
    await expect(RevokeSession.execute({
      actor: admin,
      input: { sessionToken: "token" },
    })).resolves.toEqual({ sessionToken: "token", userId: target.id });
    await PostDB(db, schema, { session: [] });
  });
});
