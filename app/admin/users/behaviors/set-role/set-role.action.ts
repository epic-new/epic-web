"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import { SetRole, type SetRoleInput, type SetRoleResult } from "./set-role.service";

export type { SetRoleInput, SetRoleResult } from "./set-role.service";

export async function setRole(
  input: SetRoleInput,
): Promise<ActionResponse<SetRoleResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await SetRole.execute({ actor: context.actor, input }),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Failed to update role") };
  }
}
