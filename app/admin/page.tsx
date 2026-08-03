import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getUser } from "@/lib/auth";
import { getQueryClient } from "@/lib/get-query-client";
import { adminStatsQuery } from "./admin.query";
import { AdminDashboard } from "./components/admin-dashboard";

export default async function AdminPage() {
  const { user } = await getUser();

  // The parent layout renders its access-denied state for these requests.
  if (!user || user.role !== "admin") {
    return null;
  }

  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(adminStatsQuery(user.id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdminDashboard actorId={user.id} />
    </HydrationBoundary>
  );
}
