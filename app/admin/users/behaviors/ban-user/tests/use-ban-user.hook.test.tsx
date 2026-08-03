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
import { useBanUser } from "../use-ban-user.hook";

describe("useBanUser hook scenarios", () => {
  it("marks pending, then reconciles the persisted ban", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, { user: [admin, target] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.list(admin.id, defaultUsersParams);
    client.setQueryData(key, { users: [target], total: 1 });
    const { result } = renderHook(() => useBanUser(admin.id), { wrapper: queryWrapper(client) });
    let pending!: ReturnType<typeof result.current.handleBanUser>;
    act(() => { pending = result.current.handleBanUser({ userId: target.id, banReason: "reason" }); });
    await waitFor(() => expect(
      client.getQueryData<{ users: Array<{ banned: boolean | null; pending?: boolean }> }>(key)?.users[0],
    ).toMatchObject({ banned: true, pending: true }));
    await act(async () => { auth.resolve(sessionResult(admin)); await pending; });
    const reconciled = client.getQueryData<{
      users: Array<{ banned: boolean | null; banReason: string | null; pending?: boolean }>;
    }>(key)?.users[0];
    expect(reconciled).toMatchObject({ banned: true, banReason: "reason" });
    expect(reconciled?.pending).toBeUndefined();
    await PostDB(db, schema, { user: [{ id: target.id, banned: true }] }, {
      allowExtraRows: true,
    });
  });

  it("restores the exact cache after real self-ban authorization fails", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    await PreDB(db, schema, { user: [admin] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.list(admin.id, defaultUsersParams);
    const before = { users: [admin], total: 1 };
    client.setQueryData(key, before);
    const { result } = renderHook(() => useBanUser(admin.id), { wrapper: queryWrapper(client) });
    let pending!: ReturnType<typeof result.current.handleBanUser>;
    act(() => { pending = result.current.handleBanUser({ userId: admin.id }); });
    await waitFor(() => expect(
      client.getQueryData<{ users: Array<{ banned: boolean | null; pending?: boolean }> }>(key)?.users[0],
    ).toMatchObject({ banned: true, pending: true }));
    const rejection = expect(pending).rejects.toThrow("Cannot ban your own account");
    await act(async () => { auth.resolve(sessionResult(admin)); await rejection; });
    expect(client.getQueryData(key)).toEqual(before);
    await PostDB(db, schema, { user: [admin] });
  });
});
