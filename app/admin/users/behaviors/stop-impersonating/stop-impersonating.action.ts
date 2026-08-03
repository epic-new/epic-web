"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { redirect, unstable_rethrow } from "next/navigation";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  StopImpersonating,
  type StopImpersonatingResult,
} from "./stop-impersonating.service";

export type { StopImpersonatingResult } from "./stop-impersonating.service";

export async function stopImpersonating(): Promise<
  ActionResponse<StopImpersonatingResult>
> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    await StopImpersonating.execute({
      actor: context.actor,
      sessionToken: context.credential.sessionToken,
      impersonationCredential:
        context.credential.impersonationCredential,
    });
    redirect("/admin/users");
  } catch (error) {
    unstable_rethrow(error);
    return {
      success: false,
      error: actionError(error, "Failed to stop impersonating"),
    };
  }
}
