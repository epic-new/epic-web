import { queryOptions } from "@tanstack/react-query";
import {
  getAdminStats,
  type AdminStats,
} from "./behaviors/admin-stats/admin-stats.action";

export const adminKeys = {
  root: ["admin"] as const,
  all: (actorId: string) => [...adminKeys.root, actorId] as const,
  stats: (actorId: string) => [...adminKeys.all(actorId), "stats"] as const,
};

export function adminStatsQuery(actorId: string) {
  return queryOptions({
    queryKey: adminKeys.stats(actorId),
    // actorId partitions the browser cache; the Action authenticates the request.
    queryFn: async (): Promise<AdminStats> => {
      const response = await getAdminStats();
      if (!response.success) {
        throw new Error(response.error);
      }

      return response.data;
    },
  });
}
