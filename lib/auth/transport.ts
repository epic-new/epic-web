import "server-only";

import { auth } from "@/lib/auth";

/**
 * Clears Better Auth's provider-owned session cookies for the current request.
 * Session authorization and persistence remain the SignOut Service's concern.
 */
export async function clearAuthSession(
  requestHeaders: Headers,
): Promise<void> {
  await auth.api.signOut({ headers: requestHeaders });
}
