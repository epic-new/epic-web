"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Pencil,
  Key,
  Shield,
  Lock,
  Eye,
  Ban,
  Trash2,
} from "lucide-react";
import type { User } from "../users.query";

interface UserRowActionsProps {
  user: User;
  onEdit: () => void;
  onResetPassword: () => void;
  onChangeRole: () => void;
  onViewSessions: () => void;
  onImpersonate: () => void;
  onBan: () => void;
  onDelete: () => void;
}

export function UserRowActions({
  user,
  onEdit,
  onResetPassword,
  onChangeRole,
  onViewSessions,
  onImpersonate,
  onBan,
  onDelete,
}: UserRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="h-8 w-8 p-0" aria-label={`Actions for ${user.name || user.email}`} />}>
          <MoreHorizontal className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
          Edit User
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onResetPassword}>
          <Key className="mr-2 h-4 w-4 text-muted-foreground" />
          Reset Password
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onChangeRole}>
          <Shield className="mr-2 h-4 w-4 text-muted-foreground" />
          Change Role
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onViewSessions}>
          <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
          View Sessions
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onImpersonate}>
          <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
          Impersonate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onBan} className="text-destructive">
          <Ban className="mr-2 h-4 w-4" />
          {user.banned ? "Unban User" : "Ban User"}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
