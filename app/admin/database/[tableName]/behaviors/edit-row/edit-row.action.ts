"use server";

import { getUser } from "@/lib/auth";
import type { ActionResponse } from "@/shared/actions/action-response";
import { z } from "zod";
import {
  EditRow,
  type EditRowInput,
  type EditRowResult,
} from "./edit-row.service";

export type { EditRowInput, EditRowResult } from "./edit-row.service";

export async function editRow(
  input: EditRowInput,
): Promise<ActionResponse<EditRowResult>> {
  try {
    const { user } = await getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    return {
      success: true,
      data: await EditRow.execute({
        actor: { id: user.id, role: user.role },
        input,
      }),
    };
  } catch (error) {
    return {
      success: false,
      error: actionError(error, "Unable to edit row"),
    };
  }
}

function actionError(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
