import {
  mutationOptions,
  type QueryClient,
} from "@tanstack/react-query";
import { adminKeys } from "../../../../admin.query";
import {
  addRow,
  type AddRowInput,
} from "./add-row.action";

export function addRowMutation(
  queryClient: QueryClient,
  actorId: string,
  tableName: string,
) {
  return mutationOptions({
    mutationFn: async (data: AddRowInput["data"]) => {
      const response = await addRow({ tableName, data });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onSettled: () => queryClient.invalidateQueries({
      queryKey: adminKeys.all(actorId),
    }),
  });
}
