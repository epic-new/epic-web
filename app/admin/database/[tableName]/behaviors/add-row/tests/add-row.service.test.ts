import { afterEach, describe, expect, it, vi } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { AddRow } from "../add-row.service";

const now = new Date("2026-01-01T00:00:00.000Z");
const admin = {
  id: "admin",
  email: "admin@example.com",
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
  role: "admin",
};

describe("AddRow", () => {
  afterEach(() => vi.unstubAllEnvs());

  it.each(["development", "test"])(
    "inserts a non-sensitive row for an administrator in %s",
    async (environment) => {
      await PreDB(db, schema, { user: [admin], test_record: [] });
      vi.stubEnv("NODE_ENV", environment);

      const created = await AddRow.execute({
        actor: { id: admin.id, role: admin.role },
        input: {
          tableName: "test_record",
          data: { user_id: admin.id, title: "Created", body: "Body" },
        },
      });

      expect(created).toMatchObject({
        user_id: admin.id,
        title: "Created",
        body: "Body",
      });
      await PostDB(db, schema, {
        test_record: [{
          id: created.id,
          userId: admin.id,
          title: "Created",
          body: "Body",
          deletedAt: null,
        }],
      });
    },
  );

  it("rejects a sensitive-table write without changing the database", async () => {
    await PreDB(db, schema, { user: [admin] });

    await expect(AddRow.execute({
      actor: { id: admin.id, role: admin.role },
      input: {
        tableName: "user",
        data: { email: "blocked@example.com", email_verified: 1 },
      },
    })).rejects.toThrow("Forbidden - database write access denied");
    await PostDB(db, schema, {
      user: [{ id: admin.id, email: admin.email, role: "admin" }],
    });
  });

  it("rejects a production write without changing the database", async () => {
    await PreDB(db, schema, { user: [admin], test_record: [] });
    vi.stubEnv("NODE_ENV", "production");

    await expect(AddRow.execute({
      actor: { id: admin.id, role: admin.role },
      input: {
        tableName: "test_record",
        data: { user_id: admin.id, title: "Blocked", body: "Body" },
      },
    })).rejects.toThrow("Forbidden - database write access denied");
    await PostDB(db, schema, { test_record: [] });
  });

  it("rejects a non-administrator without changing the database", async () => {
    await PreDB(db, schema, { user: [admin], test_record: [] });

    await expect(AddRow.execute({
      actor: { id: "member", role: "user" },
      input: {
        tableName: "test_record",
        data: { user_id: admin.id, title: "Blocked", body: "Body" },
      },
    })).rejects.toThrow("Forbidden - database write access denied");
    await PostDB(db, schema, { test_record: [] });
  });
});
