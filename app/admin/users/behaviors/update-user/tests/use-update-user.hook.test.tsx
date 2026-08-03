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
import { useUpdateUser } from "../use-update-user.hook";

describe("useUpdateUser hook scenarios", () => {
  it("shows the pending edit then persists and reconciles it", async () => {
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
    const oldSearchKey = usersKeys.list(admin.id, {
      ...defaultUsersParams,
      search: "target@",
    });
    const newSearchKey = usersKeys.list(admin.id, {
      ...defaultUsersParams,
      search: "renamed@",
    });
    client.setQueryData(key, { users: [target], total: 1 });
    client.setQueryData(usersOnlyKey, { users: [target], total: 1 });
    client.setQueryData(adminsOnlyKey, { users: [], total: 0 });
    client.setQueryData(oldSearchKey, { users: [target], total: 1 });
    client.setQueryData(newSearchKey, { users: [], total: 0 });
    const { result } = renderHook(() => useUpdateUser(admin.id), {
      wrapper: queryWrapper(client),
    });
    let pending!: ReturnType<typeof result.current.handleUpdateUser>;
    act(() => {
      pending = result.current.handleUpdateUser({
        userId: target.id,
        email: "renamed@example.com",
        name: "Updated",
        role: "admin",
      });
    });
    await waitFor(() => expect(
      client.getQueryData<{ users: Array<{ name: string | null; pending?: boolean }> }>(key)?.users[0],
    ).toMatchObject({ name: "Updated", pending: true }));
    expect(client.getQueryData(usersOnlyKey)).toEqual({ users: [], total: 0 });
    expect(client.getQueryData(oldSearchKey)).toEqual({ users: [], total: 0 });
    expect(client.getQueryData<{
      users: Array<{ email: string; pending?: boolean }>;
      total: number;
    }>(newSearchKey)).toMatchObject({
      users: [{ email: "renamed@example.com", pending: true }],
      total: 1,
    });
    expect(client.getQueryData<{
      users: Array<{ id: string; role: string | null; pending?: boolean }>;
      total: number;
    }>(adminsOnlyKey)).toMatchObject({
      users: [{ id: target.id, role: "admin", pending: true }],
      total: 1,
    });
    await act(async () => { auth.resolve(sessionResult(admin)); await pending; });
    const updated = client.getQueryData<{
      users: Array<{ id: string; name: string | null; pending?: boolean }>;
    }>(key)?.users.find((entry) => entry.id === target.id);
    expect(updated).toMatchObject({ id: target.id, name: "Updated" });
    expect(updated?.pending).toBeUndefined();
    const filtered = client.getQueryData<{
      users: Array<{ id: string; role: string | null; pending?: boolean }>;
      total: number;
    }>(adminsOnlyKey);
    expect(filtered).toMatchObject({
      users: [{ id: target.id, role: "admin" }],
      total: 1,
    });
    expect(filtered?.users[0]?.pending).toBeUndefined();
    expect(client.getQueryData(oldSearchKey)).toEqual({ users: [], total: 0 });
    const searched = client.getQueryData<{
      users: Array<{ email: string; pending?: boolean }>;
      total: number;
    }>(newSearchKey);
    expect(searched).toMatchObject({
      users: [{ email: "renamed@example.com" }],
      total: 1,
    });
    expect(searched?.users[0]?.pending).toBeUndefined();
    await PostDB(db, schema, { user: [{
      id: target.id,
      email: "renamed@example.com",
      name: "Updated",
      role: "admin",
    }] }, {
      allowExtraRows: true,
    });
  });

  it("restores the exact user after real validation failure", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, { user: [admin, target] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.list(admin.id, defaultUsersParams);
    const before = { users: [target], total: 1 };
    client.setQueryData(key, before);
    const { result } = renderHook(() => useUpdateUser(admin.id), {
      wrapper: queryWrapper(client),
    });
    let pending!: ReturnType<typeof result.current.handleUpdateUser>;
    act(() => { pending = result.current.handleUpdateUser({ userId: target.id, name: "" }); });
    await waitFor(() => expect(
      client.getQueryData<{ users: Array<{ name: string | null; pending?: boolean }> }>(key)?.users[0],
    ).toMatchObject({ name: "", pending: true }));
    const rejection = expect(pending).rejects.toThrow("Name cannot be empty");
    await act(async () => { auth.resolve(sessionResult(admin)); await rejection; });
    expect(client.getQueryData(key)).toEqual(before);
    await PostDB(db, schema, { user: [admin, target] });
  });
});
