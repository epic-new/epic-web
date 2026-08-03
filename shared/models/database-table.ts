import "server-only";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { getTableColumns, getTableName, sql } from "drizzle-orm";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";

export interface DatabaseColumnRecord {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isUnique: boolean;
  hasDefault: boolean;
}

export interface DatabaseTableRecord {
  name: string;
  columns: DatabaseColumnRecord[];
}

export interface DatabaseTableSummaryRecord {
  name: string;
  rowCount: number;
}

export type DatabaseRowRecord = Record<string, unknown>;

export interface DatabaseRowsQuery {
  tableName: string;
  page: number;
  limit: number;
  sort?: {
    column: string;
    direction: "asc" | "desc";
  };
  filter?: string;
}

export interface DatabaseRowsResult {
  rows: DatabaseRowRecord[];
  total: number;
}

/**
 * Infrastructure boundary for the schema-driven database administrator.
 *
 * Unlike ordinary Models, this Model intentionally represents the set of
 * Drizzle tables because the feature browses tables dynamically. All dynamic
 * identifiers are resolved against the exported schema before SQL is built.
 */
export class DatabaseTableModel {
  static async list(): Promise<DatabaseTableSummaryRecord[]> {
    return Promise.all(
      this.tableNames().map(async (name) => ({
        name,
        rowCount: await this.count(name),
      })),
    );
  }

  static metadata(tableName: string): DatabaseTableRecord | null {
    const table = this.findTable(tableName);
    if (!table) return null;

    const columns = Object.values(getTableColumns(table)).map((column) => ({
      name: column.name,
      type: mapDrizzleType(column.dataType),
      isNullable: !column.notNull,
      isPrimaryKey: column.primary,
      isUnique: column.isUnique,
      hasDefault: column.hasDefault,
    }));

    return { name: tableName, columns };
  }

  static async rows(query: DatabaseRowsQuery): Promise<DatabaseRowsResult> {
    const metadata = this.requireMetadata(query.tableName);
    const tableIdentifier = identifier(query.tableName);
    const offset = (query.page - 1) * query.limit;
    const textColumns = metadata.columns.filter((column) => column.type === "text");

    let whereClause = sql``;
    if (query.filter?.trim() && textColumns.length > 0) {
      const pattern = `%${query.filter.trim()}%`;
      const conditions = textColumns.map(
        (column) => sql`${sql.raw(identifier(column.name))} LIKE ${pattern}`,
      );
      whereClause = sql`WHERE (${sql.join(conditions, sql` OR `)})`;
    }

    let orderClause = sql``;
    if (query.sort) {
      const columnExists = metadata.columns.some(
        (column) => column.name === query.sort?.column,
      );
      if (!columnExists) {
        throw new Error(`Column "${query.sort.column}" not found in table`);
      }
      orderClause = sql`ORDER BY ${sql.raw(identifier(query.sort.column))} ${
        sql.raw(query.sort.direction.toUpperCase())
      }`;
    }

    const countResult = await db.run(
      sql`SELECT COUNT(*) AS count FROM ${sql.raw(tableIdentifier)} ${whereClause}`,
    );
    const total = Number(
      (countResult.rows[0] as unknown as { count: number | string } | undefined)
        ?.count ?? 0,
    );

    const dataResult = await db.run(
      sql`SELECT * FROM ${sql.raw(tableIdentifier)} ${whereClause} ${orderClause}
          LIMIT ${query.limit} OFFSET ${offset}`,
    );

    return {
      rows: dataResult.rows.map(toPlainRow),
      total,
    };
  }

  static async insert(
    tableName: string,
    values: DatabaseRowRecord,
  ): Promise<DatabaseRowRecord> {
    const metadata = this.requireMetadata(tableName);
    const validColumns = new Set(metadata.columns.map((column) => column.name));
    const entries = Object.entries(values);

    for (const [column] of entries) {
      if (!validColumns.has(column)) {
        throw new Error(`Column "${column}" not found in table "${tableName}"`);
      }
    }

    const result = entries.length === 0
      ? await db.run(
          sql`INSERT INTO ${sql.raw(identifier(tableName))} DEFAULT VALUES RETURNING *`,
        )
      : await db.run(
          sql`INSERT INTO ${sql.raw(identifier(tableName))}
              (${sql.join(entries.map(([column]) => sql.raw(identifier(column))), sql`, `)})
              VALUES (${sql.join(entries.map(([, value]) => sql`${toSqlValue(value)}`), sql`, `)})
              RETURNING *`,
        );

    const row = result.rows[0];
    if (!row) throw new Error("Failed to insert row");
    return toPlainRow(row);
  }

  static async update(
    tableName: string,
    id: string | number,
    values: DatabaseRowRecord,
  ): Promise<DatabaseRowRecord> {
    const metadata = this.requireMetadata(tableName);
    const primaryKey = metadata.columns.find((column) => column.isPrimaryKey);
    if (!primaryKey) {
      throw new Error(`No primary key found for table "${tableName}"`);
    }

    const validColumns = new Set(metadata.columns.map((column) => column.name));
    const entries = Object.entries(values);
    if (entries.length === 0) throw new Error("No data to update");

    for (const [column] of entries) {
      if (!validColumns.has(column)) {
        throw new Error(`Column "${column}" not found in table "${tableName}"`);
      }
      if (column === primaryKey.name) {
        throw new Error("The primary key cannot be updated");
      }
    }

    const assignments = entries.map(
      ([column, value]) =>
        sql`${sql.raw(identifier(column))} = ${toSqlValue(value)}`,
    );
    const result = await db.run(
      sql`UPDATE ${sql.raw(identifier(tableName))}
          SET ${sql.join(assignments, sql`, `)}
          WHERE ${sql.raw(identifier(primaryKey.name))} = ${id}
          RETURNING *`,
    );

    const row = result.rows[0];
    if (!row) throw new Error("Row not found");
    return toPlainRow(row);
  }

  static async delete(tableName: string, id: string | number): Promise<void> {
    const metadata = this.requireMetadata(tableName);
    const primaryKey = metadata.columns.find((column) => column.isPrimaryKey);
    if (!primaryKey) {
      throw new Error(`No primary key found for table "${tableName}"`);
    }

    const result = await db.run(
      sql`DELETE FROM ${sql.raw(identifier(tableName))}
          WHERE ${sql.raw(identifier(primaryKey.name))} = ${id}`,
    );
    if (result.rowsAffected === 0) throw new Error("Row not found");
  }

  private static async count(tableName: string): Promise<number> {
    this.requireMetadata(tableName);
    const result = await db.run(
      sql`SELECT COUNT(*) AS count FROM ${sql.raw(identifier(tableName))}`,
    );
    return Number(
      (result.rows[0] as unknown as { count: number | string } | undefined)?.count ?? 0,
    );
  }

  private static tableNames(): string[] {
    const values: unknown[] = Object.values(schema);
    return values
      .filter(isTable)
      .map((table) => getTableName(table))
      .sort();
  }

  private static findTable(tableName: string): SQLiteTable | null {
    const values: unknown[] = Object.values(schema);
    return values.find(
      (value): value is SQLiteTable => isTable(value) && getTableName(value) === tableName,
    ) ?? null;
  }

  private static requireMetadata(tableName: string): DatabaseTableRecord {
    const metadata = this.metadata(tableName);
    if (!metadata) throw new Error(`Table "${tableName}" not found`);
    return metadata;
  }
}

function isTable(value: unknown): value is SQLiteTable {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as Record<symbol, unknown>)[Symbol.for("drizzle:IsDrizzleTable")],
  );
}

function identifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function mapDrizzleType(dataType: string): string {
  return {
    string: "text",
    number: "integer",
    boolean: "boolean",
    date: "timestamp",
    bigint: "bigint",
    json: "json",
  }[dataType] ?? dataType;
}

function toSqlValue(value: unknown): string | number | bigint | boolean | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number" ||
      typeof value === "bigint" || typeof value === "boolean") {
    return value;
  }
  return JSON.stringify(value);
}

function toPlainRow(value: unknown): DatabaseRowRecord {
  const row = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.entries(row).map(([key, entry]) => [
      key,
      entry instanceof Date ? entry.toISOString() : entry,
    ]),
  );
}
