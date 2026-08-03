"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { revokeAllSessionsMutation } from "./revoke-all-sessions.mutation";

export function useRevokeAllSessions(actorId: string) {
  const mutation = useMutation(
    revokeAllSessionsMutation(useQueryClient(), actorId),
  );
  return {
    handleRevokeAllSessions: (userId: string) => mutation.mutateAsync(userId),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
