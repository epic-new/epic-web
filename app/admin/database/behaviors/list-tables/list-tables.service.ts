import "server-only";

import {
  DatabaseTableModel,
  type DatabaseRowRecord,
  type DatabaseTableSummaryRecord,
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

export type ListTablesResult = DatabaseTableSummaryRecord[];

export class ListTables {
  static async execute(command: {
    actor: DatabaseActor;
  }): Promise<ListTablesResult> {
    const actor = actorSchema.parse(command.actor);
    this.authorize(actor, []);
    return DatabaseTableModel.list();
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
