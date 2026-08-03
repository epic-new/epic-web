"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unbanUserMutation } from "./unban-user.mutation";

export function useUnbanUser(actorId: string) {
  const mutation = useMutation(unbanUserMutation(useQueryClient(), actorId));
  return {
    handleUnbanUser: (userId: string) => mutation.mutateAsync(userId),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
