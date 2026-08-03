"use server";

import { getUser } from "@/lib/auth";
import type { ActionResponse } from "@/shared/actions/action-response";
import {
  GetAdminStats,
  type AdminStats,
} from "./admin-stats.service";

export type { AdminStats } from "./admin-stats.service";

export async function getAdminStats(): Promise<ActionResponse<AdminStats>> {
  try {
    const { user } = await getUser();

    if (!user) {
      return { success: false, error: "Unauthorized" };
    }

    return {
      success: true,
      data: await GetAdminStats.execute({ actor: user }),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error
        ? error.message
        : "Unable to load admin statistics",
    };
  }
}
