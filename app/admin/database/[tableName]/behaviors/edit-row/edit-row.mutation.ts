import {
  mutationOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { adminKeys } from "../../../../admin.query";
import { editRow } from "./edit-row.action";

export interface EditRowVariables {
  id: string | number;
  data: Record<string, unknown>;
  mode: "row" | "cell";
}

export function editRowMutation(
  queryClient: QueryClient,
  actorId: string,
  tableName: string,
) {
  return mutationOptions({
    mutationFn: async ({ id, data }: EditRowVariables) => {
      const response = await editRow({ tableName, id, data });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSettled: () => queryClient.invalidateQueries({
      queryKey: adminKeys.all(actorId),
    }),
  });
}
