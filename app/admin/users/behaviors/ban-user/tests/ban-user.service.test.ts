import { describe, expect, it } from "vitest";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { sql } from "drizzle-orm";
import { userRecord } from "../../../tests/fixtures";
import { BanUser } from "../ban-user.service";

describe("BanUser service scenarios", () => {
  it("bans the target and revokes all active sessions", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, {
      user: [admin, target],
      session: [{
        id: "session",
        token: "token",
        userId: target.id,
        expiresAt: new Date("2027-01-01"),
        createdAt: target.createdAt,
        updatedAt: target.updatedAt,
      }],
    });
    await expect(BanUser.execute({
      actor: admin,
      input: { userId: target.id, banReason: "abuse" },
    })).resolves.toMatchObject({ id: target.id, banned: true, banReason: "abuse" });
    await PostDB(db, schema, {
      user: [{ id: target.id, banned: true, banReason: "abuse" }],
      session: [],
    }, { allowExtraRows: true });
  });

  it("rejects self-ban without changing the database", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    await PreDB(db, schema, { user: [admin] });
    await expect(BanUser.execute({
      actor: admin,
      input: { userId: admin.id },
    })).rejects.toThrow("Cannot ban your own account");
    await PostDB(db, schema, { user: [{ id: admin.id, banned: false }] });
  });

  it("rolls the ban back when session revocation fails", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    const persistedSession = {
      id: "session",
      token: "token",
      userId: target.id,
      expiresAt: new Date("2027-01-01"),
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
    };
    await PreDB(db, schema, {
      user: [admin, target],
      session: [persistedSession],
    });
    await db.run(sql.raw(`
      create trigger fail_target_session_delete
      before delete on session
      begin
        select raise(abort, 'session revocation failed');
      end
    `));

    try {
      await expect(BanUser.execute({
        actor: admin,
        input: { userId: target.id, banReason: "abuse" },
      })).rejects.toThrow('Failed query: delete from "session"');
    } finally {
      await db.run(sql`drop trigger fail_target_session_delete`);
    }

    await PostDB(db, schema, {
      user: [admin, target],
      session: [persistedSession],
    });
  });
});
