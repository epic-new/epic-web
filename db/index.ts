import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";
import { createClient } from "@libsql/client";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

// Load environment variables based on NODE_ENV
dotenv.config({ path: '.env', quiet: true });
if (process.env.NODE_ENV === 'development') {
  dotenv.config({ path: '.env.development', override: true, quiet: true });
} else if (process.env.NODE_ENV === 'test') {
  dotenv.config({ path: '.env.test', override: true, quiet: true });
} else if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production', override: true, quiet: true });
}

if (process.env.NODE_ENV === 'test' && process.env.DATABASE_URL !== ':memory:') {
  throw new Error(
    'Refusing to initialize tests with a non-memory DATABASE_URL',
  );
}

// Reuse DB instance to avoid too many connections in dev HMR
declare global {
  var db: LibSQLDatabase<typeof schema> | undefined;
}

function createDbInstance() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // LibSQL opens a new connection after a transaction. A plain `:memory:` URL
  // would therefore point that connection at a fresh, empty database. Shared
  // cache keeps every connection in this test process on the same in-memory DB.
  const clientUrl = process.env.NODE_ENV === "test" && url === ":memory:"
    ? "file::memory:?cache=shared"
    : url;

  const client = createClient({
    url: clientUrl,
    authToken: process.env.TURSO_DATABASE_TOKEN,
  });

  return drizzle(client, { schema });
}

const dbInstance = global.db ?? (global.db = createDbInstance());

export const db = dbInstance;

export type DatabaseExecutor = Pick<
  typeof db,
  "select" | "insert" | "update" | "delete"
>;

export function withTransaction<T>(
  operation: (executor: DatabaseExecutor) => Promise<T>,
): Promise<T> {
  return db.transaction((transaction) => operation(transaction));
}
