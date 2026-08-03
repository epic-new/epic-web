"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  RevokeSession,
  type RevokeSessionInput,
  type RevokeSessionResult,
} from "./revoke-session.service";

export type { RevokeSessionInput, RevokeSessionResult } from "./revoke-session.service";

export async function revokeSession(
  input: RevokeSessionInput,
): Promise<ActionResponse<RevokeSessionResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await RevokeSession.execute({ actor: context.actor, input }),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Failed to revoke session") };
  }
}
