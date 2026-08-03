import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { usersKeys } from "../../users.query";
import type { Session } from "../list-sessions/list-sessions.query";
import { revokeSession } from "./revoke-session.action";

export function revokeSessionMutation(queryClient: QueryClient, actorId: string) {
  return mutationOptions({
    mutationFn: async (sessionToken: string) => {
      const response = await revokeSession({ sessionToken });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (sessionToken) => {
      await queryClient.cancelQueries({ queryKey: usersKeys.sessions(actorId) });
      const previous = queryClient.getQueriesData<Session[]>({
        queryKey: usersKeys.sessions(actorId),
      });
      queryClient.setQueriesData<Session[]>(
        { queryKey: usersKeys.sessions(actorId) },
        (old) => old?.filter((entry) => entry.token !== sessionToken),
      );
      return { previous };
    },
    onError: (_error, _input, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({
      queryKey: usersKeys.sessions(actorId),
    }),
  });
}
