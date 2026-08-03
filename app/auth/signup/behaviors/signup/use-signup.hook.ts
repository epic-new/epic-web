"use client";

import { useMutation } from "@tanstack/react-query";

import { HOME_URL } from "@/app.config";
import type { ActionResult } from "./signup.action";
import { signupMutation } from "./signup.mutation";

interface UseSignupReturn {
  state: ActionResult;
  formAction: (formData: FormData) => void;
  isLoading: boolean;
}

export function useSignup(redirectURL: string = HOME_URL): UseSignupReturn {
  const mutation = useMutation(signupMutation(redirectURL));

  return {
    state: {
      error: mutation.error ? mutation.error.message : null,
    },
    formAction: (formData: FormData) => {
      mutation.mutate(formData);
    },
    isLoading: mutation.isPending,
  };
}
