"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUserMutation } from "./delete-user.mutation";

export function useDeleteUser(actorId: string) {
  const mutation = useMutation(deleteUserMutation(useQueryClient(), actorId));
  return {
    handleDeleteUser: (userId: string) => mutation.mutateAsync(userId),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
