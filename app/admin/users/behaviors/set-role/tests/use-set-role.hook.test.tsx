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
import { useSetRole } from "../use-set-role.hook";

describe("useSetRole hook scenarios", () => {
  it("shows the pending role then reconciles the persisted record", async () => {
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
    client.setQueryData(key, { users: [target], total: 1 });
    client.setQueryData(usersOnlyKey, { users: [target], total: 1 });
    client.setQueryData(adminsOnlyKey, { users: [], total: 0 });
    const { result } = renderHook(() => useSetRole(admin.id), { wrapper: queryWrapper(client) });
    let pending!: ReturnType<typeof result.current.handleSetRole>;
    act(() => { pending = result.current.handleSetRole({ userId: target.id, role: "admin" }); });
    await waitFor(() => expect(
      client.getQueryData<{ users: Array<{ role: string | null; pending?: boolean }> }>(key)?.users[0],
    ).toMatchObject({ role: "admin", pending: true }));
    expect(client.getQueryData(usersOnlyKey)).toEqual({ users: [], total: 0 });
    expect(client.getQueryData<{
      users: Array<{ id: string; role: string | null; pending?: boolean }>;
      total: number;
    }>(adminsOnlyKey)).toMatchObject({
      users: [{ id: target.id, role: "admin", pending: true }],
      total: 1,
    });
    await act(async () => { auth.resolve(sessionResult(admin)); await pending; });
    const reconciled = client.getQueryData<{
      users: Array<{ role: string | null; pending?: boolean }>;
    }>(key)?.users[0];
    expect(reconciled).toMatchObject({ role: "admin" });
    expect(reconciled?.pending).toBeUndefined();
    const filtered = client.getQueryData<{
      users: Array<{ role: string | null; pending?: boolean }>;
    }>(adminsOnlyKey)?.users[0];
    expect(filtered).toMatchObject({ role: "admin" });
    expect(filtered?.pending).toBeUndefined();
    await PostDB(db, schema, { user: [{ id: target.id, role: "admin" }] }, {
      allowExtraRows: true,
    });
  });

  it("restores the exact cache after real self-demotion authorization fails", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    await PreDB(db, schema, { user: [admin] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.list(admin.id, defaultUsersParams);
    const before = { users: [admin], total: 1 };
    client.setQueryData(key, before);
    const { result } = renderHook(() => useSetRole(admin.id), {
      wrapper: queryWrapper(client),
    });
    let pending!: ReturnType<typeof result.current.handleSetRole>;
    act(() => {
      pending = result.current.handleSetRole({ userId: admin.id, role: "user" });
    });
    await waitFor(() => expect(
      client.getQueryData<{ users: Array<{ role: string | null; pending?: boolean }> }>(key)
        ?.users[0],
    ).toMatchObject({ role: "user", pending: true }));
    const rejection = expect(pending).rejects.toThrow("Cannot remove your own admin role");
    await act(async () => { auth.resolve(sessionResult(admin)); await rejection; });
    expect(client.getQueryData(key)).toEqual(before);
    await PostDB(db, schema, { user: [admin] });
  });
});
