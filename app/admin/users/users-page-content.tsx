"use client";

import { useState } from "react";
import { UsersTableToolbar } from "./components/users-table-toolbar";
import { UsersDataTable } from "./components/users-data-table";
import { CreateUserDialog } from "./components/create-user-dialog";
import { UpdateUserDialog } from "./components/update-user-dialog";
import { DeleteUserDialog } from "./components/delete-user-dialog";
import { BanUserDialog } from "./components/ban-user-dialog";
import { SetRoleDialog } from "./components/set-role-dialog";
import { SetPasswordDialog } from "./components/set-password-dialog";
import { SessionsDialog } from "./components/sessions-dialog";
import { ImpersonateDialog } from "./components/impersonate-dialog";
import { useListUsers } from "./behaviors/list-users/use-list-users.hook";
import { AdminHeader } from "../components/admin-header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import type { User } from "./users.query";

export function UsersPageContent({ actorId }: { actorId: string }) {
  const { error } = useListUsers(actorId);

  // Dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [sessionsDialogOpen, setSessionsDialogOpen] = useState(false);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Handlers
  const handleCreateUser = () => {
    setCreateDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUpdateDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordDialogOpen(true);
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleViewSessions = (user: User) => {
    setSelectedUser(user);
    setSessionsDialogOpen(true);
  };

  const handleImpersonate = (user: User) => {
    setSelectedUser(user);
    setImpersonateDialogOpen(true);
  };

  const handleBanUser = (user: User) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleDeleteUser = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader
        title="Users"
        description="Manage user accounts and permissions"
        action={
          <Button onClick={handleCreateUser}>
            <Plus className="mr-2 h-4 w-4" />
            Create User
          </Button>
        }
      />

      <div className="flex-1 px-4 md:px-6 py-8 space-y-6">
        {/* Error message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Toolbar */}
        <UsersTableToolbar actorId={actorId} />

        {/* Data table */}
        <UsersDataTable
          actorId={actorId}
          onEditUser={handleEditUser}
          onResetPassword={handleResetPassword}
          onChangeRole={handleChangeRole}
          onViewSessions={handleViewSessions}
          onImpersonate={handleImpersonate}
          onBanUser={handleBanUser}
          onDeleteUser={handleDeleteUser}
        />
      </div>

      {/* Dialogs */}
      <CreateUserDialog
        actorId={actorId}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
      <UpdateUserDialog
        key={`${selectedUser?.id ?? "none"}-${updateDialogOpen}`}
        actorId={actorId}
        user={selectedUser}
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
      />
      <DeleteUserDialog
        actorId={actorId}
        user={selectedUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
      <BanUserDialog
        actorId={actorId}
        user={selectedUser}
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
      />
      <SetRoleDialog
        key={`${selectedUser?.id ?? "none"}-${roleDialogOpen}`}
        actorId={actorId}
        user={selectedUser}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      />
      <SetPasswordDialog
        user={selectedUser}
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />
      <SessionsDialog
        actorId={actorId}
        user={selectedUser}
        open={sessionsDialogOpen}
        onOpenChange={setSessionsDialogOpen}
      />
      <ImpersonateDialog
        user={selectedUser}
        open={impersonateDialogOpen}
        onOpenChange={setImpersonateDialogOpen}
      />
    </div>
  );
}
