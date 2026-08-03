"use server";

import { getUser } from "@/lib/auth";
import type { ActionResponse } from "@/shared/actions/action-response";
import {
  ListTables,
  type ListTablesResult,
} from "./list-tables.service";

export type { ListTablesResult } from "./list-tables.service";

export async function listTables(): Promise<ActionResponse<ListTablesResult>> {
  try {
    const { user } = await getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    return {
      success: true,
      data: await ListTables.execute({
        actor: { id: user.id, role: user.role },
      }),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unable to list tables",
    };
  }
}
