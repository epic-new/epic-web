"use server";

import { getUser } from "@/lib/auth";
import { clearAuthSession } from "@/lib/auth/transport";
import type { ActionResponse } from "@/shared/actions/action-response";
import { headers } from "next/headers";
import {
  SignOut,
  type SignOutResult,
} from "./sign-out.service";

export type { SignOutResult } from "./sign-out.service";

export async function signOut(): Promise<ActionResponse<SignOutResult>> {
  try {
    const { user, sessionToken } = await getUser();

    if (!user || !sessionToken) {
      return { success: false, error: "Unauthorized" };
    }

    const requestHeaders = new Headers(await headers());
    const result = await SignOut.execute({
      actor: { id: user.id },
      input: { sessionToken },
    });

    await clearAuthSession(requestHeaders);

    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to sign out",
    };
  }
}
