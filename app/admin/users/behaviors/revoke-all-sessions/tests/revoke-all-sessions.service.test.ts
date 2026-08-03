import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { userRecord } from "../../../tests/fixtures";
import { RevokeAllSessions } from "../revoke-all-sessions.service";

describe("RevokeAllSessions service scenarios", () => {
  it("revokes every target session", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    const sessionBase = {
      userId: target.id,
      expiresAt: new Date("2027-01-01"),
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
    };
    await PreDB(db, schema, {
      user: [admin, target],
      session: [
        { ...sessionBase, id: "one", token: "one" },
        { ...sessionBase, id: "two", token: "two" },
      ],
    });
    await expect(RevokeAllSessions.execute({
      actor: admin,
      input: { userId: target.id },
    })).resolves.toEqual({ userId: target.id, revokedCount: 2 });
    await PostDB(db, schema, { session: [] });
  });
});
