import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

import { db } from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@/lib/auth";
import { PostDB, PreDB } from "@/lib/db-test";
import { parseSetCookieHeader } from "better-auth/cookies";
import { headers } from "next/headers";
import { NextRequest } from "next/server";
import { GET } from "../route";

describe("signout route scenarios", () => {
  const email = "signout-user@example.com";

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
  });

  it("redirects to an internal path after signing out", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/auth/signout?redirect=%2Fprojects%3Fpage%3D2",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("/projects?page=2");
    await PostDB(db, schema, {
      user: [{ email }],
      account: [{ providerId: "credential" }],
      session: [],
    });
  });

  it("uses the root fallback for an external redirect", async () => {
    const response = await GET(
      new NextRequest(
        "http://localhost/auth/signout?redirect=https%3A%2F%2Fevil.example",
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("Location")).toBe("/");
    await PostDB(db, schema, {
      user: [{ email }],
      account: [{ providerId: "credential" }],
      session: [],
    });
  });
});
