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
import { Textarea } from "@/components/ui/textarea";
import { useBanUser } from "../behaviors/ban-user/use-ban-user.hook";
import { useUnbanUser } from "../behaviors/unban-user/use-unban-user.hook";
import { toast } from "sonner";
import type { User } from "../users.query";

interface BanUserDialogProps {
  actorId: string;
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BanUserDialog({ actorId, user, open, onOpenChange }: BanUserDialogProps) {
  const { handleBanUser, isLoading: isBanning } = useBanUser(actorId);
  const { handleUnbanUser, isLoading: isUnbanning } = useUnbanUser(actorId);
  

  const [banReason, setBanReason] = useState("");
  const [banExpiresInDays, setBanExpiresInDays] = useState<number | undefined>(undefined);

  const isLoading = isBanning || isUnbanning;
  const isBanned = user?.banned === true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (isBanned) {
        // Unban user
        await handleUnbanUser(user.id);
        toast.success("User unbanned", {
          description: `${user.name || user.email} has been unbanned.`,
        });
      } else {
        // Ban user
        await handleBanUser({
          userId: user.id,
          banReason: banReason || undefined,
          banExpiresInDays,
        });
        toast.success("User banned", {
          description: `${user.name || user.email} has been banned.`,
        });
      }

      // Reset form
      setBanReason("");
      setBanExpiresInDays(undefined);
      onOpenChange(false);
    } catch (error) {
      toast.error(isBanned ? "Failed to unban user" : "Failed to ban user", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            {isBanned ? "Unban User" : "Ban User"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isBanned ? (
            <div className="py-4">
              <p className="text-sm">
                Are you sure you want to unban <strong>{user.name || user.email}</strong>?
              </p>
              {user.banReason && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground">Current ban reason:</p>
                  <p className="text-sm mt-1">{user.banReason}</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Ban Reason */}
              <div>
                <Label htmlFor="banReason" className="text-sm font-medium mb-1.5 block">
                  Ban Reason (optional)
                </Label>
                <Textarea
                  id="banReason"
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  placeholder="Violation of terms of service..."
                  rows={3}
                />
              </div>

              {/* Ban Expires In Days */}
              <div>
                <Label htmlFor="banExpiresInDays" className="text-sm font-medium mb-1.5 block">
                  Ban Duration (days, optional)
                </Label>
                <Input
                  id="banExpiresInDays"
                  type="number"
                  min="1"
                  value={banExpiresInDays || ""}
                  onChange={(e) =>
                    setBanExpiresInDays(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                  placeholder="Leave empty for permanent ban"
                />
              </div>

              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                <p>Banning this user will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Immediately revoke all active sessions</li>
                  <li>Prevent the user from signing in</li>
                </ul>
              </div>
            </>
          )}

          <DialogFooter className="pt-4 border-t flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className={isBanned ? "" : "bg-destructive text-destructive-foreground hover:bg-destructive/90"}
            >
              {isLoading
                ? isBanned
                  ? "Unbanning..."
                  : "Banning..."
                : isBanned
                  ? "Unban User"
                  : "Ban User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
