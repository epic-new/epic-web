"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  RevokeAllSessions,
  type RevokeAllSessionsInput,
  type RevokeAllSessionsResult,
} from "./revoke-all-sessions.service";

export type {
  RevokeAllSessionsInput,
  RevokeAllSessionsResult,
} from "./revoke-all-sessions.service";

export async function revokeAllSessions(
  input: RevokeAllSessionsInput,
): Promise<ActionResponse<RevokeAllSessionsResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await RevokeAllSessions.execute({ actor: context.actor, input }),
    };
  } catch (error) {
    return {
      success: false,
      error: actionError(error, "Failed to revoke all sessions"),
    };
  }
}
