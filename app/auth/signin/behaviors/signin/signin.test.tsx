// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { createTestClient, queryWrapper } from '@/shared/tests/test-utils';
import { eq } from "drizzle-orm";
import { useSignIn } from "./use-signin";

describe("signin behavior scenarios", () => {
  const email = "hook-user@example.com";
  const password = "securePassword123";
  let userId: string;

  beforeEach(async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    await auth.api.signUpEmail({ body: { email, password, name: "" } });
    const [createdUser] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, email));
    userId = createdUser.id;
    await PreDB(db, schema, { session: [] });
  });

  it("submits valid credentials through the real action", async () => {
    const form = new FormData();
    form.set("email", email);
    form.set("password", password);
    const { result } = renderHook(() => useSignIn("/"), {
      wrapper: queryWrapper(createTestClient()),
    });

    act(() => result.current.formAction(form));

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.state.error).toBeNull();
    await PostDB(db, schema, {
      session: [{ userId }],
    });
  });
});
