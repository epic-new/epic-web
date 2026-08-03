import "server-only";

import {
  DatabaseTableModel,
  type DatabaseColumnRecord,
  type DatabaseRowRecord,
} from "@/shared/models/database-table";
import {
  DatabasePolicy,
  type DatabaseActor,
} from "@/shared/policies/database.policy";
import { z } from "zod";

const actorSchema = z.object({
  id: z.string().min(1),
  role: z.string().nullable().optional(),
});

const inputSchema = z.object({
  tableName: z.string().trim().min(1, "Table name is required"),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sort: z.object({
    column: z.string().trim().min(1),
    direction: z.enum(["asc", "desc"]),
  }).optional(),
  filter: z.string().optional(),
});

export type ViewTableInput = z.input<typeof inputSchema>;

export interface ViewTableResult {
  rows: DatabaseRowRecord[];
  columns: DatabaseColumnRecord[];
  total: number;
  page: number;
  totalPages: number;
}

export class ViewTable {
  static async execute(command: {
    actor: DatabaseActor;
    input: ViewTableInput;
  }): Promise<ViewTableResult> {
    const actor = actorSchema.parse(command.actor);
    this.authorize(actor, []);
    const input = inputSchema.parse(command.input);
    const metadata = DatabaseTableModel.metadata(input.tableName);
    if (!metadata) throw new Error(`Table "${input.tableName}" not found`);

    if (input.sort && !metadata.columns.some(
      (column) => column.name === input.sort?.column,
    )) {
      throw new Error(`Column "${input.sort.column}" not found in table`);
    }

    const result = await DatabaseTableModel.rows(input);
    return {
      rows: result.rows,
      columns: metadata.columns,
      total: result.total,
      page: input.page,
      totalPages: Math.ceil(result.total / input.limit),
    };
  }

  private static authorize(
    actor: DatabaseActor,
    records: readonly DatabaseRowRecord[],
  ): void {
    if (!DatabasePolicy.inspect(actor, records)) {
      throw new Error("Forbidden - admin role required");
    }
  }
}
