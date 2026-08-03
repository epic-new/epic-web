---
name: actions
description: Write thin Next.js Controller actions for behavior Services. Use when creating or updating an action that authenticates a request, converts transport input, calls one Service, and translates its result or errors.
---

# Actions

Actions implement the Controller layer. They do not own authorization, business
rules, database queries, or external integration calls; the Service owns the
use-case behavior and delegates external effects to Infrastructure.

```text
Hook -> Action -> Service -> Model / Integration
```

## Location

```text
app/[page]/behaviors/[name]/
  [name].service.ts
  [name].action.ts
  use-[name].hook.ts
  tests/[name].action.test.ts
```

## Pattern

```typescript
"use server";

import { getUser } from "@/lib/auth";
import type { ActionResponse } from "@/shared/actions/action-response";
import { z } from "zod";
import {
  CreateItem,
  type CreateItemInput,
  type CreateItemResult,
} from "./create-item.service";

export type { CreateItemInput, CreateItemResult } from "./create-item.service";

export async function createItem(
  input: CreateItemInput,
): Promise<ActionResponse<CreateItemResult>> {
  try {
    const { user } = await getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    return {
      success: true,
      data: await CreateItem.execute({ actorId: user.id, input }),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError
        ? (error.issues[0]?.message ?? "Invalid item")
        : error instanceof Error
          ? error.message
          : "Unable to create item",
    };
  }
}
```

## Responsibilities

- Include `"use server"`.
- Read authentication and request-only primitives such as headers.
- Convert transport values such as `FormData` to plain command input.
- Call exactly one Service class.
- Pass authenticated identity separately from browser input.
- Translate validation/domain errors to the action's established response shape.
- Preserve redirects when navigation is part of the action contract.

Do not:

- Import Drizzle, `db`, or schema tables.
- Encode resource permissions, ownership, or domain rules.
- Export a class from a `"use server"` module; Next requires action exports to be
  async functions.
- Call Models, Drizzle, schema tables, Policies, or Integrations directly.
- Call multiple Services to orchestrate a workflow. Put that sequencing in one
  Service.

## Verification

Action tests live at `tests/[name].action.test.ts`. Verify authentication,
transport conversion, and response/error translation. Call the real Service and
use in-memory SQLite rather than mocking it. Detailed ownership and database rules
belong primarily to `[name].service.test.ts`.

Run:

```bash
bun run test path/to/tests/name.action.test.ts
```
