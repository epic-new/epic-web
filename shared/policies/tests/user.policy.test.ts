import { describe, expect, it } from "vitest";

import type { UserRecord } from "@/shared/models/user";
import { UserPolicy } from "../user.policy";

const now = new Date("2026-01-01T00:00:00.000Z");
const admin: UserRecord = {
  id: "admin",
  email: "admin@example.com",
  name: "Admin",
  emailVerified: true,
  image: null,
  createdAt: now,
  updatedAt: now,
  role: "admin",
  banned: false,
  banReason: null,
  banExpires: null,
};
const target = { ...admin, id: "target", email: "target@example.com", role: "user" };

describe("UserPolicy", () => {
  it("allows administrators to manage other users and their sessions", () => {
    expect(UserPolicy.canList(admin, [])).toBe(true);
    expect(UserPolicy.canCreate(admin, [])).toBe(true);
    expect(UserPolicy.canUpdate(admin, [target])).toBe(true);
    expect(UserPolicy.canDelete(admin, [target])).toBe(true);
    expect(UserPolicy.canBan(admin, [target])).toBe(true);
    expect(UserPolicy.canSetPassword(admin, [target])).toBe(true);
    expect(UserPolicy.canManageSessions(admin, [target])).toBe(true);
    expect(UserPolicy.canImpersonate(admin, [target])).toBe(true);
  });

  it("rejects non-admin actors and destructive self-management", () => {
    expect(UserPolicy.canList(target, [])).toBe(false);
    expect(UserPolicy.canDelete(admin, [admin])).toBe(false);
    expect(UserPolicy.canBan(admin, [admin])).toBe(false);
    expect(UserPolicy.canImpersonate(admin, [admin])).toBe(false);
    expect(UserPolicy.canSetRole(admin, [admin], "user")).toBe(false);
    expect(UserPolicy.canSetRole(admin, [admin], "admin")).toBe(true);
  });

  it("allows an impersonated actor to stop impersonating", () => {
    expect(UserPolicy.canStopImpersonating({ ...target, impersonatedBy: admin.id }, []))
      .toBe(true);
    expect(UserPolicy.canStopImpersonating(target, [])).toBe(false);
  });
});
