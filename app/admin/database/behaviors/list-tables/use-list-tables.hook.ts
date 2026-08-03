"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  databaseKeys,
  listTablesQuery,
} from "../../database.query";

export function useListTables(actorId: string) {
  const queryClient = useQueryClient();
  const query = useQuery(listTablesQuery(actorId));

  return {
    tables: query.data ?? [],
    isLoading: query.isPending,
    error: query.error ? query.error.message : null,
    handleRefresh: () => queryClient.invalidateQueries({
      queryKey: databaseKeys.tables(actorId),
    }),
  };
}
