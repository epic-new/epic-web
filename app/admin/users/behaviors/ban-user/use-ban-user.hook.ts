"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { banUserMutation, type BanUserData } from "./ban-user.mutation";

export type { BanUserData } from "./ban-user.mutation";

export function useBanUser(actorId: string) {
  const mutation = useMutation(banUserMutation(useQueryClient(), actorId));
  return {
    handleBanUser: (input: BanUserData) => mutation.mutateAsync(input),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
