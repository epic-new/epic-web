"use server";

import { getUser } from "@/lib/auth";
import type { ActionResponse } from "@/shared/actions/action-response";
import { z } from "zod";
import {
  AddRow,
  type AddRowInput,
  type AddRowResult,
} from "./add-row.service";

export type { AddRowInput, AddRowResult } from "./add-row.service";

export async function addRow(
  input: AddRowInput,
): Promise<ActionResponse<AddRowResult>> {
  try {
    const { user } = await getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    return {
      success: true,
      data: await AddRow.execute({
        actor: { id: user.id, role: user.role },
        input,
      }),
    };
  } catch (error) {
    return {
      success: false,
      error: actionError(error, "Unable to add row"),
    };
  }
}

function actionError(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
