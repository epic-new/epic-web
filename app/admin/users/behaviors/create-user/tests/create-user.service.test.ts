import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { createAdminAuth } from "../../../tests/fixtures";
import { CreateUser } from "../create-user.service";

describe("CreateUser service scenarios", () => {
  it("creates a real Better Auth user and credential account", async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const admin = await createAdminAuth();

    const created = await CreateUser.execute({
      actor: admin.actor,
      sessionToken: admin.sessionToken,
      input: {
        email: "created@example.com",
        password: "password123",
        name: "Created",
        role: "user",
      },
    });

    expect(created).toMatchObject({ email: "created@example.com", role: "user" });
    await PostDB(db, schema, {
      user: [{ id: created.id, email: "created@example.com", name: "Created" }],
      account: [{ userId: created.id, providerId: "credential" }],
    }, { allowExtraRows: true });
  });
});
