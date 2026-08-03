"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { setRoleMutation, type SetRoleData } from "./set-role.mutation";

export type { SetRoleData } from "./set-role.mutation";

export function useSetRole(actorId: string) {
  const mutation = useMutation(setRoleMutation(useQueryClient(), actorId));
  return {
    handleSetRole: (input: SetRoleData) => mutation.mutateAsync(input),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
