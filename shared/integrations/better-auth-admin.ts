import "server-only";

import { auth } from "@/lib/auth";
import { betterAuthCookieNames } from "@/lib/auth/provider-cookies";
import { createHmac } from "node:crypto";

export type BetterAuthAdminErrorCode =
  | "create_user_failed"
  | "set_password_failed"
  | "impersonation_failed";

export class BetterAuthAdminError extends Error {
  constructor(
    public readonly code: BetterAuthAdminErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "BetterAuthAdminError";
  }
}

export class BetterAuthAdminIntegration {
  static async createUser(
    sessionToken: string,
    input: {
      email: string;
      password: string;
      name: string;
      role: "user" | "admin";
    },
  ): Promise<{ id: string }> {
    try {
      const response = await auth.api.createUser({
        headers: this.providerHeaders(sessionToken),
        body: input,
      });
      return { id: response.user.id };
    } catch (cause) {
      throw new BetterAuthAdminError(
        "create_user_failed",
        "Unable to create user",
        { cause },
      );
    }
  }

  static async setPassword(
    sessionToken: string,
    input: { userId: string; newPassword: string },
  ): Promise<void> {
    try {
      await auth.api.setUserPassword({
        headers: this.providerHeaders(sessionToken),
        body: input,
      });
    } catch (cause) {
      throw new BetterAuthAdminError(
        "set_password_failed",
        "Unable to reset password",
        { cause },
      );
    }
  }

  static async impersonate(
    sessionToken: string,
    userId: string,
  ): Promise<void> {
    try {
      await auth.api.impersonateUser({
        headers: this.providerHeaders(sessionToken),
        body: { userId },
      });
    } catch (cause) {
      throw new BetterAuthAdminError(
        "impersonation_failed",
        "Unable to impersonate user",
        { cause },
      );
    }
  }

  static async stopImpersonating(
    sessionToken: string,
    adminSessionCredential: string,
  ): Promise<void> {
    try {
      await auth.api.stopImpersonating({
        headers: this.providerHeaders(sessionToken, adminSessionCredential),
      });
    } catch (cause) {
      throw new BetterAuthAdminError(
        "impersonation_failed",
        "Unable to stop impersonating",
        { cause },
      );
    }
  }

  private static providerHeaders(
    sessionToken: string,
    adminSessionCredential?: string,
  ): Headers {
    const secret = process.env.BETTER_AUTH_SECRET;
    if (!secret) throw new Error("BETTER_AUTH_SECRET is required");

    const signature = createHmac("sha256", secret)
      .update(sessionToken)
      .digest("base64");
    const signedSessionToken = encodeURIComponent(
      `${sessionToken}.${signature}`,
    );
    const cookies = [
      `${betterAuthCookieNames.sessionToken}=${signedSessionToken}`,
    ];

    if (adminSessionCredential) {
      cookies.push(
        `${betterAuthCookieNames.adminSession}=${encodeURIComponent(adminSessionCredential)}`,
      );
    }

    return new Headers({ cookie: cookies.join("; ") });
  }
}
