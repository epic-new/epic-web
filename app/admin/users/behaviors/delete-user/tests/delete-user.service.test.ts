import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { userRecord } from "../../../tests/fixtures";
import { DeleteUser } from "../delete-user.service";

describe("DeleteUser service scenarios", () => {
  it("deletes another user and cascades their sessions", async () => {
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
    await expect(DeleteUser.execute({
      actor: admin,
      input: { userId: target.id },
    })).resolves.toEqual({ userId: target.id });
    await PostDB(db, schema, { user: [{ id: admin.id }], session: [] });
  });
});
