// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUser: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { createTestClient, deferred, queryWrapper } from "@/shared/tests/test-utils";
import { adminKeys } from "../../../../../admin.query";
import {
  databaseKeys,
  defaultDatabaseTableDataParams,
  type DatabaseTableData,
  type DatabaseTableDataParams,
  type DatabaseTableInfo,
} from "../../../../database.query";
import { useDeleteRow } from "../use-delete-row.hook";

const now = new Date("2026-01-01T00:00:00.000Z");
const admin = {
  id: "admin",
  email: "admin@example.com",
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
  role: "admin",
};
const existingRecord = {
  id: "record-one",
  userId: admin.id,
  title: "Before",
  body: "Body",
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
};
const row = {
  id: existingRecord.id,
  user_id: admin.id,
  title: existingRecord.title,
  body: existingRecord.body,
};
const activeParams: DatabaseTableDataParams = {
  page: 2,
  sort: { column: "title", direction: "asc" },
  filter: "before",
};
const activeKey = databaseKeys.tableData(admin.id, "test_record", activeParams);
const otherKey = databaseKeys.tableData(
  admin.id,
  "test_record",
  defaultDatabaseTableDataParams,
);
const tablesKey = databaseKeys.tables(admin.id);
const statsKey = adminKeys.stats(admin.id);
const otherActorStatsKey = adminKeys.stats("other-admin");
const tablesBefore: DatabaseTableInfo[] = [{ name: "test_record", rowCount: 1 }];
const statsBefore = { totalUsers: 1, activeUsers: 1, bannedUsers: 0 };

describe("useDeleteRow", () => {
  it("keeps every cached variant authoritative and invalidates the actor admin family", async () => {
    await seed();
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const activeBefore = tableWithPost(2);
    const otherBefore = tableWithPost();
    client.setQueryData<DatabaseTableData>(activeKey, activeBefore);
    client.setQueryData<DatabaseTableData>(otherKey, otherBefore);
    client.setQueryData(tablesKey, tablesBefore);
    client.setQueryData(statsKey, statsBefore);
    client.setQueryData(otherActorStatsKey, statsBefore);
    const { result } = renderHook(() => useDeleteRow(admin.id, "test_record"), {
      wrapper: queryWrapper(client),
    });

    let request!: ReturnType<typeof result.current.handleDeleteRow>;
    act(() => {
      request = result.current.handleDeleteRow(existingRecord.id);
    });
    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(client.getQueryData(activeKey)).toEqual(activeBefore);
    expect(client.getQueryData(otherKey)).toEqual(otherBefore);
    expect(client.getQueryData(tablesKey)).toEqual(tablesBefore);
    expect(client.getQueryData(statsKey)).toEqual(statsBefore);

    await act(async () => {
      auth.resolve({ user: { id: admin.id, role: admin.role } } as never);
      await request;
    });

    expect(client.getQueryData(activeKey)).toEqual(activeBefore);
    expect(client.getQueryData(otherKey)).toEqual(otherBefore);
    expect(client.getQueryData(tablesKey)).toEqual(tablesBefore);
    expect(client.getQueryData(statsKey)).toEqual(statsBefore);
    expect(client.getQueryState(activeKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(otherKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(tablesKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(statsKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(otherActorStatsKey)?.isInvalidated).toBe(false);
    await PostDB(db, schema, { test_record: [] });
  });

  it("rejects a sensitive-table write and leaves the real database and cache unchanged", async () => {
    await seed();
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const sensitiveKey = databaseKeys.tableData(
      admin.id,
      "user",
      defaultDatabaseTableDataParams,
    );
    const sensitiveBefore = tableWithAdmin();
    client.setQueryData(sensitiveKey, sensitiveBefore);
    client.setQueryData(statsKey, statsBefore);
    const { result } = renderHook(() => useDeleteRow(admin.id, "user"), {
      wrapper: queryWrapper(client),
    });

    let request!: ReturnType<typeof result.current.handleDeleteRow>;
    act(() => {
      request = result.current.handleDeleteRow(admin.id);
    });
    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(client.getQueryData(sensitiveKey)).toEqual(sensitiveBefore);

    const rejection = expect(request).rejects.toThrow(
      "Forbidden - database write access denied",
    );
    await act(async () => {
      auth.resolve({ user: { id: admin.id, role: admin.role } } as never);
      await rejection;
    });

    expect(client.getQueryData(sensitiveKey)).toEqual(sensitiveBefore);
    expect(client.getQueryData(statsKey)).toEqual(statsBefore);
    expect(client.getQueryState(sensitiveKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(statsKey)?.isInvalidated).toBe(true);
    await PostDB(db, schema, {
      user: [{ id: admin.id, email: admin.email, role: "admin" }],
      test_record: [{ id: existingRecord.id, title: existingRecord.title }],
    });
  });
});

async function seed() {
  await PreDB(db, schema, { user: [admin], test_record: [existingRecord] });
}

function tableWithPost(page = 1): DatabaseTableData {
  return { rows: [row], columns: [], total: 1, page, totalPages: 1 };
}

function tableWithAdmin(): DatabaseTableData {
  return {
    rows: [{ id: admin.id, email: admin.email, role: admin.role }],
    columns: [],
    total: 1,
    page: 1,
    totalPages: 1,
  };
}
