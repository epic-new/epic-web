"use server";

import type { ActionResponse } from "@/shared/actions/action-response";
import { actionError, getAdminUserActionContext } from "../../action-utils";
import {
  CreateUser,
  type CreateUserInput,
  type CreateUserResult,
} from "./create-user.service";

export type { CreateUserInput, CreateUserResult } from "./create-user.service";

export async function createUser(
  input: CreateUserInput,
): Promise<ActionResponse<CreateUserResult>> {
  try {
    const context = await getAdminUserActionContext();
    if (!context) return { success: false, error: "Unauthorized - please sign in" };
    return {
      success: true,
      data: await CreateUser.execute({
        actor: context.actor,
        sessionToken: context.credential.sessionToken,
        input,
      }),
    };
  } catch (error) {
    return { success: false, error: actionError(error, "Failed to create user") };
  }
}
