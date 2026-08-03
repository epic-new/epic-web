"use client";

import { useAtom } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dialogAtom, type TableRow } from "../../state";
import { addRowMutation } from "./add-row.mutation";

export function useAddRow(actorId: string, tableName: string) {
  const [dialog, setDialog] = useAtom(dialogAtom);
  const mutation = useMutation(
    addRowMutation(useQueryClient(), actorId, tableName),
  );
  const ownsDialog = dialog.tableName === tableName;
  const isDuplicate = ownsDialog && dialog.type === "add" && dialog.isDuplicate;
  const closeDialog = () => setDialog((current) => current.tableName === tableName
    ? { tableName: null, type: null, row: null, isDuplicate: false }
    : current);

  const handleAddRow = async (data: Record<string, unknown>) => {
    try {
      const created = await mutation.mutateAsync(data);
      closeDialog();
      toast.success("Row added successfully");
      return created;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add row");
      throw error;
    }
  };

  const handleOpenDialog = (initialData?: Record<string, unknown>) => {
    if (!initialData) {
      setDialog({ tableName, type: "add", row: null, isDuplicate: false });
      return;
    }
    const duplicate = { ...initialData };
    delete duplicate.id;
    delete duplicate._pending;
    setDialog({
      tableName,
      type: "add",
      row: duplicate as TableRow,
      isDuplicate: true,
    });
  };

  return {
    handleAddRow,
    handleOpenDialog,
    handleCloseDialog: closeDialog,
    isDialogOpen: ownsDialog && dialog.type === "add",
    isDuplicate,
    duplicateRow: isDuplicate ? dialog.row : null,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
