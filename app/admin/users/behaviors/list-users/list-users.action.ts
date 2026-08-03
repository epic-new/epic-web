"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  ListUsers,
  type ListUsersInput,
  type ListUsersResult,
} from "./list-users.service";

export type { ListUsersInput, ListUsersResult } from "./list-users.service";

export async function listUsers(
  input?: ListUsersInput,
): Promise<ActionResponse<ListUsersResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await ListUsers.execute({ actor: context.actor, input }),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Failed to fetch users") };
  }
}
