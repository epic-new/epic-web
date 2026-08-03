// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));
vi.mock("@/lib/auth", async () => ({
  ...(await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")),
  getUser: vi.fn(),
}));
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PreDB } from "@/lib/db-test";
import { createTestClient, queryWrapper } from "@/shared/tests/test-utils";
import { usersKeys } from "../../../users.query";
import { sessionResult, userRecord } from "../../../tests/fixtures";
import { useListUsers } from "../use-list-users.hook";

describe("useListUsers hook scenarios", () => {
  it("loads the actor-partitioned users cache through the real Action", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, { user: [admin, target] });
    vi.mocked(getUser).mockResolvedValue(sessionResult(admin));
    const client = createTestClient();
    const { result } = renderHook(() => useListUsers(admin.id), {
      wrapper: queryWrapper(client),
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.users).toHaveLength(2);
    expect(client.getQueriesData({ queryKey: usersKeys.all(admin.id) })).not.toEqual([]);
    expect(client.getQueriesData({ queryKey: usersKeys.all("another-admin") })).toEqual([]);
  });
});
