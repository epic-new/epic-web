"use client";

import { useMutation } from "@tanstack/react-query";
import { signInMutation } from "./signin.mutation";

interface SignInState {
  error: string | null;
}

interface UseSignInReturn {
  state: SignInState;
  formAction: (formData: FormData) => void;
  isLoading: boolean;
}

export function useSignIn(redirectURL: string): UseSignInReturn {
  const mutation = useMutation(signInMutation(redirectURL));

  return {
    state: {
      error: mutation.error ? (mutation.error as Error).message : null,
    },
    formAction: (formData: FormData) => {
      mutation.mutate(formData);
    },
    isLoading: mutation.isPending,
  };
}
