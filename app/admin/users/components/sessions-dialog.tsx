"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useListSessions } from "../behaviors/list-sessions/use-list-sessions.hook";
import { useRevokeSession } from "../behaviors/revoke-session/use-revoke-session.hook";
import { useRevokeAllSessions } from "../behaviors/revoke-all-sessions/use-revoke-all-sessions.hook";
import { toast } from "sonner";
import type { User } from "../users.query";
import { formatDistanceToNow } from "date-fns";

interface SessionsDialogProps {
  actorId: string;
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SessionsDialog({ actorId, user, open, onOpenChange }: SessionsDialogProps) {
  const { sessions, isLoading } = useListSessions(actorId, user?.id, open);
  const { handleRevokeSession, isLoading: isRevokingOne } = useRevokeSession(actorId);
  const { handleRevokeAllSessions, isLoading: isRevokingAll } = useRevokeAllSessions(actorId);

  const handleRevoke = async (sessionToken: string) => {
    try {
      await handleRevokeSession(sessionToken);
      toast.success("Session revoked", {
        description: "The session has been revoked successfully.",
      });
    } catch (error) {
      toast.error("Failed to revoke session", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  const handleRevokeAll = async () => {
    if (!user) return;

    try {
      await handleRevokeAllSessions(user.id);
      toast.success("All sessions revoked", {
        description: `All sessions for ${user.name || user.email} have been revoked.`,
      });
    } catch (error) {
      toast.error("Failed to revoke all sessions", {
        description: error instanceof Error ? error.message : "An error occurred",
      });
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            Active Sessions for {user.name || user.email}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-sm text-muted-foreground">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex items-center justify-center py-8 border rounded-lg">
              <p className="text-sm text-muted-foreground">No active sessions</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-xs font-medium uppercase tracking-wide">
                      Token
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide">
                      Created
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide">
                      IP Address
                    </TableHead>
                    <TableHead className="text-xs font-medium uppercase tracking-wide w-[100px]">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id} className="h-12">
                      <TableCell className="px-4 py-2 font-mono text-xs">
                        {session.token.substring(0, 12)}...
                      </TableCell>
                      <TableCell className="px-4 py-2 text-sm">
                        {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="px-4 py-2 text-sm">
                        {session.ipAddress || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevoke(session.token)}
                          disabled={isRevokingOne || isRevokingAll}
                        >
                          Revoke
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t flex justify-between">
          {sessions.length > 0 && (
            <Button
              variant="destructive"
              onClick={handleRevokeAll}
              disabled={isRevokingOne || isRevokingAll}
            >
              {isRevokingAll ? "Revoking All..." : "Revoke All"}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={() => onOpenChange(false)}
            className="ml-auto"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
