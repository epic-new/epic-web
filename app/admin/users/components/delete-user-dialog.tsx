"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useDeleteUser } from "../behaviors/delete-user/use-delete-user.hook";
import { toast } from "sonner";
import type { User } from "../users.query";

interface DeleteUserDialogProps {
  actorId: string;
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteUserDialog({
  user,
  actorId,
  open,
  onOpenChange,
}: DeleteUserDialogProps) {
  const { handleDeleteUser, isLoading } = useDeleteUser(actorId);
  

  const handleConfirm = async () => {
    if (!user) return;

    try {
      await handleDeleteUser(user.id);

      toast.success("User deleted", {
        description: `${user.name || user.email} has been permanently deleted.`,
      });

      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete user", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="pb-4 border-b">
          <AlertDialogTitle className="text-lg font-semibold">
            Delete User
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground pt-2">
            Are you sure you want to delete <strong>{user.name || user.email}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-2 text-sm">
          <p>This action cannot be undone. All user data will be permanently removed from the system.</p>
        </div>

        <AlertDialogFooter className="pt-4 border-t flex justify-end gap-2">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
