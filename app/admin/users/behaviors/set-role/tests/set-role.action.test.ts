import { describe, expect, it, vi } from "vitest";
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth", async () => ({
  ...(await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")),
  getUser: vi.fn(),
}));
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { sessionResult, userRecord } from "../../../tests/fixtures";
import { setRole } from "../set-role.action";

describe("setRole action scenarios", () => {
  it("promotes through the real Service and Model", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, { user: [admin, target] });
    vi.mocked(getUser).mockResolvedValue(sessionResult(admin));
    await expect(setRole({ userId: target.id, role: "admin" })).resolves
      .toMatchObject({ success: true, data: { id: target.id, role: "admin" } });
    await PostDB(db, schema, { user: [{ id: target.id, role: "admin" }] }, {
      allowExtraRows: true,
    });
  });
});
