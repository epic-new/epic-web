import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));

import { SIGNIN_URL } from "@/app.config";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { parseSetCookieHeader } from "better-auth/cookies";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "../sign-out.action";

describe("sign-out action scenarios", () => {
  const email = "shared-signout@example.com";

  beforeEach(async () => {
    await PreDB(db, schema, { user: [], account: [], session: [] });
    const response = await auth.api.signUpEmail({
      body: { email, password: "securePassword123", name: "Signout User" },
      asResponse: true,
    });
    const setCookie = response.headers.get("set-cookie");
    if (!setCookie) throw new Error("Sign-up did not create a session cookie");

    const cookie = Array.from(parseSetCookieHeader(setCookie).entries())
      .map(([name, attributes]) => `${name}=${attributes.value}`)
      .join("; ");
    vi.mocked(headers).mockResolvedValue(new Headers({ cookie }));
    vi.mocked(redirect).mockReset();
  });

  it("revokes the real session and redirects to an internal path", async () => {
    await signOut(true, "/auth/signin?reason=signed-out");

    expect(redirect).toHaveBeenCalledWith("/auth/signin?reason=signed-out");
    await PostDB(db, schema, {
      user: [{ email }],
      account: [{ providerId: "credential" }],
      session: [],
    });
  });

  it("uses the sign-in fallback for an external redirect", async () => {
    await signOut(true, "https://evil.example/steal-session");

    expect(redirect).toHaveBeenCalledWith(SIGNIN_URL);
    await PostDB(db, schema, {
      user: [{ email }],
      account: [{ providerId: "credential" }],
      session: [],
    });
  });
});
