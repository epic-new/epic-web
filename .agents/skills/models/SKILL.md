---
name: models
description: Create static, table-oriented Models in shared/models that isolate Drizzle queries and return schema-inferred plain records. Use when adding persistence operations, extracting database access from a Service, or testing table-level database behavior.
---

# Models

Models are Infrastructure. Each Model represents one database table, owns its
Drizzle queries, and returns plain schema-inferred records. Models use static
methods; callers do not instantiate them.

## Location

```text
shared/models/
  item.ts
  tests/
    item.test.ts
```

## Contract

```typescript
import "server-only";

import { db } from "@/db";
import { item } from "@/db/schema";
import { eq } from "drizzle-orm";

export type ItemRecord = typeof item.$inferSelect;
export type NewItemRecord = typeof item.$inferInsert;

export class ItemModel {
  static async find(id: string): Promise<ItemRecord | null> {
    const [record] = await db
      .select()
      .from(item)
      .where(eq(item.id, id))
      .limit(1);

    return record ?? null;
  }

  static async create(values: NewItemRecord): Promise<ItemRecord> {
    const [record] = await db.insert(item).values(values).returning();
    if (!record) throw new Error("Unable to create item");
    return record;
  }
}
```

## Rules

- Export a schema-inferred `[Name]Record` type.
- Use a static class; do not return class instances.
- Own all Drizzle table/operator imports and query construction.
- Return complete plain records unless a deliberately named projection is part of
  the Model contract.
- Accept an optional transaction executor when a Service must compose operations
  atomically.
- Keep table-level persistence and universally valid storage rules here.
- Keep authentication, actor-dependent authorization, Policies, use-case
  validation, sequencing, and UI concerns out of Models.
- Never call Actions, Routes, Services, Hooks, or Components.

Query methods may accept filters chosen by a Service, such as `userId` or active
status. Receiving a filter is not authorization: the Service and Policy still own
the decision that the actor may perform the behavior.

## Transactions

A transaction-aware method uses the supplied executor instead of the global
database. Never start an independent hidden transaction inside a Model method
when the calling Service already established one.

## Verification

Model tests use real in-memory SQLite and verify persistence outcomes directly:

1. Seed the table with `PreDB`.
2. Call the public static Model method.
3. Assert the returned plain record.
4. Verify the table with `PostDB`.

Do not mock Drizzle or the database.

```bash
bun run test shared/models/tests/item.test.ts
```

The canonical Model specification format lives in
`docs/references/specification.md`.
