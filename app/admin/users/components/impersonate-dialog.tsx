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
import { useImpersonateUser } from "../behaviors/impersonate-user/use-impersonate-user.hook";
import { toast } from "sonner";
import type { User } from "../users.query";

interface ImpersonateDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImpersonateDialog({
  user,
  open,
  onOpenChange,
}: ImpersonateDialogProps) {
  const { handleImpersonateUser, isLoading } = useImpersonateUser();

  const handleConfirm = async () => {
    if (!user) return;

    try {
      await handleImpersonateUser(user.id);
      // Will redirect on success, so no toast needed here
    } catch (error) {
      toast.error("Failed to impersonate user", {
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
            Impersonate User
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground pt-2">
            Impersonate <strong>{user.name || user.email}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4 space-y-3 text-sm">
          <p>You will be signed in as this user and can:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
            <li>View the app from their perspective</li>
            <li>Access their data and permissions</li>
            <li>Perform actions on their behalf</li>
          </ul>

          <div className="bg-muted p-3 rounded-md mt-4">
            <p className="font-medium text-xs">Security Notice:</p>
            <p className="text-xs text-muted-foreground mt-1">
              The impersonation session will last for 1 hour. You can stop impersonating at any time.
            </p>
          </div>
        </div>

        <AlertDialogFooter className="pt-4 border-t flex justify-end gap-2">
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Starting..." : "Start Impersonating"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
