"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSetRole } from "../behaviors/set-role/use-set-role.hook";
import { toast } from "sonner";
import type { User } from "../users.query";

interface SetRoleDialogProps {
  actorId: string;
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetRoleDialog({ actorId, user, open, onOpenChange }: SetRoleDialogProps) {
  const { handleSetRole, isLoading } = useSetRole(actorId);
  const [role, setRole] = useState<"user" | "admin">(
    user?.role === "admin" ? "admin" : "user",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await handleSetRole({
        userId: user.id,
        role,
      });

      toast.success("Role updated", {
        description: `${user.name || user.email}'s role has been changed to ${role}.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update role", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">Change Role</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-4">
              Change role for <strong>{user.name || user.email}</strong>
            </p>

            <div className="space-y-2">
              <Label htmlFor="role" className="text-sm font-medium">
                Role
              </Label>
              <Select value={role} onValueChange={(value) => { if (value) setRole(value as "user" | "admin") }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {role === "admin" && (
              <div className="mt-4 p-3 bg-muted rounded-md text-sm">
                <p className="font-medium">Admin privileges include:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-muted-foreground">
                  <li>Full access to admin dashboard</li>
                  <li>Manage users and permissions</li>
                  <li>Ban/unban users</li>
                  <li>Impersonate users</li>
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
