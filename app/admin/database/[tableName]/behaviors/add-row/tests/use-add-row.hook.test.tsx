// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

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
import { useAddRow } from "../use-add-row.hook";

const now = new Date("2026-01-01T00:00:00.000Z");
const admin = {
  id: "admin",
  email: "admin@example.com",
  emailVerified: true,
  createdAt: now,
  updatedAt: now,
  role: "admin",
};
const activeParams: DatabaseTableDataParams = {
  page: 2,
  sort: { column: "title", direction: "desc" },
  filter: "created",
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
const tablesBefore: DatabaseTableInfo[] = [{ name: "test_record", rowCount: 0 }];
const statsBefore = { totalUsers: 1, activeUsers: 1, bannedUsers: 0 };

describe("useAddRow", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("keeps every cached variant authoritative and invalidates the actor admin family", async () => {
    await PreDB(db, schema, { user: [admin], test_record: [] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const activeBefore = emptyTable(2);
    const otherBefore = tableWithCachedRow();
    client.setQueryData<DatabaseTableData>(activeKey, activeBefore);
    client.setQueryData<DatabaseTableData>(otherKey, otherBefore);
    client.setQueryData(tablesKey, tablesBefore);
    client.setQueryData(statsKey, statsBefore);
    client.setQueryData(otherActorStatsKey, statsBefore);
    const { result } = renderHook(() => useAddRow(admin.id, "test_record"), {
      wrapper: queryWrapper(client),
    });

    let request!: ReturnType<typeof result.current.handleAddRow>;
    act(() => {
      request = result.current.handleAddRow({
        user_id: admin.id,
        title: "Created",
        body: "Body",
      });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(true));
    expect(client.getQueryData(activeKey)).toEqual(activeBefore);
    expect(client.getQueryData(otherKey)).toEqual(otherBefore);
    expect(client.getQueryData(tablesKey)).toEqual(tablesBefore);
    expect(client.getQueryData(statsKey)).toEqual(statsBefore);

    let created!: Awaited<typeof request>;
    await act(async () => {
      auth.resolve({ user: { id: admin.id, role: admin.role } } as never);
      created = await request;
    });

    expect(created).toMatchObject({ title: "Created", body: "Body" });
    expect(client.getQueryData(activeKey)).toEqual(activeBefore);
    expect(client.getQueryData(otherKey)).toEqual(otherBefore);
    expect(client.getQueryData(tablesKey)).toEqual(tablesBefore);
    expect(client.getQueryData(statsKey)).toEqual(statsBefore);
    expect(client.getQueryState(activeKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(otherKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(tablesKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(statsKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(otherActorStatsKey)?.isInvalidated).toBe(false);
    await PostDB(db, schema, {
      test_record: [{
        id: created.id,
        userId: admin.id,
        title: "Created",
        body: "Body",
        deletedAt: null,
      }],
    });
  });

  it("rejects a sensitive-table write and leaves the real database and cache unchanged", async () => {
    await PreDB(db, schema, { user: [admin], test_record: [] });
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
    const { result } = renderHook(() => useAddRow(admin.id, "user"), {
      wrapper: queryWrapper(client),
    });

    let request!: ReturnType<typeof result.current.handleAddRow>;
    act(() => {
      request = result.current.handleAddRow({
        email: "blocked@example.com",
        email_verified: 1,
      });
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
      test_record: [],
    });
  });

  it("rejects a production write through the real Action path", async () => {
    await PreDB(db, schema, { user: [admin], test_record: [] });
    vi.stubEnv("NODE_ENV", "production");
    vi.mocked(getUser).mockResolvedValue({
      user: { id: admin.id, role: admin.role },
    } as never);
    const client = createTestClient();
    const { result } = renderHook(() => useAddRow(admin.id, "test_record"), {
      wrapper: queryWrapper(client),
    });

    await act(async () => {
      await expect(result.current.handleAddRow({
        user_id: admin.id,
        title: "Blocked",
        body: "Body",
      })).rejects.toThrow("Forbidden - database write access denied");
    });
    await PostDB(db, schema, { test_record: [] });
  });
});

function emptyTable(page = 1): DatabaseTableData {
  return { rows: [], columns: [], total: 0, page, totalPages: 0 };
}

function tableWithCachedRow(): DatabaseTableData {
  return {
    rows: [{ id: "cached", title: "Cached", body: "Body" }],
    columns: [],
    total: 1,
    page: 1,
    totalPages: 1,
  };
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
