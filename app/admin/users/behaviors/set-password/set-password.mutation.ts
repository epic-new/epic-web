import { mutationOptions } from "@tanstack/react-query";
import { setPassword } from "./set-password.action";

export interface SetPasswordData {
  userId: string;
  newPassword: string;
}

export function setPasswordMutation() {
  return mutationOptions({
    mutationFn: async (input: SetPasswordData) => {
      const response = await setPassword(input);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
}
