import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import type { SessionRecord } from "@/shared/models/session";
import { describe, expect, it } from "vitest";
import { SignOut } from "../sign-out.service";

const now = new Date("2026-01-01T00:00:00.000Z");
const owner = {
  id: "owner",
  email: "owner@example.com",
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
};
const otherUser = {
  id: "other",
  email: "other@example.com",
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
};
const currentSession: SessionRecord = {
  id: "session",
  token: "session-token",
  userId: owner.id,
  expiresAt: new Date("2027-01-01T00:00:00.000Z"),
  createdAt: now,
  updatedAt: now,
  ipAddress: null,
  userAgent: null,
  impersonatedBy: null,
};

describe("SignOut service scenarios", () => {
  it("revokes the actor's persisted session", async () => {
    await PreDB(db, schema, {
      user: [owner],
      session: [currentSession],
    });

    await expect(
      SignOut.execute({
        actor: { id: owner.id },
        input: { sessionToken: currentSession.token },
      }),
    ).resolves.toEqual({ signedOut: true });

    await PostDB(db, schema, { session: [] });
  });

  it("preserves another actor's session when authorization fails", async () => {
    await PreDB(db, schema, {
      user: [owner, otherUser],
      session: [currentSession],
    });

    await expect(
      SignOut.execute({
        actor: { id: otherUser.id },
        input: { sessionToken: currentSession.token },
      }),
    ).rejects.toThrow("Unauthorized");

    await PostDB(db, schema, { session: [currentSession] });
  });
});
