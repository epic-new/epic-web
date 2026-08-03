"use client";

import { AdminHeader } from "./admin-header";
import { AdminDashboardSkeleton } from "./admin-dashboard-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminStats } from "../behaviors/admin-stats/use-admin-stats.hook";
import { Users, UserCheck, UserX } from "lucide-react";

interface AdminDashboardProps {
  actorId: string;
}

export function AdminDashboard({ actorId }: AdminDashboardProps) {
  const { stats, isLoading, error } = useAdminStats(actorId);

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader
        title="Dashboard"
        description="Overview of your application"
      />

      <div className="flex-1 px-4 md:px-6 py-8">
        {error || !stats ? (
          <p role="alert" className="text-sm text-destructive">
            {error ?? "Unable to load admin statistics"}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Users
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUsers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Banned Users
                </CardTitle>
                <UserX className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.bannedUsers}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
