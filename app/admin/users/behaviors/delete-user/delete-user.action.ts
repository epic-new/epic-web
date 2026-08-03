"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  DeleteUser,
  type DeleteUserInput,
  type DeleteUserResult,
} from "./delete-user.service";

export type { DeleteUserInput, DeleteUserResult } from "./delete-user.service";

export async function deleteUser(
  input: DeleteUserInput,
): Promise<ActionResponse<DeleteUserResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await DeleteUser.execute({ actor: context.actor, input }),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Failed to delete user") };
  }
}
