"use client";

import { useQuery } from "@tanstack/react-query";
import { adminStatsQuery } from "../../admin.query";

export function useAdminStats(actorId: string) {
  const query = useQuery(adminStatsQuery(actorId));

  return {
    stats: query.data ?? null,
    isLoading: query.isPending,
    error: query.error ? query.error.message : null,
  };
}
