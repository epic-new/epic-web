import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { usersKeys } from "../../users.query";
import {
  findUserInSnapshot,
  reconcileVisibleUser,
  restoreUserLists,
  snapshotUserLists,
  transitionUserInMatchingLists,
} from "../../user-cache";
import { updateUser, type UpdateUserInput } from "./update-user.action";

export type UpdateUserFormData = UpdateUserInput;

export function updateUserMutation(queryClient: QueryClient, actorId: string) {
  return mutationOptions({
    mutationFn: async (input: UpdateUserFormData) => {
      const response = await updateUser(input);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (input) => {
      const previous = await snapshotUserLists(queryClient, actorId);
      const target = findUserInSnapshot(previous, input.userId);
      if (target) {
        transitionUserInMatchingLists(queryClient, actorId, target, {
          ...target,
          ...input,
          pending: true,
        });
      }
      return { previous };
    },
    onSuccess: (updated) => {
      reconcileVisibleUser(queryClient, actorId, updated);
    },
    onError: (_error, _input, context) => {
      if (context) restoreUserLists(queryClient, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({
      queryKey: usersKeys.all(actorId),
    }),
  });
}
