import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import {
  findUserInSnapshot,
  reconcileVisibleUser,
  restoreUserLists,
  snapshotUserLists,
  transitionUserInMatchingLists,
} from "../../user-cache";
import { usersKeys } from "../../users.query";
import { setRole } from "./set-role.action";

export interface SetRoleData {
  userId: string;
  role: "user" | "admin";
}

export function setRoleMutation(queryClient: QueryClient, actorId: string) {
  return mutationOptions({
    mutationFn: async (input: SetRoleData) => {
      const response = await setRole(input);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (input) => {
      const previous = await snapshotUserLists(queryClient, actorId);
      const target = findUserInSnapshot(previous, input.userId);
      if (target) {
        transitionUserInMatchingLists(queryClient, actorId, target, {
          ...target,
          role: input.role,
          pending: true,
        });
      }
      return { previous };
    },
    onSuccess: (updated) => reconcileVisibleUser(queryClient, actorId, updated),
    onError: (_error, _input, context) => {
      if (context) restoreUserLists(queryClient, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({
      queryKey: usersKeys.all(actorId),
    }),
  });
}
