"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stopImpersonatingMutation } from "./stop-impersonating.mutation";

export function useStopImpersonating() {
  const mutation = useMutation(stopImpersonatingMutation(useQueryClient()));
  return {
    handleStopImpersonating: () => mutation.mutateAsync(),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
