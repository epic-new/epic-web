import { parseCookies } from "better-auth/cookies";

export const BETTER_AUTH_COOKIE_PREFIX = "sandbox-auth";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:8080";
const securePrefix = baseUrl.startsWith("https://") ? "__Secure-" : "";

export const betterAuthCookieNames = {
  sessionToken: `${securePrefix}${BETTER_AUTH_COOKIE_PREFIX}.session_token`,
  sessionData: `${securePrefix}${BETTER_AUTH_COOKIE_PREFIX}.session_data`,
  dontRemember: `${securePrefix}${BETTER_AUTH_COOKIE_PREFIX}.dont_remember`,
  adminSession: `${securePrefix}${BETTER_AUTH_COOKIE_PREFIX}.admin_session`,
} as const;

export function readBetterAuthCookie(
  requestHeaders: Headers,
  name: string,
): string | null {
  const cookieHeader = requestHeaders.get("cookie");
  if (!cookieHeader) return null;
  const value = parseCookies(cookieHeader).get(name);
  if (!value) return null;

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
