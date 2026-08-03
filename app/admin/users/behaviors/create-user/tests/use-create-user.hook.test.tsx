// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth", async () => ({
  ...(await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")),
  getUser: vi.fn(),
}));
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import {
  createTestClient,
  deferred,
  queryWrapper,
} from "@/shared/tests/test-utils";
import { defaultUsersParams, usersKeys } from "../../../users.query";
import { createAdminAuth, sessionResult } from "../../../tests/fixtures";
import { useCreateUser } from "../use-create-user.hook";

describe("useCreateUser hook scenarios", () => {
  it("shows an optimistic user then reconciles the real Action result", async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const admin = await createAdminAuth();
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.list(admin.actor.id, defaultUsersParams);
    const adminOnlyKey = usersKeys.list(admin.actor.id, {
      ...defaultUsersParams,
      roleFilter: "admin",
    });
    const secondPageKey = usersKeys.list(admin.actor.id, {
      ...defaultUsersParams,
      page: 2,
    });
    const unrelatedSearchKey = usersKeys.list(admin.actor.id, {
      ...defaultUsersParams,
      search: "missing",
    });
    client.setQueryData(key, { users: [], total: 0 });
    client.setQueryData(adminOnlyKey, { users: [], total: 0 });
    client.setQueryData(secondPageKey, { users: [], total: 0 });
    client.setQueryData(unrelatedSearchKey, { users: [], total: 0 });
    const { result } = renderHook(() => useCreateUser(admin.actor.id), {
      wrapper: queryWrapper(client),
    });

    let pending!: ReturnType<typeof result.current.handleCreateUser>;
    act(() => {
      pending = result.current.handleCreateUser({
        email: "created@example.com",
        password: "password123",
        name: "Created",
        role: "user",
      });
    });
    await waitFor(() => expect(client.getQueryData<typeof key>(key)).toBeDefined());
    expect((client.getQueryData<{ users: Array<{ pending?: boolean }> }>(key))?.users[0])
      .toMatchObject({ email: "created@example.com", pending: true });
    expect(client.getQueryData(adminOnlyKey)).toEqual({ users: [], total: 0 });
    expect(client.getQueryData(secondPageKey)).toEqual({ users: [], total: 1 });
    expect(client.getQueryData(unrelatedSearchKey)).toEqual({ users: [], total: 0 });

    await act(async () => {
      auth.resolve(sessionResult(admin.actor, null, admin.sessionToken));
      await pending;
    });
    const created = client.getQueryData<{ users: Array<{ id: string; pending?: boolean }> }>(key)
      ?.users.find((entry) => !entry.pending && entry.id !== admin.actor.id);
    expect(created).toBeDefined();
    expect(client.getQueryData(adminOnlyKey)).toEqual({ users: [], total: 0 });
    expect(client.getQueryData(secondPageKey)).toEqual({ users: [], total: 1 });
    expect(client.getQueryData(unrelatedSearchKey)).toEqual({ users: [], total: 0 });
    await PostDB(db, schema, { user: [{ id: created!.id, email: "created@example.com" }] }, {
      allowExtraRows: true,
    });
  });

  it("rolls the optimistic user back after real Service validation fails", async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const admin = await createAdminAuth("rollback-admin@example.com");
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.list(admin.actor.id, defaultUsersParams);
    const before = { users: [], total: 0 };
    client.setQueryData(key, before);
    const { result } = renderHook(() => useCreateUser(admin.actor.id), {
      wrapper: queryWrapper(client),
    });
    let pending!: ReturnType<typeof result.current.handleCreateUser>;
    act(() => {
      pending = result.current.handleCreateUser({
        email: "invalid@example.com",
        password: "password123",
        name: "",
        role: "user",
      });
    });
    await waitFor(() => expect(
      client.getQueryData<{ users: Array<{ pending?: boolean }> }>(key)?.users[0],
    ).toMatchObject({ pending: true }));
    const rejection = expect(pending).rejects.toThrow("Name is required");
    await act(async () => {
      auth.resolve(sessionResult(admin.actor, null, admin.sessionToken));
      await rejection;
    });
    expect(client.getQueryData(key)).toEqual(before);
    await PostDB(db, schema, { user: [{ id: admin.actor.id }] }, { allowExtraRows: true });
  });
});
