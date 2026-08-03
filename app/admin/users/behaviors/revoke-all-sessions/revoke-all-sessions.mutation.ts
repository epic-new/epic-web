import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { usersKeys } from "../../users.query";
import type { Session } from "../list-sessions/list-sessions.query";
import { revokeAllSessions } from "./revoke-all-sessions.action";

export function revokeAllSessionsMutation(
  queryClient: QueryClient,
  actorId: string,
) {
  return mutationOptions({
    mutationFn: async (userId: string) => {
      const response = await revokeAllSessions({ userId });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (userId) => {
      const key = usersKeys.sessionList(actorId, userId);
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Session[]>(key);
      queryClient.setQueryData<Session[]>(key, []);
      return { previous, key };
    },
    onError: (_error, _input, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous);
    },
    onSettled: (_data, _error, userId) => queryClient.invalidateQueries({
      queryKey: usersKeys.sessionList(actorId, userId),
    }),
  });
}
