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
  id: z.union([z.string(), z.number()]),
  data: z.record(z.string(), z.unknown()),
});

export type EditRowInput = z.input<typeof inputSchema>;
export type EditRowResult = DatabaseRowRecord;

export class EditRow {
  static async execute(command: {
    actor: DatabaseActor;
    input: EditRowInput;
  }): Promise<EditRowResult> {
    const actor = actorSchema.parse(command.actor);
    const input = inputSchema.parse(command.input);
    this.authorize(actor, [], input.tableName);
    const metadata = DatabaseTableModel.metadata(input.tableName);
    if (!metadata) throw new Error(`Table "${input.tableName}" not found`);

    const primaryKey = metadata.columns.find((column) => column.isPrimaryKey);
    if (!primaryKey) {
      throw new Error(`No primary key found for table "${input.tableName}"`);
    }

    const columns = new Map(metadata.columns.map((column) => [column.name, column]));
    const prepared: DatabaseRowRecord = { ...input.data };
    delete prepared._pending;
    delete prepared[primaryKey.name];

    for (const [columnName, value] of Object.entries(prepared)) {
      const column = columns.get(columnName);
      if (!column) {
        throw new Error(`Column "${columnName}" not found in table "${input.tableName}"`);
      }
      prepared[columnName] = parseColumnValue(column, value);
    }

    if (columns.has("updated_at")) prepared.updated_at = Date.now();
    if (Object.keys(prepared).length === 0) throw new Error("No data to update");

    return DatabaseTableModel.update(input.tableName, input.id, prepared);
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

function parseColumnValue(column: DatabaseColumnRecord, value: unknown): unknown {
  if (value === null) {
    if (!column.isNullable) throw new Error(`${column.name} is required`);
    return null;
  }

  try {
    switch (column.type) {
      case "text":
        return z.string().parse(value);
      case "integer":
      case "bigint":
        return z.coerce.number().parse(value);
      case "boolean":
        return z.union([z.boolean(), z.number()]).transform(
          (entry) => typeof entry === "boolean" ? entry : entry === 1,
        ).parse(value);
      case "timestamp":
        return z.union([z.number(), z.date(), z.string()]).transform((entry) => {
          if (typeof entry === "number") return entry;
          const date = entry instanceof Date ? entry : new Date(entry);
          if (Number.isNaN(date.getTime())) throw new Error("Invalid timestamp");
          return date.getTime();
        }).parse(value);
      default:
        return value;
    }
  } catch {
    throw new Error(`Invalid value for column "${column.name}"`);
  }
}
