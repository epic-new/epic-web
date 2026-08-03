// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUser: vi.fn() }));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { createTestClient, queryWrapper } from "@/shared/tests/test-utils";
import { adminKeys } from "../../../admin.query";
import { useAdminStats } from "../use-admin-stats.hook";

describe("Admin Stats hook scenarios", () => {
  it("loads statistics into only the authenticated actor's cache", async () => {
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
    const anotherActorStats = {
      totalUsers: 99,
      activeUsers: 99,
      bannedUsers: 0,
    };

    await PreDB(db, schema, { user: [admin, banned] });
    vi.mocked(getUser).mockResolvedValue({ user: admin } as never);

    const client = createTestClient();
    client.setQueryData(adminKeys.stats("another-admin"), anotherActorStats);
    const { result } = renderHook(() => useAdminStats(admin.id), {
      wrapper: queryWrapper(client),
    });

    expect(result.current.stats).toBeNull();
    await waitFor(() => {
      expect(result.current.stats).toEqual({
        totalUsers: 2,
        activeUsers: 1,
        bannedUsers: 1,
      });
    });
    expect(client.getQueryData(adminKeys.stats(admin.id))).toEqual(
      result.current.stats,
    );
    expect(client.getQueryData(adminKeys.stats("another-admin"))).toEqual(
      anotherActorStats,
    );
    await PostDB(db, schema, {
      user: [
        { ...admin, banned: null },
        { ...banned, role: null },
      ],
    });
  });
});
