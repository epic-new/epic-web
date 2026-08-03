// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/auth", async () => ({
  ...(await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth")),
  getUser: vi.fn(),
}));
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth, getUser } from "@/lib/auth";
import { PreDB } from "@/lib/db-test";
import { createTestClient, queryWrapper } from "@/shared/tests/test-utils";
import { createAdminAuth, sessionResult, signUpUser } from "../../../tests/fixtures";
import { useSetPassword } from "../use-set-password.hook";

describe("useSetPassword hook scenarios", () => {
  it("calls the real Action and changes the persisted credential", async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const admin = await createAdminAuth();
    const target = await signUpUser({ email: "target@example.com" });
    vi.mocked(getUser).mockResolvedValue(
      sessionResult(admin.actor, null, admin.sessionToken),
    );
    const { result } = renderHook(() => useSetPassword(), {
      wrapper: queryWrapper(createTestClient()),
    });
    await act(async () => {
      await result.current.handleSetPassword({
        userId: target.id,
        newPassword: "new-password-123",
      });
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    await expect(auth.api.signInEmail({
      body: { email: target.email, password: "new-password-123" },
    })).resolves.toBeDefined();
  });
});
