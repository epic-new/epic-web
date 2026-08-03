"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  databaseKeys,
  tableDataQuery,
  type DatabaseSortState,
} from "../../../database.query";

const DEBOUNCE_MS = 300;

export function useViewTable(actorId: string, tableName: string) {
  const queryClient = useQueryClient();
  const [sort, setSort] = useState<DatabaseSortState | null>(null);
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const [columnVisibilityOverrides, setColumnVisibilityOverrides] =
    useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = useQuery({
    ...tableDataQuery(actorId, tableName, { page, sort, filter }),
    placeholderData: keepPreviousData,
  });

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }, []);

  const columnVisibility = useMemo(() => {
    const columns = query.data?.columns ?? [];
    return {
      ...Object.fromEntries(columns.map((column) => [column.name, true])),
      ...columnVisibilityOverrides,
    };
  }, [columnVisibilityOverrides, query.data?.columns]);

  const handleFilterChange = useCallback((nextFilter: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilter(nextFilter);
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

  const handleSortChange = useCallback((column: string) => {
    setSort((current) => {
      if (!current || current.column !== column) {
        return { column, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { column, direction: "desc" };
      }
      return null;
    });
    setPage(1);
  }, []);

  const handleColumnVisibilityChange = useCallback(
    (next: Record<string, boolean>) => setColumnVisibilityOverrides(next),
    [],
  );

  const handleToggleColumn = useCallback((column: string) => {
    setColumnVisibilityOverrides((current) => ({
      ...current,
      [column]: current[column] === false,
    }));
  }, []);

  const handleRefresh = useCallback(() => queryClient.invalidateQueries({
    queryKey: databaseKeys.table(actorId, tableName),
  }), [actorId, queryClient, tableName]);

  const data = query.data;
  return {
    rows: data?.rows ?? [],
    columns: data?.columns ?? [],
    total: data?.total ?? 0,
    page: data?.page ?? page,
    totalPages: data?.totalPages ?? 0,
    isLoading: query.isPending,
    error: query.error ? query.error.message : null,
    sort,
    filter,
    columnVisibility,
    handleSortChange,
    handleFilterChange,
    handleGoToPage: setPage,
    handleRefresh,
    handleColumnVisibilityChange,
    handleToggleColumn,
  };
}
