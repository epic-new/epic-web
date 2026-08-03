// @vitest-environment jsdom
import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ getUser: vi.fn() }));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PreDB } from "@/lib/db-test";
import { createTestClient, queryWrapper } from "@/shared/tests/test-utils";
import { useViewTable } from "../use-view-table.hook";

describe("useViewTable", () => {
  it("loads table rows through the real Action, Service, and Model", async () => {
    const now = new Date();
    await PreDB(db, schema, {
      user: [{
        id: "one",
        email: "one@example.com",
        emailVerified: true,
        createdAt: now,
        updatedAt: now,
      }],
    });
    vi.mocked(getUser).mockResolvedValue({
      user: { id: "admin", role: "admin" },
    } as never);
    const client = createTestClient();

    const { result } = renderHook(() => useViewTable("admin", "user"), {
      wrapper: queryWrapper(client),
    });

    await waitFor(() => expect(result.current.rows).toHaveLength(1));
    expect(result.current.rows[0]).toMatchObject({ id: "one" });
    expect(result.current.total).toBe(1);
    expect(result.current.error).toBeNull();
  });
});
