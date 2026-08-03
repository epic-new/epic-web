// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
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
import { createTestClient, deferred, queryWrapper } from "@/shared/tests/test-utils";
import { defaultUsersParams, usersKeys } from "../../../users.query";
import { sessionResult, userRecord } from "../../../tests/fixtures";
import { useDeleteUser } from "../use-delete-user.hook";

describe("useDeleteUser hook scenarios", () => {
  it("removes optimistically then commits the real deletion", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, { user: [admin, target] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.list(admin.id, defaultUsersParams);
    const usersOnlyKey = usersKeys.list(admin.id, {
      ...defaultUsersParams,
      roleFilter: "user",
    });
    const adminsOnlyKey = usersKeys.list(admin.id, {
      ...defaultUsersParams,
      roleFilter: "admin",
    });
    const unrelatedSearchKey = usersKeys.list(admin.id, {
      ...defaultUsersParams,
      search: "admin@",
    });
    client.setQueryData(key, { users: [target], total: 1 });
    client.setQueryData(usersOnlyKey, { users: [target], total: 1 });
    const adminsBefore = { users: [admin], total: 1 };
    client.setQueryData(adminsOnlyKey, adminsBefore);
    client.setQueryData(unrelatedSearchKey, adminsBefore);
    const { result } = renderHook(() => useDeleteUser(admin.id), {
      wrapper: queryWrapper(client),
    });
    let pending!: ReturnType<typeof result.current.handleDeleteUser>;
    act(() => { pending = result.current.handleDeleteUser(target.id); });
    await waitFor(() => expect(client.getQueryData<{ users: unknown[] }>(key)?.users).toEqual([]));
    expect(client.getQueryData(usersOnlyKey)).toEqual({ users: [], total: 0 });
    expect(client.getQueryData(adminsOnlyKey)).toEqual(adminsBefore);
    expect(client.getQueryData(unrelatedSearchKey)).toEqual(adminsBefore);
    await act(async () => { auth.resolve(sessionResult(admin)); await pending; });
    expect(client.getQueryData(adminsOnlyKey)).toEqual(adminsBefore);
    expect(client.getQueryData(unrelatedSearchKey)).toEqual(adminsBefore);
    await PostDB(db, schema, { user: [{ id: admin.id }] });
  });

  it("restores the exact cache after real self-delete authorization fails", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    await PreDB(db, schema, { user: [admin] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.list(admin.id, defaultUsersParams);
    const before = { users: [admin], total: 1 };
    client.setQueryData(key, before);
    const { result } = renderHook(() => useDeleteUser(admin.id), {
      wrapper: queryWrapper(client),
    });
    let pending!: ReturnType<typeof result.current.handleDeleteUser>;
    act(() => { pending = result.current.handleDeleteUser(admin.id); });
    await waitFor(() => expect(client.getQueryData<{ users: unknown[] }>(key)?.users).toEqual([]));
    const rejection = expect(pending).rejects.toThrow("Cannot delete your own account");
    await act(async () => { auth.resolve(sessionResult(admin)); await rejection; });
    expect(client.getQueryData(key)).toEqual(before);
    await PostDB(db, schema, { user: [admin] });
  });
});
