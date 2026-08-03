import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { userRecord } from "../../../tests/fixtures";
import { UnbanUser } from "../unban-user.service";

describe("UnbanUser service scenarios", () => {
  it("clears every ban field", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({
      id: "target",
      email: "target@example.com",
      banned: true,
      banReason: "reason",
      banExpires: new Date("2027-01-01"),
    });
    await PreDB(db, schema, { user: [admin, target] });
    await expect(UnbanUser.execute({
      actor: admin,
      input: { userId: target.id },
    })).resolves.toMatchObject({
      id: target.id,
      banned: false,
      banReason: null,
      banExpires: null,
    });
    await PostDB(db, schema, {
      user: [{ id: target.id, banned: false, banReason: null, banExpires: null }],
    }, { allowExtraRows: true });
  });
});
