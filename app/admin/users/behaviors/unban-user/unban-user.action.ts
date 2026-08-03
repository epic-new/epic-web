"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  UnbanUser,
  type UnbanUserInput,
  type UnbanUserResult,
} from "./unban-user.service";

export type { UnbanUserInput, UnbanUserResult } from "./unban-user.service";

export async function unbanUser(
  input: UnbanUserInput,
): Promise<ActionResponse<UnbanUserResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await UnbanUser.execute({ actor: context.actor, input }),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Failed to unban user") };
  }
}
