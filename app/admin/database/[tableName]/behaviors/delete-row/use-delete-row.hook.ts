"use client";

import { useAtom } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dialogAtom, type TableRow } from "../../state";
import { deleteRowMutation } from "./delete-row.mutation";

export function useDeleteRow(actorId: string, tableName: string) {
  const [dialog, setDialog] = useAtom(dialogAtom);
  const mutation = useMutation(
    deleteRowMutation(useQueryClient(), actorId, tableName),
  );
  const ownsDialog = dialog.tableName === tableName;
  const closeDialog = () => setDialog((current) => current.tableName === tableName
    ? { tableName: null, type: null, row: null, isDuplicate: false }
    : current);

  const handleDeleteRow = async (id: string | number) => {
    try {
      const deleted = await mutation.mutateAsync(id);
      closeDialog();
      toast.success("Row deleted successfully");
      return deleted;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete row");
      throw error;
    }
  };

  return {
    handleDeleteRow,
    handleOpenDialog: (row: TableRow) =>
      setDialog({ tableName, type: "delete", row, isDuplicate: false }),
    handleCloseDialog: closeDialog,
    isDialogOpen: ownsDialog && dialog.type === "delete",
    selectedRow: ownsDialog && dialog.type === "delete" ? dialog.row : null,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
