import { auth, getUser } from "@/lib/auth";
import {
  betterAuthCookieNames,
  readBetterAuthCookie,
} from "@/lib/auth/provider-cookies";
import { SessionModel } from "@/shared/models/session";
import { UserModel, type UserRecord } from "@/shared/models/user";
import { parseCookies, parseSetCookieHeader } from "better-auth/cookies";

export const now = new Date("2026-01-01T00:00:00.000Z");
export const password = "password123";

export function userRecord(
  overrides: Partial<UserRecord> & Pick<UserRecord, "id" | "email">,
): UserRecord {
  return {
    name: "Test User",
    emailVerified: true,
    image: null,
    createdAt: now,
    updatedAt: now,
    role: "user",
    banned: false,
    banReason: null,
    banExpires: null,
    ...overrides,
  };
}

export async function signUpUser(options: {
  email: string;
  name?: string;
  role?: "user" | "admin";
  password?: string;
}): Promise<UserRecord> {
  await auth.api.signUpEmail({
    body: {
      email: options.email,
      password: options.password ?? password,
      name: options.name ?? "Test User",
    },
  });
  const created = await UserModel.findByEmail(options.email);
  if (!created) throw new Error("Test user was not created");
  if (options.role && options.role !== created.role) {
    const updated = await UserModel.update(created.id, { role: options.role });
    if (!updated) throw new Error("Test user role was not updated");
    return updated;
  }
  return created;
}

export function responseCookieHeaders(response: Response): Headers {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) throw new Error("Authentication response did not set a cookie");

  const cookie = Array.from(parseSetCookieHeader(setCookie).entries())
    .map(([name, attributes]) => `${name}=${attributes.value}`)
    .join("; ");
  return new Headers({ cookie });
}

export async function signInHeaders(
  email: string,
  suppliedPassword = password,
): Promise<Headers> {
  const response = await auth.api.signInEmail({
    body: { email, password: suppliedPassword },
    asResponse: true,
  });
  if (!response.ok) throw new Error("Test sign in failed");
  return responseCookieHeaders(response);
}

export async function createAdminAuth(email = "admin@example.com") {
  const actor = await signUpUser({ email, name: "Admin", role: "admin" });
  const headers = await signInHeaders(email);
  const sessionToken = await sessionTokenForHeaders(actor.id, headers);
  return { actor, headers, sessionToken };
}

export async function createImpersonationAuth(
  adminAuth: Awaited<ReturnType<typeof createAdminAuth>>,
  target: UserRecord,
) {
  const response = await auth.api.impersonateUser({
    headers: adminAuth.headers,
    body: { userId: target.id },
    asResponse: true,
  });
  const headers = responseCookieHeaders(response);
  const sessionToken = await sessionTokenForHeaders(target.id, headers);
  const impersonationCredential = readBetterAuthCookie(
    headers,
    betterAuthCookieNames.adminSession,
  );

  if (!impersonationCredential) {
    throw new Error("Impersonation response did not set an admin credential");
  }

  return { headers, sessionToken, impersonationCredential };
}

export function sessionResult(
  user: UserRecord,
  impersonatedBy: string | null = null,
  sessionToken = "test-session-token",
  impersonationCredential: string | null = null,
): Awaited<ReturnType<typeof getUser>> {
  return {
    user: { ...user, name: user.name ?? "" },
    sessionToken,
    isImpersonating: !!impersonatedBy,
    impersonatedBy,
    impersonationCredential,
  };
}

async function sessionTokenForHeaders(
  userId: string,
  requestHeaders: Headers,
): Promise<string> {
  const signedToken = parseCookies(
    requestHeaders.get("cookie") ?? "",
  ).get(betterAuthCookieNames.sessionToken);
  const session = (await SessionModel.listByUser(userId)).find((record) =>
    signedToken?.startsWith(`${record.token}.`),
  );

  if (!session) {
    throw new Error("Authentication response did not create a matching session");
  }

  return session.token;
}
