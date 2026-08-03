import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";
import { userRecord } from "../../../tests/fixtures";
import { ListSessions } from "../list-sessions.service";

describe("ListSessions service scenarios", () => {
  it("returns only the target user's sessions", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, {
      user: [admin, target],
      session: [{
        id: "target-session",
        token: "target-token",
        userId: target.id,
        expiresAt: new Date("2027-01-01"),
        createdAt: target.createdAt,
        updatedAt: target.updatedAt,
      }],
    });
    await expect(ListSessions.execute({
      actor: admin,
      input: { userId: target.id },
    })).resolves.toMatchObject([{ id: "target-session", userId: target.id }]);
  });
});
