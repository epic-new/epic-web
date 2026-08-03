import { describe, expect, it } from "vitest";

import { DatabasePolicy } from "../database.policy";

describe("DatabasePolicy", () => {
  it("allows administrators to inspect database records", () => {
    const actor = { id: "admin", role: "admin" };

    expect(DatabasePolicy.inspect(actor, [])).toBe(true);
  });

  it.each(["development", "test"])(
    "allows administrators to modify a non-sensitive table in %s",
    (environment) => {
      expect(DatabasePolicy.modify(
        { id: "admin", role: "admin" },
        [],
        { tableName: "test_record", environment },
      )).toBe(true);
    },
  );

  it.each(["user", "session", "account", "verification"])(
    "denies generic writes to the sensitive %s table",
    (tableName) => {
      expect(DatabasePolicy.modify(
        { id: "admin", role: "admin" },
        [],
        { tableName, environment: "development" },
      )).toBe(false);
    },
  );

  it.each(["production", "preview", undefined])(
    "denies generic writes in the %s environment",
    (environment) => {
      expect(DatabasePolicy.modify(
        { id: "admin", role: "admin" },
        [],
        { tableName: "test_record", environment },
      )).toBe(false);
    },
  );

  it("denies non-administrators from inspecting or modifying records", () => {
    const actor = { id: "user", role: "user" };

    expect(DatabasePolicy.inspect(actor, [])).toBe(false);
    expect(DatabasePolicy.modify(
      actor,
      [],
      { tableName: "test_record", environment: "test" },
    )).toBe(false);
  });
});
