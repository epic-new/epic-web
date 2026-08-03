import { queryOptions } from "@tanstack/react-query";
import { adminKeys } from "../admin.query";
import {
  listTables,
  type ListTablesResult,
} from "./behaviors/list-tables/list-tables.action";
import {
  viewTable,
  type ViewTableResult,
} from "./[tableName]/behaviors/view-table/view-table.action";

export const TABLE_DATA_LIMIT = 10;

export interface DatabaseSortState {
  column: string;
  direction: "asc" | "desc";
}

export interface DatabaseTableDataParams {
  page: number;
  sort: DatabaseSortState | null;
  filter: string;
}

export const defaultDatabaseTableDataParams: DatabaseTableDataParams = {
  page: 1,
  sort: null,
  filter: "",
};

export const databaseKeys = {
  all: (actorId: string) => [...adminKeys.all(actorId), "database"] as const,
  tables: (actorId: string) => [...databaseKeys.all(actorId), "tables"] as const,
  table: (actorId: string, tableName: string) =>
    [...databaseKeys.all(actorId), "table", tableName] as const,
  tableData: (
    actorId: string,
    tableName: string,
    params: DatabaseTableDataParams,
  ) => [...databaseKeys.table(actorId, tableName), params] as const,
};

export function listTablesQuery(actorId: string) {
  return queryOptions({
    queryKey: databaseKeys.tables(actorId),
    queryFn: async (): Promise<ListTablesResult> => {
      const response = await listTables();
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
}

export function tableDataQuery(
  actorId: string,
  tableName: string,
  params: DatabaseTableDataParams,
) {
  return queryOptions({
    queryKey: databaseKeys.tableData(actorId, tableName, params),
    queryFn: async (): Promise<ViewTableResult> => {
      const response = await viewTable({
        tableName,
        page: params.page,
        limit: TABLE_DATA_LIMIT,
        sort: params.sort ?? undefined,
        filter: params.filter || undefined,
      });
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
}

export type DatabaseTableInfo = ListTablesResult[number];
export type DatabaseTableData = ViewTableResult;
export type DatabaseColumn = ViewTableResult["columns"][number];
export type DatabaseTableRow = ViewTableResult["rows"][number] & {
  _pending?: boolean;
};
