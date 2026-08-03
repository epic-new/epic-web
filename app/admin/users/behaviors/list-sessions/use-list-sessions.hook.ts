"use client";

import { useQuery } from "@tanstack/react-query";
import { listSessionsQuery } from "./list-sessions.query";

export function useListSessions(
  actorId: string,
  userId: string | undefined,
  enabled: boolean,
) {
  const query = useQuery({
    ...listSessionsQuery(actorId, userId ?? ""),
    enabled: enabled && !!userId,
  });
  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
  };
}
