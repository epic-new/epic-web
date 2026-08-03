import type { QueryClient } from "@tanstack/react-query";
import {
  usersKeys,
  type ListUsersParams,
  type User,
  type UsersListData,
} from "./users.query";

export type UserListSnapshot = [
  readonly unknown[],
  UsersListData | undefined,
][];

export async function snapshotUserLists(
  queryClient: QueryClient,
  actorId: string,
) {
  await queryClient.cancelQueries({ queryKey: usersKeys.lists(actorId) });
  return queryClient.getQueriesData<UsersListData>({
    queryKey: usersKeys.lists(actorId),
  });
}

export function restoreUserLists(
  queryClient: QueryClient,
  snapshot: UserListSnapshot,
): void {
  snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data));
}

function listParams(
  key: readonly unknown[],
  actorId: string,
): ListUsersParams | null {
  const value = key[usersKeys.lists(actorId).length];
  return value && typeof value === "object"
    ? value as ListUsersParams
    : null;
}

function updateEachUserList(
  queryClient: QueryClient,
  actorId: string,
  update: (data: UsersListData, params: ListUsersParams) => UsersListData,
): void {
  queryClient
    .getQueriesData<UsersListData>({ queryKey: usersKeys.lists(actorId) })
    .forEach(([key, data]) => {
      const params = listParams(key, actorId);
      if (data && params) queryClient.setQueryData(key, update(data, params));
    });
}

export function findUserInSnapshot(
  snapshot: UserListSnapshot,
  userId: string,
): User | null {
  for (const [, data] of snapshot) {
    const record = data?.users.find((entry) => entry.id === userId);
    if (record) return record;
  }
  return null;
}

export function userMatchesList(user: User, params: ListUsersParams): boolean {
  if (params.roleFilter && user.role !== params.roleFilter) return false;
  const search = params.search.trim().toLocaleLowerCase();
  return !search || user.email.toLocaleLowerCase().includes(search);
}

export function addUserToMatchingLists(
  queryClient: QueryClient,
  actorId: string,
  user: User,
): void {
  updateEachUserList(queryClient, actorId, (data, params) => {
    if (!userMatchesList(user, params)) return data;
    return {
      total: data.total + 1,
      users: params.page === 1
        ? [user, ...data.users].slice(0, params.limit)
        : data.users,
    };
  });
}

export function reconcileCreatedUser(
  queryClient: QueryClient,
  actorId: string,
  temporaryId: string,
  created: User,
): void {
  updateEachUserList(queryClient, actorId, (data, params) => {
    if (!data.users.some((entry) => entry.id === temporaryId)) return data;
    if (!userMatchesList(created, params)) {
      return {
        users: data.users.filter((entry) => entry.id !== temporaryId),
        total: Math.max(0, data.total - 1),
      };
    }
    return {
      ...data,
      users: data.users.map((entry) => entry.id === temporaryId ? created : entry),
    };
  });
}

export function removeUserFromMatchingLists(
  queryClient: QueryClient,
  actorId: string,
  user: User,
): void {
  updateEachUserList(queryClient, actorId, (data, params) => {
    if (!userMatchesList(user, params)) return data;
    return {
      users: data.users.filter((entry) => entry.id !== user.id),
      total: Math.max(0, data.total - 1),
    };
  });
}

export function transitionUserInMatchingLists(
  queryClient: QueryClient,
  actorId: string,
  before: User,
  after: User,
): void {
  updateEachUserList(queryClient, actorId, (data, params) => {
    const matchedBefore = userMatchesList(before, params);
    const matchesAfter = userMatchesList(after, params);
    const wasVisible = data.users.some((entry) => entry.id === before.id);
    let users = data.users;

    if (wasVisible) {
      users = matchesAfter
        ? users.map((entry) => entry.id === before.id ? after : entry)
        : users.filter((entry) => entry.id !== before.id);
    } else if (!matchedBefore && matchesAfter && params.page === 1) {
      users = [after, ...users].slice(0, params.limit);
    }

    return {
      users,
      total: Math.max(
        0,
        data.total + Number(matchesAfter) - Number(matchedBefore),
      ),
    };
  });
}

export function reconcileVisibleUser(
  queryClient: QueryClient,
  actorId: string,
  user: User,
): void {
  updateEachUserList(queryClient, actorId, (data, params) => {
    if (!data.users.some((entry) => entry.id === user.id)) return data;
    if (!userMatchesList(user, params)) {
      return {
        users: data.users.filter((entry) => entry.id !== user.id),
        total: Math.max(0, data.total - 1),
      };
    }
    return {
      ...data,
      users: data.users.map((entry) => entry.id === user.id ? user : entry),
    };
  });
}

export function mapUserLists(
  queryClient: QueryClient,
  actorId: string,
  update: (user: User) => User,
): void {
  queryClient.setQueriesData<UsersListData>(
    { queryKey: usersKeys.lists(actorId) },
    (old) => old ? { ...old, users: old.users.map(update) } : old,
  );
}
