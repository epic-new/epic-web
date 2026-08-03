import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";
import { now, userRecord } from "../../../tests/fixtures";
import { ListUsers } from "../list-users.service";

describe("ListUsers service scenarios", () => {
  it("returns an authorized filtered page from the real database", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    await PreDB(db, schema, {
      user: [
        admin,
        userRecord({ id: "one", email: "one@example.com" }),
        userRecord({ id: "two", email: "two@example.com", role: "admin" }),
      ],
    });

    await expect(ListUsers.execute({
      actor: admin,
      input: { filterField: "role", filterValue: "user", filterOperator: "eq" },
    })).resolves.toMatchObject({ total: 1, users: [{ id: "one" }] });
    expect(now).toBeInstanceOf(Date);
  });

  it("rejects a non-admin actor", async () => {
    const member = userRecord({ id: "member", email: "member@example.com" });
    await PreDB(db, schema, { user: [member] });
    await expect(ListUsers.execute({ actor: member })).rejects.toThrow(
      "Forbidden - admin role required",
    );
  });
});
