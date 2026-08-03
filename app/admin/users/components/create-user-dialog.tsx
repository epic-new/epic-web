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
  useCreateUser,
  type CreateUserFormData,
} from "../behaviors/create-user/use-create-user.hook";
import { toast } from "sonner";

interface CreateUserDialogProps {
  actorId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ actorId, open, onOpenChange }: CreateUserDialogProps) {
  const { handleCreateUser, isLoading } = useCreateUser(actorId);
  

  const [formData, setFormData] = useState<CreateUserFormData>({
    email: "",
    name: "",
    password: "",
    role: "user",
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    try {
      await handleCreateUser(formData);

      toast.success("User created", {
        description: `${formData.name} has been created successfully.`,
      });

      // Reset form and close dialog
      setFormData({
        email: "",
        name: "",
        password: "",
        role: "user",
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create user", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">Create User</DialogTitle>
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
              className={formErrors.email ? "border-destructive" : ""}
            />
            {formErrors.email && (
              <p className="text-xs text-destructive mt-1">{formErrors.email}</p>
            )}
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
              required
              className={formErrors.name ? "border-destructive" : ""}
            />
            {formErrors.name && (
              <p className="text-xs text-destructive mt-1">{formErrors.name}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-sm font-medium mb-1.5 block">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="••••••••"
              required
              minLength={8}
              className={formErrors.password ? "border-destructive" : ""}
            />
            {formErrors.password && (
              <p className="text-xs text-destructive mt-1">{formErrors.password}</p>
            )}
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
              {isLoading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
