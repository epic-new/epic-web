"use server";

import { getUser } from "@/lib/auth";
import type { ActionResponse } from "@/shared/actions/action-response";
import { z } from "zod";
import {
  ViewTable,
  type ViewTableInput,
  type ViewTableResult,
} from "./view-table.service";

export type { ViewTableInput, ViewTableResult } from "./view-table.service";

export async function viewTable(
  input: ViewTableInput,
): Promise<ActionResponse<ViewTableResult>> {
  try {
    const { user } = await getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    return {
      success: true,
      data: await ViewTable.execute({
        actor: { id: user.id, role: user.role },
        input,
      }),
    };
  } catch (error) {
    return {
      success: false,
      error: actionError(error, "Unable to view table"),
    };
  }
}

function actionError(error: unknown, fallback: string): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? fallback;
  }
  return error instanceof Error ? error.message : fallback;
}
