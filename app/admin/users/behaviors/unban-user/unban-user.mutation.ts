import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { adminKeys } from "../../../admin.query";
import { mapUserLists, restoreUserLists, snapshotUserLists } from "../../user-cache";
import { usersKeys } from "../../users.query";
import { unbanUser } from "./unban-user.action";

export function unbanUserMutation(queryClient: QueryClient, actorId: string) {
  return mutationOptions({
    mutationFn: async (userId: string) => {
      const response = await unbanUser({ userId });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (userId) => {
      const previous = await snapshotUserLists(queryClient, actorId);
      mapUserLists(queryClient, actorId, (entry) => entry.id === userId
        ? {
            ...entry,
            banned: false,
            banReason: null,
            banExpires: null,
            pending: true,
          }
        : entry);
      return { previous };
    },
    onSuccess: (updated) => mapUserLists(
      queryClient,
      actorId,
      (entry) => entry.id === updated.id ? updated : entry,
    ),
    onError: (_error, _input, context) => {
      if (context) restoreUserLists(queryClient, context.previous);
    },
    onSettled: () => Promise.all([
      queryClient.invalidateQueries({ queryKey: usersKeys.all(actorId) }),
      queryClient.invalidateQueries({ queryKey: adminKeys.stats(actorId) }),
    ]),
  });
}
