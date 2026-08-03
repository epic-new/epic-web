---
name: actions
description: Write thin Next.js Controller actions that normally call one behavior Service, or authentication-only actions that directly use the narrow @/lib/auth API.
---

# Actions

Actions implement the Controller layer. They do not own authorization, business
rules, database queries, or external integration calls; the Service owns the
use-case behavior and delegates external effects to Infrastructure. A pure
sign-in, sign-up, sign-out, or session-establishment Action may instead use the
narrow `@/lib/auth` API directly without a pass-through Service.

```text
Hook -> Action -> Service -> Model / Integration
               `-> @/lib/auth (authentication-only exception)
```

## Location

```text
app/[page]/behaviors/[name]/
  [name].service.ts              # Required for application behavior; omit for auth-only
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
- Call exactly one Service class when application behavior is involved.
- For authentication-only behaviors, call only the narrow `@/lib/auth` API and
  omit a pass-through Service.
- Pass authenticated identity separately from browser input.
- Translate validation/domain errors to the action's established response shape.
- Preserve redirects when navigation is part of the action contract.

Do not:

- Import Drizzle, `db`, or schema tables.
- Encode resource permissions, ownership, or domain rules.
- Export a class from a `"use server"` module; Next requires action exports to be
  async functions.
- Call Models, Drizzle, schema tables, Policies, or general Integrations directly.
- Call multiple Services to orchestrate a workflow. Put that sequencing in one
  Service.

## Authentication-only exception

Use the direct `@/lib/auth` path only when the Action's complete responsibility is
sign-in, sign-up, sign-out, or session establishment. This is a narrow Controller
exception, not permission to call an auth provider SDK or another Integration
directly.

Add a Service as soon as the flow includes application-specific business rules,
authorization over records, Model access, or a general Integration. For example,
sign-up may call `@/lib/auth` directly while it only creates authentication
credentials; sign-up that also provisions a workspace delegates that behavior to
one Service.

## Verification

Action tests live at `tests/[name].action.test.ts`. Verify authentication,
transport conversion, and response/error translation. When a Service exists,
call the real Service and use in-memory SQLite rather than mocking it. Detailed
ownership and database rules belong primarily to `[name].service.test.ts`.

For an authentication-only Action, exercise the real Action -> auth provider ->
in-memory SQLite path when the provider can run locally. Action-backed Hook tests
may exercise that same real path. Do not create a Service solely to satisfy the
usual Action shape, and do not mock the local auth provider when the in-memory
database makes the test deterministic.

Run:

```bash
bun run test path/to/tests/name.action.test.ts
```
