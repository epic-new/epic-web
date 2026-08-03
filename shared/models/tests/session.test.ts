import { describe, expect, it } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { SessionModel } from "../session";

const now = new Date("2026-01-01T00:00:00.000Z");
const user = {
  id: "user-1",
  email: "user@example.com",
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
};

describe("SessionModel", () => {
  it("lists and revokes persisted sessions", async () => {
    await PreDB(db, schema, {
      user: [user],
      session: [
        {
          id: "session-1",
          token: "token-1",
          userId: user.id,
          expiresAt: new Date("2027-01-01T00:00:00.000Z"),
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "session-2",
          token: "token-2",
          userId: user.id,
          expiresAt: new Date("2027-01-01T00:00:00.000Z"),
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await expect(SessionModel.findByToken("token-1")).resolves.toMatchObject({
      id: "session-1",
    });
    await expect(SessionModel.listByUser(user.id)).resolves.toHaveLength(2);
    await expect(SessionModel.deleteByToken("token-1")).resolves.toBe(true);
    await expect(SessionModel.deleteByUser(user.id)).resolves.toBe(1);
    await PostDB(db, schema, { session: [] });
  });
});
