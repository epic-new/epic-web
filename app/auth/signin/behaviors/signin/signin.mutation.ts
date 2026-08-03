import { mutationOptions } from "@tanstack/react-query";
import { signIn } from "./signin.action";

export function signInMutation(redirectURL: string) {
  return mutationOptions({
    mutationFn: async (formData: FormData) => {
      // The action redirects on success; on failure it returns { error }.
      const result = await signIn({ error: null }, formData, redirectURL);
      if (result?.error) throw new Error(result.error);
      return result;
    },
  });
}
