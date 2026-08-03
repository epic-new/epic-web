import {
  mutationOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { adminKeys } from "../../../../admin.query";
import { deleteRow } from "./delete-row.action";

export function deleteRowMutation(
  queryClient: QueryClient,
  actorId: string,
  tableName: string,
) {
  return mutationOptions({
    mutationFn: async (id: string | number) => {
      const response = await deleteRow({ tableName, id });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSettled: () => queryClient.invalidateQueries({
      queryKey: adminKeys.all(actorId),
    }),
  });
}
