import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(() => Promise.resolve(new Headers())),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { HOME_URL } from "@/app.config";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { signIn } from "../signin.action";

function signinForm(email: string, password: string) {
  const form = new FormData();
  form.set("email", email);
  form.set("password", password);
  return form;
}

describe("signin action scenarios", () => {
  const email = "existing-user@example.com";
  const password = "securePassword123";
  let userId: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    await PreDB(db, schema, { user: [], account: [], session: [] });
    await auth.api.signUpEmail({ body: { email, password, name: "" } });
    const [createdUser] = await db
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.email, email));
    userId = createdUser.id;
    await PreDB(db, schema, { session: [] });
  });

  it("creates a session and redirects for valid credentials", async () => {
    await signIn({ error: null }, signinForm(email, password), "/");

    expect(redirect).toHaveBeenCalledWith("/");
    await PostDB(db, schema, {
      user: [{ email }],
      session: [{ userId }],
    });
  });

  it("uses the home page when the requested redirect is external", async () => {
    await signIn(
      { error: null },
      signinForm(email, password),
      "https://example.com/phishing",
    );

    expect(redirect).toHaveBeenCalledWith(HOME_URL);
    await PostDB(db, schema, {
      user: [{ email }],
      session: [{ userId }],
    });
  });

  it("rejects invalid credentials without creating a session", async () => {
    const result = await signIn(
      { error: null },
      signinForm(email, "incorrectPassword123"),
      "/",
    );

    expect(result.error).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
    await PostDB(db, schema, { session: [] });
  });
});
