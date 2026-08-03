"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { User } from "../users.query";
import { useListUsers } from "../behaviors/list-users/use-list-users.hook";
import { UserRowActions } from "./user-row-actions";
import { formatDistanceToNow } from "date-fns";

interface UsersDataTableProps {
  actorId: string;
  onEditUser: (user: User) => void;
  onResetPassword: (user: User) => void;
  onChangeRole: (user: User) => void;
  onViewSessions: (user: User) => void;
  onImpersonate: (user: User) => void;
  onBanUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export function UsersDataTable({
  actorId,
  onEditUser,
  onResetPassword,
  onChangeRole,
  onViewSessions,
  onImpersonate,
  onBanUser,
  onDeleteUser,
}: UsersDataTableProps) {
  const { users, total, isLoading, page, setPage, limit } = useListUsers(actorId);

  const totalPages = Math.ceil(total / limit);
  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 border rounded-lg">
        <p className="text-sm text-muted-foreground">No users found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              <TableHead className="text-xs font-medium uppercase tracking-wide">
                Name
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">
                Email
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">
                Role
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide">
                Created
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide w-[50px]">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className={`h-12 ${
                  user.banned ? "bg-destructive/5" : "hover:bg-muted/50"
                }`}
              >
                <TableCell className="px-4 py-2 text-sm font-medium">
                  {user.name || "-"}
                </TableCell>
                <TableCell className="px-4 py-2 font-mono text-xs">
                  {user.email}
                </TableCell>
                <TableCell className="px-4 py-2">
                  {user.role === "admin" ? (
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      Admin
                    </Badge>
                  ) : user.banned ? (
                    <Badge className="bg-destructive text-destructive-foreground text-xs">
                      Banned
                    </Badge>
                  ) : (
                    <Badge className="bg-muted text-muted-foreground text-xs">
                      User
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                </TableCell>
                <TableCell className="px-4 py-2">
                  <UserRowActions
                    user={user}
                    onEdit={() => onEditUser(user)}
                    onResetPassword={() => onResetPassword(user)}
                    onChangeRole={() => onChangeRole(user)}
                    onViewSessions={() => onViewSessions(user)}
                    onImpersonate={() => onImpersonate(user)}
                    onBan={() => onBanUser(user)}
                    onDelete={() => onDeleteUser(user)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {page} of {totalPages} ({total} total users)
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p - 1)}
            disabled={!canGoPrevious}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!canGoNext}
          >
            Next
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
