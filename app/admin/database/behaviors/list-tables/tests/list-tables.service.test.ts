import { describe, expect, it } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";
import { ListTables } from "../list-tables.service";

describe("ListTables", () => {
  it("returns table summaries to an administrator", async () => {
    const now = new Date();
    await PreDB(db, schema, {
      user: [{
        id: "one",
        email: "one@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      }],
    });

    const result = await ListTables.execute({
      actor: { id: "admin", role: "admin" },
    });

    expect(result).toContainEqual({ name: "user", rowCount: 1 });
  });

  it("rejects a non-administrator", async () => {
    await expect(ListTables.execute({
      actor: { id: "member", role: "user" },
    })).rejects.toThrow("Forbidden - admin role required");
  });
});
