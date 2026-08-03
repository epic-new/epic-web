import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { userRecord } from "../../../tests/fixtures";
import { SetRole } from "../set-role.service";

describe("SetRole service scenarios", () => {
  it("promotes another user", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, { user: [admin, target] });
    await expect(SetRole.execute({
      actor: admin,
      input: { userId: target.id, role: "admin" },
    })).resolves.toMatchObject({ id: target.id, role: "admin" });
    await PostDB(
      db,
      schema,
      { user: [{ id: target.id, role: "admin" }] },
      { allowExtraRows: true },
    );
  });

  it("rejects self-demotion", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    await PreDB(db, schema, { user: [admin] });
    await expect(SetRole.execute({
      actor: admin,
      input: { userId: admin.id, role: "user" },
    })).rejects.toThrow("Cannot remove your own admin role");
  });
});
