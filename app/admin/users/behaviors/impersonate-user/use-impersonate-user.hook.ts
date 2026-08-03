"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { impersonateUserMutation } from "./impersonate-user.mutation";

export function useImpersonateUser() {
  const mutation = useMutation(impersonateUserMutation(useQueryClient()));
  return {
    handleImpersonateUser: (userId: string) => mutation.mutateAsync(userId),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
