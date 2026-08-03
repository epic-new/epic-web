import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getUser } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";
import {
  tableDataQuery,
  defaultDatabaseTableDataParams,
} from "../database.query";
import { TableViewContent } from "./table-view-content";

// Server Component: prefetch the first page of the selected table and hydrate
// the client so rows render without a loading flash.
export default async function TableViewPage({
  params,
}: {
  params: Promise<{ tableName: string }>;
}) {
  const { tableName } = await params;
  const { user } = await getUser();
  if (!user || user.role !== "admin") return null;

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(
    tableDataQuery(user.id, tableName, defaultDatabaseTableDataParams)
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TableViewContent key={tableName} actorId={user.id} tableName={tableName} />
    </HydrationBoundary>
  );
}
