"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signOutMutation } from "./sign-out.mutation";

export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const mutation = useMutation(signOutMutation(queryClient));

  const handleSignOut = async () => {
    await mutation.mutateAsync();
    router.replace("/admin");
    router.refresh();
  };

  return {
    handleSignOut,
    isLoading: mutation.isPending,
    error: mutation.error?.message ?? null,
  };
}
