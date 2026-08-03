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
import { useUnbanUser } from "../use-unban-user.hook";

describe("useUnbanUser hook scenarios", () => {
  it("marks pending, then reconciles the persisted unban", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com", banned: true });
    await PreDB(db, schema, { user: [admin, target] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.list(admin.id, defaultUsersParams);
    client.setQueryData(key, { users: [target], total: 1 });
    const { result } = renderHook(() => useUnbanUser(admin.id), { wrapper: queryWrapper(client) });
    let pending!: ReturnType<typeof result.current.handleUnbanUser>;
    act(() => { pending = result.current.handleUnbanUser(target.id); });
    await waitFor(() => expect(
      client.getQueryData<{ users: Array<{ banned: boolean | null; pending?: boolean }> }>(key)?.users[0],
    ).toMatchObject({ banned: false, pending: true }));
    await act(async () => { auth.resolve(sessionResult(admin)); await pending; });
    const reconciled = client.getQueryData<{
      users: Array<{ banned: boolean | null; banReason: string | null; pending?: boolean }>;
    }>(key)?.users[0];
    expect(reconciled).toMatchObject({ banned: false, banReason: null });
    expect(reconciled?.pending).toBeUndefined();
    await PostDB(db, schema, { user: [{ id: target.id, banned: false }] }, {
      allowExtraRows: true,
    });
  });

  it("restores the exact cache after real authorization fails", async () => {
    const member = userRecord({ id: "member", email: "member@example.com" });
    const target = userRecord({
      id: "target",
      email: "target@example.com",
      banned: true,
      banReason: "reason",
    });
    await PreDB(db, schema, { user: [member, target] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.list(member.id, defaultUsersParams);
    const before = { users: [target], total: 1 };
    client.setQueryData(key, before);
    const { result } = renderHook(() => useUnbanUser(member.id), {
      wrapper: queryWrapper(client),
    });
    let pending!: ReturnType<typeof result.current.handleUnbanUser>;
    act(() => { pending = result.current.handleUnbanUser(target.id); });
    await waitFor(() => expect(
      client.getQueryData<{ users: Array<{ banned: boolean | null; pending?: boolean }> }>(key)
        ?.users[0],
    ).toMatchObject({ banned: false, pending: true }));
    const rejection = expect(pending).rejects.toThrow("Forbidden - admin role required");
    await act(async () => { auth.resolve(sessionResult(member)); await rejection; });
    expect(client.getQueryData(key)).toEqual(before);
    await PostDB(db, schema, { user: [member, target] });
  });
});
