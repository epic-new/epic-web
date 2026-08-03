"use client";

import { useMutation } from "@tanstack/react-query";
import {
  setPasswordMutation,
  type SetPasswordData,
} from "./set-password.mutation";

export type { SetPasswordData } from "./set-password.mutation";

export function useSetPassword() {
  const mutation = useMutation(setPasswordMutation());
  return {
    handleSetPassword: (input: SetPasswordData) => mutation.mutateAsync(input),
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
