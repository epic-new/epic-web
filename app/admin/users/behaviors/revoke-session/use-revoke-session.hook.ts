"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { revokeSessionMutation } from "./revoke-session.mutation";

export function useRevokeSession(actorId: string) {
  const mutation = useMutation(revokeSessionMutation(useQueryClient(), actorId));
  return {
    handleRevokeSession: (sessionToken: string) => mutation.mutateAsync(sessionToken),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
