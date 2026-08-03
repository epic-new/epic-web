import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUser: vi.fn() }));

import { getUser } from "@/lib/auth";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { getAdminStats } from "../admin-stats.action";

describe("getAdminStats", () => {
  it("returns an error for an unauthenticated request", async () => {
    vi.mocked(getUser).mockResolvedValue({ user: null } as never);

    await expect(getAdminStats()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
  });

  it("returns persisted statistics through the real Service and Model", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const admin = {
      id: "admin",
      email: "admin@example.com",
      emailVerified: true,
      role: "admin",
      createdAt: now,
      updatedAt: now,
    };
    const banned = {
      id: "banned",
      email: "banned@example.com",
      emailVerified: true,
      banned: true,
      createdAt: now,
      updatedAt: now,
    };

    await PreDB(db, schema, { user: [admin, banned] });
    vi.mocked(getUser).mockResolvedValue({ user: admin } as never);

    await expect(getAdminStats()).resolves.toEqual({
      success: true,
      data: {
        totalUsers: 2,
        activeUsers: 1,
        bannedUsers: 1,
      },
    });
    await PostDB(db, schema, {
      user: [
        { ...admin, banned: null },
        { ...banned, role: null },
      ],
    });
  });

  it("translates an authorization failure", async () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    const user = {
      id: "user",
      email: "user@example.com",
      emailVerified: true,
      role: "user",
      createdAt: now,
      updatedAt: now,
    };

    await PreDB(db, schema, { user: [user] });
    vi.mocked(getUser).mockResolvedValue({ user } as never);

    await expect(getAdminStats()).resolves.toEqual({
      success: false,
      error: "Unauthorized",
    });
    await PostDB(db, schema, { user: [{ ...user, banned: null }] });
  });
});
