import { mutationOptions, type QueryClient } from "@tanstack/react-query";
import { adminKeys } from "../../../admin.query";
import { usersKeys, type User } from "../../users.query";
import {
  addUserToMatchingLists,
  reconcileCreatedUser,
  restoreUserLists,
  snapshotUserLists,
} from "../../user-cache";
import { createUser, type CreateUserInput } from "./create-user.action";

export type CreateUserFormData = CreateUserInput;

export function createUserMutation(queryClient: QueryClient, actorId: string) {
  return mutationOptions({
    mutationFn: async (input: CreateUserFormData) => {
      const response = await createUser(input);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (input) => {
      const previous = await snapshotUserLists(queryClient, actorId);
      const temporaryId = `temp-${Date.now()}`;
      const now = new Date();
      const optimistic: User = {
        id: temporaryId,
        email: input.email,
        name: input.name,
        role: input.role ?? "user",
        banned: false,
        banReason: null,
        banExpires: null,
        createdAt: now,
        updatedAt: now,
        emailVerified: false,
        image: null,
        pending: true,
      };
      addUserToMatchingLists(queryClient, actorId, optimistic);
      return { previous, temporaryId };
    },
    onSuccess: (created, _input, context) => {
      if (context) {
        reconcileCreatedUser(queryClient, actorId, context.temporaryId, created);
      }
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
