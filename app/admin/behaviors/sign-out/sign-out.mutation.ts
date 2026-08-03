import { adminKeys } from "@/app/admin/admin.query";
import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { signOut } from "./sign-out.action";

export function signOutMutation(queryClient: QueryClient) {
  return mutationOptions({
    mutationFn: async () => {
      const response = await signOut();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: adminKeys.root });
    },
  });
}
