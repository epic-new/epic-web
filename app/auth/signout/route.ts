import { auth } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

/**
 * GET /auth/signout?redirect=/path
 *
 * Signs out the current user (if any) and redirects to the given path.
 * Used by Behave's "Login as Admin" flow to clear stale sessions
 * before navigating to the magic link.
 */
export async function GET(request: NextRequest) {
  const redirect = safeRedirectPath(
    request.nextUrl.searchParams.get("redirect"),
    "/",
  );

  try {
    await auth.api.signOut({
      headers: await headers(),
    });
  } catch {
    // No session to sign out — that's fine, just redirect
  }

  // Use relative redirect (Location header with path only) to avoid
  // resolving against the internal localhost:8080 URL of the sandbox.
  return new Response(null, {
    status: 307,
    headers: { Location: redirect },
  });
}
