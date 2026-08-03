import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getUser } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";
import { listUsersQuery, defaultUsersParams } from "./users.query";
import { UsersPageContent } from "./users-page-content";

// Server Component: prefetch the default users list and hand the dehydrated
// cache to the client so the table renders without a loading flash.
export default async function AdminUsersPage() {
  const { user } = await getUser();
  if (!user || user.role !== "admin") return null;
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(listUsersQuery(user.id, defaultUsersParams));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersPageContent actorId={user.id} />
    </HydrationBoundary>
  );
}
