"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateUserMutation,
  type UpdateUserFormData,
} from "./update-user.mutation";

export type { UpdateUserFormData } from "./update-user.mutation";

export function useUpdateUser(actorId: string) {
  const mutation = useMutation(updateUserMutation(useQueryClient(), actorId));
  return {
    handleUpdateUser: (input: UpdateUserFormData) => mutation.mutateAsync(input),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
