import { describe, expect, it } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";
import { ViewTable } from "../view-table.service";

describe("ViewTable", () => {
  it("returns an administrator's requested page", async () => {
    const now = new Date();
    await PreDB(db, schema, {
      user: [{
        id: "one",
        email: "one@example.com",
        name: "One",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      }],
    });

    const result = await ViewTable.execute({
      actor: { id: "admin", role: "admin" },
      input: { tableName: "user", page: 1, limit: 10 },
    });

    expect(result).toMatchObject({ total: 1, page: 1, totalPages: 1 });
    expect(result.rows[0]).toMatchObject({ id: "one", email: "one@example.com" });
    expect(result.columns).toContainEqual(expect.objectContaining({
      name: "id",
      isPrimaryKey: true,
    }));
  });

  it("rejects a non-administrator before exposing rows", async () => {
    await expect(ViewTable.execute({
      actor: { id: "member", role: "user" },
      input: { tableName: "user", page: 1, limit: 10 },
    })).rejects.toThrow("Forbidden - admin role required");
  });
});
