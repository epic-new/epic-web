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
import { useSetPassword } from "../behaviors/set-password/use-set-password.hook";
import { toast } from "sonner";
import type { User } from "../users.query";

interface SetPasswordDialogProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SetPasswordDialog({ user, open, onOpenChange }: SetPasswordDialogProps) {
  const { handleSetPassword, isLoading } = useSetPassword();
  

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setFormError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match");
      return;
    }

    // Validate minimum length
    if (newPassword.length < 8) {
      setFormError("Password must be at least 8 characters");
      return;
    }

    try {
      await handleSetPassword({
        userId: user.id,
        newPassword,
      });

      toast.success("Password reset", {
        description: `Password for ${user.name || user.email} has been reset successfully.`,
      });

      // Reset form
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to reset password", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">Reset Password</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Reset password for <strong>{user.name || user.email}</strong>
          </p>

          {/* New Password */}
          <div>
            <Label htmlFor="newPassword" className="text-sm font-medium mb-1.5 block">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="text-sm font-medium mb-1.5 block">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={8}
            />
          </div>

          {formError && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <p className="text-sm text-destructive">{formError}</p>
            </div>
          )}

          <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
            <p>Password requirements:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Minimum 8 characters</li>
              <li>User will be able to sign in immediately with the new password</li>
            </ul>
          </div>

          <DialogFooter className="pt-4 border-t flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setNewPassword("");
                setConfirmPassword("");
                setFormError("");
                onOpenChange(false);
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
