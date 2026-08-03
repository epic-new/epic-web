"use server";

import { getUser } from "@/lib/auth";
import type { ActionResponse } from "@/shared/actions/action-response";
import { z } from "zod";
import {
  DeleteRow,
  type DeleteRowInput,
  type DeleteRowResult,
} from "./delete-row.service";

export type { DeleteRowInput, DeleteRowResult } from "./delete-row.service";

export async function deleteRow(
  input: DeleteRowInput,
): Promise<ActionResponse<DeleteRowResult>> {
  try {
    const { user } = await getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    return {
      success: true,
      data: await DeleteRow.execute({
        actor: { id: user.id, role: user.role },
        input,
      }),
    };
  } catch (error) {
    return {
      success: false,
      error: actionError(error, "Unable to delete row"),
    };
  }
}

function actionError(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
