import { describe, expect, it } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { GetAdminStats } from "../admin-stats.service";

describe("GetAdminStats", () => {
  it("counts active and banned users for an admin", async () => {
    const now = new Date();
    await PreDB(db, schema, {
      user: [
        { id: "admin", email: "admin@example.com", emailVerified: true, role: "admin", createdAt: now, updatedAt: now },
        { id: "active", email: "active@example.com", emailVerified: true, banned: false, createdAt: now, updatedAt: now },
        { id: "banned", email: "banned@example.com", emailVerified: true, banned: true, createdAt: now, updatedAt: now },
      ],
    });

    await expect(
      GetAdminStats.execute({ actor: { id: "admin", role: "admin" } }),
    ).resolves.toEqual({ totalUsers: 3, activeUsers: 2, bannedUsers: 1 });

    await PostDB(db, schema, {
      user: [
        { id: "admin", email: "admin@example.com", emailVerified: true, role: "admin", banned: null },
        { id: "active", email: "active@example.com", emailVerified: true, role: null, banned: false },
        { id: "banned", email: "banned@example.com", emailVerified: true, role: null, banned: true },
      ],
    });
  });

  it("rejects a non-admin actor", async () => {
    await expect(
      GetAdminStats.execute({ actor: { id: "user", role: "user" } }),
    ).rejects.toThrow("Unauthorized");
  });
});
