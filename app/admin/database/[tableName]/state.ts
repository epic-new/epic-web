import { atom } from "jotai";
import type {
  DatabaseColumn,
  DatabaseSortState,
  DatabaseTableRow,
} from "../database.query";

export type ColumnMetadata = DatabaseColumn;
export type SortState = DatabaseSortState;
export type TableRow = DatabaseTableRow;

// Consolidated dialog state
export type DialogType = "add" | "edit" | "delete" | null;

export interface DialogState {
  tableName: string | null;
  type: DialogType;
  row: TableRow | null;
  isDuplicate: boolean;
}

// Server state lives in TanStack Query. This shared atom coordinates only the
// mutually-exclusive add/edit/delete dialogs.
export const dialogAtom = atom<DialogState>({
  tableName: null,
  type: null,
  row: null,
  isDuplicate: false,
});
