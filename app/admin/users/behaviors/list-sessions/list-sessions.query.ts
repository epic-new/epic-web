import { queryOptions } from "@tanstack/react-query";
import { usersKeys } from "../../users.query";
import {
  listSessions,
  type ListSessionsResult,
} from "./list-sessions.action";

export type Session = ListSessionsResult[number];

export function listSessionsQuery(actorId: string, userId: string) {
  return queryOptions({
    queryKey: usersKeys.sessionList(actorId, userId),
    queryFn: async (): Promise<Session[]> => {
      const response = await listSessions({ userId });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
}
