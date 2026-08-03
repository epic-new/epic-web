"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  UpdateUser,
  type UpdateUserInput,
  type UpdateUserResult,
} from "./update-user.service";

export type { UpdateUserInput, UpdateUserResult } from "./update-user.service";

export async function updateUser(
  input: UpdateUserInput,
): Promise<ActionResponse<UpdateUserResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await UpdateUser.execute({ actor: context.actor, input }),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Failed to update user") };
  }
}
