import { queryOptions } from "@tanstack/react-query";
import { adminKeys } from "../admin.query";
import {
  listUsers,
  type ListUsersInput,
  type ListUsersResult,
} from "./behaviors/list-users/list-users.action";

export interface ListUsersParams {
  page: number;
  limit: number;
  search: string;
  roleFilter: string | undefined;
  sortBy: string | undefined;
  sortDirection: "asc" | "desc";
}

export type User = ListUsersResult["users"][number] & { pending?: boolean };
export interface UsersListData {
  users: User[];
  total: number;
}

export const defaultUsersParams: ListUsersParams = {
  page: 1,
  limit: 10,
  search: "",
  roleFilter: undefined,
  sortBy: undefined,
  sortDirection: "asc",
};

export const usersKeys = {
  root: adminKeys.root,
  all: (actorId: string) => [...adminKeys.all(actorId), "users"] as const,
  lists: (actorId: string) => [...usersKeys.all(actorId), "list"] as const,
  list: (actorId: string, params: ListUsersParams) =>
    [...usersKeys.lists(actorId), params] as const,
  sessions: (actorId: string) =>
    [...usersKeys.all(actorId), "sessions"] as const,
  sessionList: (actorId: string, userId: string) =>
    [...usersKeys.sessions(actorId), userId] as const,
};

function buildInput(params: ListUsersParams): ListUsersInput {
  const input: ListUsersInput = {
    limit: params.limit,
    offset: (params.page - 1) * params.limit,
    sortDirection: params.sortDirection,
  };

  if (params.search.trim()) {
    input.searchValue = params.search.trim();
    input.searchField = "email";
    input.searchOperator = "contains";
  }
  if (params.roleFilter === "user" || params.roleFilter === "admin") {
    input.filterField = "role";
    input.filterValue = params.roleFilter;
    input.filterOperator = "eq";
  }
  if (
    params.sortBy === "email" ||
    params.sortBy === "name" ||
    params.sortBy === "role" ||
    params.sortBy === "createdAt" ||
    params.sortBy === "updatedAt"
  ) {
    input.sortBy = params.sortBy;
  }
  return input;
}

export function listUsersQuery(actorId: string, params: ListUsersParams) {
  return queryOptions({
    queryKey: usersKeys.list(actorId, params),
    queryFn: async (): Promise<UsersListData> => {
      const response = await listUsers(buildInput(params));
      if (!response.success) throw new Error(response.error);
      return { users: response.data.users, total: response.data.total };
    },
  });
}
