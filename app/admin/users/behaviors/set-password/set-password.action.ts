"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  SetPassword,
  type SetPasswordInput,
  type SetPasswordResult,
} from "./set-password.service";

export type { SetPasswordInput, SetPasswordResult } from "./set-password.service";

export async function setPassword(
  input: SetPasswordInput,
): Promise<ActionResponse<SetPasswordResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await SetPassword.execute({
        actor: context.actor,
        sessionToken: context.credential.sessionToken,
        input,
      }),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Failed to reset password") };
  }
}
