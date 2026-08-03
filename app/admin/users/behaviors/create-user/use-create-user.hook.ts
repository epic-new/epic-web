"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createUserMutation,
  type CreateUserFormData,
} from "./create-user.mutation";

export type { CreateUserFormData } from "./create-user.mutation";

export function useCreateUser(actorId: string) {
  const mutation = useMutation(createUserMutation(useQueryClient(), actorId));
  return {
    handleCreateUser: (input: CreateUserFormData) => mutation.mutateAsync(input),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
