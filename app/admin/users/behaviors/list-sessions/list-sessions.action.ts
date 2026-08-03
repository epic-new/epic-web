"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  ListSessions,
  type ListSessionsInput,
  type ListSessionsResult,
} from "./list-sessions.service";

export type { ListSessionsInput, ListSessionsResult } from "./list-sessions.service";

export async function listSessions(
  input: ListSessionsInput,
): Promise<ActionResponse<ListSessionsResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await ListSessions.execute({ actor: context.actor, input }),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Failed to fetch sessions") };
  }
}
