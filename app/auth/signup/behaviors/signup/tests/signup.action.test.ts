import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual<typeof import("@/lib/auth")>("@/lib/auth");
  return { ...actual, getUser: vi.fn() };
});

import { HOME_URL } from "@/app.config";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { getUser } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { redirect } from "next/navigation";
import { signup } from "../signup.action";

function signupForm(email: string, password = "securePassword123") {
  const form = new FormData();
  form.set("email", email);
  form.set("password", password);
  form.set("confirmPassword", password);
  return form;
}

describe("signup action scenarios", () => {
  beforeEach(async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    vi.mocked(getUser).mockResolvedValue({ user: null } as never);
    vi.mocked(redirect).mockReset();
  });

  it("creates the account and redirects", async () => {
    const email = "new-user@example.com";

    const result = await signup({ error: null }, signupForm(email), "/projects");

    expect(result).toBeUndefined();
    expect(redirect).toHaveBeenCalledWith("/projects");
    await PostDB(db, schema, {
      user: [{ email, emailVerified: false }],
      account: [{ providerId: "credential" }],
    });
  });

  it("uses the home fallback for an external redirect", async () => {
    const email = "safe-redirect@example.com";

    await signup(
      { error: null },
      signupForm(email),
      "https://evil.example/steal-session",
    );

    expect(redirect).toHaveBeenCalledWith(HOME_URL);
    await PostDB(db, schema, {
      user: [{ email, emailVerified: false }],
      account: [{ providerId: "credential" }],
    });
  });

  it("rejects mismatched passwords without persistence", async () => {
    const form = signupForm("new-user@example.com");
    form.set("confirmPassword", "differentPassword123");

    await expect(signup({ error: null }, form, "/")).resolves.toEqual({
      error: "Passwords do not match",
    });
    await PostDB(db, schema, { user: [], account: [], session: [] });
  });
});
