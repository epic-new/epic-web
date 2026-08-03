import { describe, expect, it } from "vitest";
import type { SessionRecord } from "@/shared/models/session";
import { SessionPolicy } from "../session.policy";

const session: SessionRecord = {
  id: "session",
  token: "token",
  userId: "user",
  expiresAt: new Date("2027-01-01"),
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
  ipAddress: null,
  userAgent: null,
  impersonatedBy: null,
};

describe("SessionPolicy", () => {
  it("allows an actor to sign out their own session", () => {
    expect(SessionPolicy.canSignOut({ id: "user" }, [session])).toBe(true);
  });

  it("rejects a session owned by another actor", () => {
    expect(SessionPolicy.canSignOut({ id: "other" }, [session])).toBe(false);
  });
});
