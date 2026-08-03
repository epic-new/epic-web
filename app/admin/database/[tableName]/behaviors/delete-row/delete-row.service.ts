import "server-only";

import {
  DatabaseTableModel,
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
  id: z.union([z.string(), z.number()]),
});

export type DeleteRowInput = z.input<typeof inputSchema>;
export interface DeleteRowResult {
  id: string | number;
}

export class DeleteRow {
  static async execute(command: {
    actor: DatabaseActor;
    input: DeleteRowInput;
  }): Promise<DeleteRowResult> {
    const actor = actorSchema.parse(command.actor);
    const input = inputSchema.parse(command.input);
    this.authorize(actor, [], input.tableName);
    await DatabaseTableModel.delete(input.tableName, input.id);
    return { id: input.id };
  }

  private static authorize(
    actor: DatabaseActor,
    records: readonly DatabaseRowRecord[],
    tableName: string,
  ): void {
    if (!DatabasePolicy.modify(actor, records, {
      tableName,
      environment: process.env.NODE_ENV,
    })) {
      throw new Error("Forbidden - database write access denied");
    }
  }
}
