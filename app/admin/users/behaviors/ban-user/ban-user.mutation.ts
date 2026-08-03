import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { adminKeys } from "../../../admin.query";
import { mapUserLists, restoreUserLists, snapshotUserLists } from "../../user-cache";
import { usersKeys } from "../../users.query";
import { banUser } from "./ban-user.action";

export interface BanUserData {
  userId: string;
  banReason?: string;
  banExpiresInDays?: number;
}

export function banUserMutation(queryClient: QueryClient, actorId: string) {
  return mutationOptions({
    mutationFn: async (input: BanUserData) => {
      const response = await banUser({
        userId: input.userId,
        banReason: input.banReason,
        banExpiresIn: input.banExpiresInDays
          ? input.banExpiresInDays * 24 * 60 * 60
          : undefined,
      });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (input) => {
      const previous = await snapshotUserLists(queryClient, actorId);
      mapUserLists(queryClient, actorId, (entry) => entry.id === input.userId
        ? {
            ...entry,
            banned: true,
            banReason: input.banReason || null,
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
