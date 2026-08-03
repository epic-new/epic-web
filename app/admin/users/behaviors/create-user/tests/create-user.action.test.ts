import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", async () => ({
  ...(await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")),
  getUser: vi.fn(),
}));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { createAdminAuth, sessionResult } from "../../../tests/fixtures";
import { createUser } from "../create-user.action";

describe("createUser action scenarios", () => {
  it("creates a real Better Auth user through the Controller", async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const admin = await createAdminAuth();
    vi.mocked(getUser).mockResolvedValue(
      sessionResult(admin.actor, null, admin.sessionToken),
    );

    const response = await createUser({
      email: "created@example.com",
      password: "password123",
      name: "Created",
      role: "user",
    });
    expect(response).toMatchObject({
      success: true,
      data: { email: "created@example.com" },
    });
    if (!response.success) throw new Error(response.error);
    await PostDB(
      db,
      schema,
      { user: [{ id: response.data.id, email: "created@example.com" }] },
      { allowExtraRows: true },
    );
  });
});
