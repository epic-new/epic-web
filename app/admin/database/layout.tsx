import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getUser } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";
import { AdminHeader } from "../components/admin-header";
import { DatabaseSidebar } from "./components/database-sidebar";
import { listTablesQuery } from "./database.query";

// Server Component: prefetch the table list so the sidebar hydrates without
// a loading flash.
export default async function DatabaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getUser();
  if (!user || user.role !== "admin") return null;

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(listTablesQuery(user.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="h-screen flex flex-col overflow-hidden">
        <AdminHeader />
        <div className="flex-1 flex min-h-0">
          <DatabaseSidebar actorId={user.id} />
          <main className="flex-1 overflow-auto flex flex-col">{children}</main>
        </div>
      </div>
    </HydrationBoundary>
  );
}
