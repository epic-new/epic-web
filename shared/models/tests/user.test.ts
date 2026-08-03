import { describe, expect, it } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { UserModel } from "../user";

const now = new Date("2026-01-01T00:00:00.000Z");

describe("UserModel", () => {
  it("finds the first user with a requested role", async () => {
    await PreDB(db, schema, {
      user: [
        {
          id: "member",
          email: "member@example.com",
          emailVerified: true,
          role: "user",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "admin",
          email: "admin@example.com",
          emailVerified: true,
          role: "admin",
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await expect(UserModel.findFirstByRole("admin")).resolves.toMatchObject({
      id: "admin",
      role: "admin",
    });
    await expect(UserModel.findFirstByRole("missing")).resolves.toBeNull();
  });

  it("counts total, active, and banned users", async () => {
    await PreDB(db, schema, {
      user: [
        {
          id: "active",
          email: "active@example.com",
          emailVerified: true,
          banned: false,
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "banned",
          email: "banned@example.com",
          emailVerified: true,
          banned: true,
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await expect(UserModel.getStats()).resolves.toEqual({
      totalUsers: 2,
      activeUsers: 1,
      bannedUsers: 1,
    });
    await PostDB(db, schema, {
      user: [
        { id: "active", banned: false },
        { id: "banned", banned: true },
      ],
    });
  });

  it("lists, filters, updates, and deletes plain user records", async () => {
    await PreDB(db, schema, {
      user: [
        {
          id: "admin",
          email: "admin@example.com",
          name: "Admin",
          emailVerified: true,
          role: "admin",
          createdAt: now,
          updatedAt: now,
        },
        {
          id: "member",
          email: "member@example.com",
          name: "Member",
          emailVerified: true,
          role: "user",
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    await expect(UserModel.find("member")).resolves.toMatchObject({
      id: "member",
    });
    await expect(UserModel.findByEmail("admin@example.com")).resolves.toMatchObject({
      id: "admin",
    });
    await expect(UserModel.list({
      searchValue: "member",
      searchField: "email",
      searchOperator: "contains",
      role: "user",
      limit: 10,
      offset: 0,
      sortDirection: "asc",
    })).resolves.toMatchObject({ total: 1, users: [{ id: "member" }] });

    await expect(UserModel.update("member", { role: "admin" })).resolves.toMatchObject({
      id: "member",
      role: "admin",
    });
    await expect(UserModel.delete("member")).resolves.toBe(true);
    await PostDB(db, schema, { user: [{ id: "admin" }] });
  });
});
