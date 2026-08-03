import { beforeEach, describe, expect, it, vi } from "vitest";
import { betterAuthCookieNames } from "@/lib/auth/provider-cookies";
import { parseCookies } from "better-auth/cookies";

const provider = vi.hoisted(() => ({
  createUser: vi.fn(),
  impersonateUser: vi.fn(),
  setUserPassword: vi.fn(),
  stopImpersonating: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: { api: provider } }));

import {
  BetterAuthAdminError,
  BetterAuthAdminIntegration,
} from "../better-auth-admin";

const sessionToken = "session-token";

describe("BetterAuthAdminIntegration", () => {
  beforeEach(() => vi.clearAllMocks());

  it("normalizes a created provider user to its identifier", async () => {
    provider.createUser.mockResolvedValue({ user: { id: "created-user" } });

    await expect(BetterAuthAdminIntegration.createUser(sessionToken, {
      email: "created@example.com",
      password: "password123",
      name: "Created",
      role: "user",
    })).resolves.toEqual({ id: "created-user" });

    expect(provider.createUser).toHaveBeenCalledWith({
      headers: expect.any(Headers),
      body: {
        email: "created@example.com",
        password: "password123",
        name: "Created",
        role: "user",
      },
    });
    const request = provider.createUser.mock.calls[0]?.[0] as {
      headers: Headers;
    };
    expect(
      parseCookies(request.headers.get("cookie") ?? "").get(
        betterAuthCookieNames.sessionToken,
      ),
    ).toMatch(/^session-token\./);
  });

  it("adds the opaque admin credential only when stopping impersonation", async () => {
    provider.stopImpersonating.mockResolvedValue(undefined);

    await BetterAuthAdminIntegration.stopImpersonating(
      sessionToken,
      "admin-session.signed-value",
    );

    const request = provider.stopImpersonating.mock.calls[0]?.[0] as {
      headers: Headers;
    };
    const cookies = parseCookies(request.headers.get("cookie") ?? "");
    expect(cookies.get(betterAuthCookieNames.sessionToken)).toMatch(
      /^session-token\./,
    );
    expect(cookies.get(betterAuthCookieNames.adminSession)).toBe(
      "admin-session.signed-value",
    );
  });

  it.each([
    {
      call: () => BetterAuthAdminIntegration.createUser(sessionToken, {
        email: "created@example.com",
        password: "password123",
        name: "Created",
        role: "user",
      }),
      method: provider.createUser,
      code: "create_user_failed",
      message: "Unable to create user",
    },
    {
      call: () => BetterAuthAdminIntegration.setPassword(sessionToken, {
        userId: "target",
        newPassword: "password123",
      }),
      method: provider.setUserPassword,
      code: "set_password_failed",
      message: "Unable to reset password",
    },
    {
      call: () => BetterAuthAdminIntegration.impersonate(sessionToken, "target"),
      method: provider.impersonateUser,
      code: "impersonation_failed",
      message: "Unable to impersonate user",
    },
    {
      call: () => BetterAuthAdminIntegration.stopImpersonating(
        sessionToken,
        "admin-session.signed-value",
      ),
      method: provider.stopImpersonating,
      code: "impersonation_failed",
      message: "Unable to stop impersonating",
    },
  ])("normalizes $code without exposing the provider failure", async ({
    call,
    method,
    code,
    message,
  }) => {
    method.mockRejectedValue(new Error("provider secret failure"));

    const error = await call().catch((cause: unknown) => cause);

    expect(error).toBeInstanceOf(BetterAuthAdminError);
    expect(error).toMatchObject({ code, message });
    expect((error as Error).message).not.toContain("provider secret failure");
  });
});
