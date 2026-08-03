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
import { useListSessions } from "../use-list-sessions.hook";

describe("useListSessions hook scenarios", () => {
  it("loads target sessions into the actor-partitioned cache", async () => {
    const admin = userRecord({ id: "admin", email: "admin@example.com", role: "admin" });
    const target = userRecord({ id: "target", email: "target@example.com" });
    await PreDB(db, schema, {
      user: [admin, target],
      session: [{
        id: "session",
        token: "token",
        userId: target.id,
        expiresAt: new Date("2027-01-01"),
        createdAt: target.createdAt,
        updatedAt: target.updatedAt,
      }],
    });
    vi.mocked(getUser).mockResolvedValue(sessionResult(admin));
    const client = createTestClient();
    const { result } = renderHook(
      () => useListSessions(admin.id, target.id, true),
      { wrapper: queryWrapper(client) },
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.sessions).toMatchObject([{ id: "session" }]);
    expect(client.getQueryData(usersKeys.sessionList(admin.id, target.id)))
      .toMatchObject([{ id: "session" }]);
  });
});
