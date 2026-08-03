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
import { usersKeys } from "../../../users.query";
import { sessionResult, userRecord } from "../../../tests/fixtures";
import { useRevokeSession } from "../use-revoke-session.hook";

describe("useRevokeSession hook scenarios", () => {
  it("removes one session optimistically and from the database", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    const session = {
      id: "session",
      token: "token",
      userId: target.id,
      expiresAt: new Date("2027-01-01"),
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
      ipAddress: null,
      userAgent: null,
      impersonatedBy: null,
    };
    await PreDB(db, schema, { user: [admin, target], session: [session] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.sessionList(admin.id, target.id);
    client.setQueryData(key, [session]);
    const { result } = renderHook(() => useRevokeSession(admin.id), {
      wrapper: queryWrapper(client),
    });
    let pending!: ReturnType<typeof result.current.handleRevokeSession>;
    act(() => { pending = result.current.handleRevokeSession(session.token); });
    await waitFor(() => expect(client.getQueryData(key)).toEqual([]));
    await act(async () => { auth.resolve(sessionResult(admin)); await pending; });
    await PostDB(db, schema, { session: [] });
  });

  it("restores the exact cache and database after real authorization fails", async () => {
    const member = userRecord({ id: "member", email: "member@example.com" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    const session = {
      id: "session",
      token: "token",
      userId: target.id,
      expiresAt: new Date("2027-01-01"),
      createdAt: target.createdAt,
      updatedAt: target.updatedAt,
      ipAddress: null,
      userAgent: null,
      impersonatedBy: null,
    };
    await PreDB(db, schema, { user: [member, target], session: [session] });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);
    const client = createTestClient();
    const key = usersKeys.sessionList(member.id, target.id);
    const before = [session];
    client.setQueryData(key, before);
    const { result } = renderHook(() => useRevokeSession(member.id), {
      wrapper: queryWrapper(client),
    });
    let pending!: ReturnType<typeof result.current.handleRevokeSession>;
    act(() => { pending = result.current.handleRevokeSession(session.token); });
    await waitFor(() => expect(client.getQueryData(key)).toEqual([]));
    const rejection = expect(pending).rejects.toThrow("Forbidden - admin role required");
    await act(async () => { auth.resolve(sessionResult(member)); await rejection; });
    expect(client.getQueryData(key)).toEqual(before);
    await PostDB(db, schema, { user: [member, target], session: [session] });
  });
});
