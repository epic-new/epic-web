"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import { BanUser, type BanUserInput, type BanUserResult } from "./ban-user.service";

export type { BanUserInput, BanUserResult } from "./ban-user.service";

export async function banUser(
  input: BanUserInput,
): Promise<ActionResponse<BanUserResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await BanUser.execute({ actor: context.actor, input }),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Failed to ban user") };
  }
}
