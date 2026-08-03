import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { adminKeys } from "../../../admin.query";
import { usersKeys } from "../../users.query";
import {
  findUserInSnapshot,
  removeUserFromMatchingLists,
  restoreUserLists,
  snapshotUserLists,
} from "../../user-cache";
import { deleteUser } from "./delete-user.action";

export function deleteUserMutation(queryClient: QueryClient, actorId: string) {
  return mutationOptions({
    mutationFn: async (userId: string) => {
      const response = await deleteUser({ userId });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (userId) => {
      const previous = await snapshotUserLists(queryClient, actorId);
      const target = findUserInSnapshot(previous, userId);
      if (target) removeUserFromMatchingLists(queryClient, actorId, target);
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (context) restoreUserLists(queryClient, context.previous);
    },
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: usersKeys.all(actorId) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.stats(actorId) }),
    ]),
  });
}
