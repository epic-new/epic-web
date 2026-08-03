"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useAtom } from "jotai";
import {
  usersLimitAtom,
  usersPageAtom,
  usersRoleFilterAtom,
  usersSearchAtom,
  usersSortByAtom,
  usersSortDirectionAtom,
} from "../../state";
import { listUsersQuery } from "../../users.query";

export function useListUsers(actorId: string) {
  const [page, setPage] = useAtom(usersPageAtom);
  const [limit, setLimit] = useAtom(usersLimitAtom);
  const [search, setSearch] = useAtom(usersSearchAtom);
  const [roleFilter, setRoleFilter] = useAtom(usersRoleFilterAtom);
  const [sortBy, setSortBy] = useAtom(usersSortByAtom);
  const [sortDirection, setSortDirection] = useAtom(usersSortDirectionAtom);

  const query = useQuery({
    ...listUsersQuery(actorId, {
      page,
      limit,
      search,
      roleFilter,
      sortBy,
      sortDirection,
    }),
    placeholderData: keepPreviousData,
  });

  return {
    users: query.data?.users ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isPending,
    error: query.error ? query.error.message : null,
    page,
    setPage,
    limit,
    setLimit,
    search,
    setSearch,
    roleFilter,
    setRoleFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
  };
}
