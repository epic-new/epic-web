"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { redirect, unstable_rethrow } from "next/navigation";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  ImpersonateUser,
  type ImpersonateUserInput,
  type ImpersonateUserResult,
} from "./impersonate-user.service";

export type {
  ImpersonateUserInput,
  ImpersonateUserResult,
} from "./impersonate-user.service";

export async function impersonateUser(
  input: ImpersonateUserInput,
): Promise<ActionResponse<ImpersonateUserResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    await ImpersonateUser.execute({
      actor: context.actor,
      sessionToken: context.credential.sessionToken,
      input,
    });
    redirect("/");
  } catch (error) {
    unstable_rethrow(error);
    return { success: false, error: actionError(error, "Failed to impersonate user") };
  }
}
