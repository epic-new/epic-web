import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { userRecord } from "../../../tests/fixtures";
import { UpdateUser } from "../update-user.service";

describe("UpdateUser service scenarios", () => {
  it("updates the authorized target", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, { user: [admin, target] });
    await expect(UpdateUser.execute({
      actor: admin,
      input: { userId: target.id, name: "Updated" },
    })).resolves.toMatchObject({ id: target.id, name: "Updated" });
    await PostDB(
      db,
      schema,
      { user: [{ id: target.id, name: "Updated" }] },
      { allowExtraRows: true },
    );
  });

  it("does not let an admin demote their own account", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    await PreDB(db, schema, { user: [admin] });
    await expect(UpdateUser.execute({
      actor: admin,
      input: { userId: admin.id, role: "user" },
    })).rejects.toThrow("Cannot remove your own admin role");
    await PostDB(db, schema, { user: [{ id: admin.id, role: "admin" }] });
  });
});
