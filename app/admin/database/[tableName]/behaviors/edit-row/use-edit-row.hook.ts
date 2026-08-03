"use client";

import { useAtom } from "jotai";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { dialogAtom, type TableRow } from "../../state";
import { editRowMutation, type EditRowVariables } from "./edit-row.mutation";

export function useEditRow(actorId: string, tableName: string) {
  const [dialog, setDialog] = useAtom(dialogAtom);
  const mutation = useMutation(
    editRowMutation(useQueryClient(), actorId, tableName),
  );
  const ownsDialog = dialog.tableName === tableName;
  const selectedRow = ownsDialog && dialog.type === "edit" ? dialog.row : null;
  const closeDialog = () => setDialog((current) => current.tableName === tableName
    ? { tableName: null, type: null, row: null, isDuplicate: false }
    : current);

  const execute = async (variables: EditRowVariables) => {
    try {
      const updated = await mutation.mutateAsync(variables);
      if (variables.mode === "row") {
        closeDialog();
        toast.success("Row updated successfully");
      } else {
        toast.success("Cell updated successfully");
      }
      return updated;
    } catch (error) {
      const fallback = variables.mode === "row"
        ? "Failed to update row"
        : "Failed to update cell";
      toast.error(error instanceof Error ? error.message : fallback);
      throw error;
    }
  };

  const handleEditRow = (data: Record<string, unknown>) => {
    if (selectedRow?.id === undefined || selectedRow.id === null) {
      return Promise.resolve(undefined);
    }
    return execute({ id: selectedRow.id as string | number, data, mode: "row" });
  };

  return {
    handleEditRow,
    handleEditCell: (id: string | number, column: string, value: unknown) =>
      execute({ id, data: { [column]: value }, mode: "cell" }),
    handleOpenDialog: (row: TableRow) =>
      setDialog({ tableName, type: "edit", row, isDuplicate: false }),
    handleCloseDialog: closeDialog,
    isDialogOpen: ownsDialog && dialog.type === "edit",
    selectedRow,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
