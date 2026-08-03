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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useUpdateUser,
  type UpdateUserFormData,
} from "../behaviors/update-user/use-update-user.hook";
import { toast } from "sonner";
import type { User } from "../users.query";

interface UpdateUserDialogProps {
  actorId: string;
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateUserDialog({ actorId, user, open, onOpenChange }: UpdateUserDialogProps) {
  const { handleUpdateUser, isLoading } = useUpdateUser(actorId);
  const [formData, setFormData] = useState<Omit<UpdateUserFormData, "userId">>({
    email: user?.email ?? "",
    name: user?.name ?? "",
    role: user?.role === "admin" ? "admin" : "user",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      await handleUpdateUser({
        userId: user.id,
        ...formData,
      });

      toast.success("User updated", {
        description: `${formData.name || formData.email} has been updated successfully.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update user", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">Edit User</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="user@example.com"
              required
            />
          </div>

          {/* Name */}
          <div>
            <Label htmlFor="name" className="text-sm font-medium mb-1.5 block">
              Name
            </Label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="John Doe"
            />
          </div>

          {/* Role */}
          <div>
            <Label htmlFor="role" className="text-sm font-medium mb-1.5 block">
              Role
            </Label>
            <Select
              value={formData.role}
              onValueChange={(value) => {
                if (value) setFormData((prev) => ({ ...prev, role: value as "user" | "admin" }))
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
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
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
