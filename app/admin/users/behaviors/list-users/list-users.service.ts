import "server-only";

import {
  UserModel,
  type UserRecordPage,
  type UserSearchField,
  type UserSearchOperator,
  type UserSortField,
} from "@/shared/models/user";
import { UserPolicy, type UserActor } from "@/shared/policies/user.policy";
import { z } from "zod";

const listUsersInputSchema = z.object({
  searchValue: z.string().trim().optional(),
  searchField: z.enum(["email", "name"]).optional(),
  searchOperator: z.enum(["contains", "starts_with", "ends_with"]).optional(),
  limit: z.number().int().min(1).max(100).default(10),
  offset: z.number().int().min(0).default(0),
  sortBy: z.enum(["email", "name", "role", "createdAt", "updatedAt"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
  filterField: z.literal("role").optional(),
  filterValue: z.enum(["user", "admin"]).optional(),
  filterOperator: z.literal("eq").optional(),
});

export type ListUsersInput = z.input<typeof listUsersInputSchema>;
export type ListUsersResult = UserRecordPage & { limit: number; offset: number };

export class ListUsers {
  static async execute(command: {
    actor: UserActor;
    input?: ListUsersInput;
  }): Promise<ListUsersResult> {
    const input = listUsersInputSchema.parse(command.input ?? {});
    this.authorize(command.actor, []);

    const result = await UserModel.list({
      searchValue: input.searchValue || undefined,
      searchField: input.searchField as UserSearchField | undefined,
      searchOperator: input.searchOperator as UserSearchOperator | undefined,
      role: input.filterField === "role" ? input.filterValue : undefined,
      limit: input.limit,
      offset: input.offset,
      sortBy: input.sortBy as UserSortField | undefined,
      sortDirection: input.sortDirection,
    });

    return { ...result, limit: input.limit, offset: input.offset };
  }

  private static authorize(actor: UserActor, records: readonly never[]): void {
    if (!UserPolicy.canList(actor, records)) {
      throw new Error("Forbidden - admin role required");
    }
  }
}
