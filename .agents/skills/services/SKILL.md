---
name: services
description: Create or refactor behavior-named Service classes that own validation, authorization, business rules, sequencing, and transaction boundaries while delegating persistence to Models. Use when implementing or testing the server-side business logic for a behavior.
---

# Services

Implement one stateless Service class per behavior in `[name].service.ts`. Keep the
behavior-named class and one public `static execute` method. Do not add a second
wrapper or append `Service` to the class name merely because the file belongs to
the Service layer.

## Architecture

```text
Presentation -> Controller -> Service -> Infrastructure
Hook         -> Action     -> Service -> Model / Integration
                                  |
                                  v
                                Policy
```

Layers are import responsibilities, not top-level folders.

## Structure

```text
app/[page]/
  [page-name].query.ts
  behaviors/[name]/
    [name].service.ts
    [name].action.ts
    use-[name].hook.ts
    [name].query.ts              # Additional/on-demand read only (optional)
    [name].mutation.ts           # Write only (optional)
    tests/
      [name].service.test.ts
      [name].action.test.ts
      use-[name].hook.test.tsx
```

## Contract

```typescript
import "server-only";

import { ItemModel, type ItemRecord } from "@/shared/models/item";
import { ItemPolicy } from "@/shared/policies/item.policy";
import { z } from "zod";

const inputSchema = z.object({ name: z.string().trim().min(1) });

type Actor = { id: string };
export type CreateItemInput = z.input<typeof inputSchema>;
export type CreateItemResult = ItemRecord;

export class CreateItem {
  static async execute(command: {
    actorId: string;
    input: CreateItemInput;
  }): Promise<CreateItemResult> {
    const actor = { id: z.string().min(1).parse(command.actorId) };
    const input = inputSchema.parse(command.input);
    this.authorize(actor, []);

    return ItemModel.create({
      userId: actor.id,
      ...input,
    });
  }

  private static authorize(
    actor: Actor,
    records: readonly ItemRecord[],
  ): void {
    if (!ItemPolicy.create(actor, records)) {
      throw new Error("Unauthorized");
    }
  }
}
```

## Responsibilities

The Service owns:

- Authoritative runtime validation of its command
- Authorization through a private `static authorize(actor, records)` method
- Delegation of authorization decisions to pure Policies
- Business rules and sequencing
- The transaction boundary for atomic multi-operation behavior
- Coordination of Models and Integrations
- The behavior's returned record or serializable result

The Service does not:

- Authenticate a request or read headers/cookies
- Import Actions, Routes, Hooks, React, Jotai, or TanStack Query
- Import Drizzle tables or operators or write database queries
- Put authorization inside a Model
- Return Model instances; Models return plain schema-inferred records

## Authentication and Authorization

The Controller authenticates and passes trusted identity separately from
untrusted browser input. Preserve the behavior's established command shape: use
an `actorId` when identity alone is sufficient, or a small actor value when a
Policy needs trusted role or membership information. The Service constructs the
Policy actor and never accepts identity embedded in `input`.

For record operations:

1. Load the necessary records through a Model.
2. Call the Service's private `authorize(actor, records)`.
3. Delegate the decision to a pure Policy.
4. Perform the mutation through a Model only after authorization succeeds.

Use the behavior's established non-disclosure rule when choosing `Not found`
versus `Forbidden`. A Policy never queries or mutates the database.

## Transactions

The Service decides which operations must be atomic. Infrastructure provides the
transaction and guarded-write mechanisms, and every participating Model method
receives the same transaction executor when a transaction is used. Use a
transaction for multi-record changes and other sequences that must share one
snapshot. A load-authorize-single-mutation sequence may instead use a guarded
Model write that atomically reasserts the policy-relevant state of the authorized
record. A single independent SQL statement does not need a wrapper.

## Verification

Write direct Service tests with the real in-memory SQLite database:

1. Seed `PreDB`.
2. Call `ClassName.execute(command)`.
3. Assert the return or thrown error.
4. Verify `PostDB`.

Cover validation, authorization, soft-deleted records, transaction rollback, and
meaningful business failures at this boundary. Do not mock Models or the database.
This is the direct server-side business-logic test boundary: use
`[name].service.test.ts`, never a parallel `[name].behavior.test.ts`.
The Service test owns validation, authorization, business outcomes, transaction
rollback, and database transitions. Action tests cover authentication/transport;
Hook tests cover cache orchestration, so neither replaces the Service test.

For the complete real-database pattern, read the **Service Tests** section in
`../test/references/unit.md`.

Run:

```bash
bun run test path/to/tests/name.service.test.ts
bun run typecheck
```

The canonical Service, Policy, and Model specification formats live in
`docs/references/specification.md`.
