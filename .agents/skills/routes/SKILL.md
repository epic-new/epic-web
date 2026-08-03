---
name: routes
description: Write thin Next.js Controller routes for behavior Services or authentication-only local-provider operations. Use when creating or updating an HTTP endpoint for streaming, webhooks, HTTP semantics, or external clients.
---

# Routes

Implement a Route only when a behavior needs HTTP semantics, streaming, a webhook,
or access from an external client. Use an Action for ordinary in-app behavior
invocation.

```text
Hook or external client -> Route -> Service -> Model / Integration
                             `-> local auth provider (authentication-only)
```

A behavior may have at most one Action and one Route. They may coexist when they
provide distinct entry-point semantics. A Hook still consumes only one Controller
entry point.

## Controller Contract

Keep every Route in the Controller layer:

1. Authenticate the request, or require the webhook's transport credential.
2. Parse and convert the HTTP transport into the server command input.
3. Normally call exactly one behavior-named Service through its public
   `static execute`. An authentication-only Route may call the narrow local
   `@/lib/auth` provider directly instead of adding an empty Service.
4. Translate known server failures into stable HTTP responses or stream events.
5. Return a stable fallback for unexpected failures without exposing raw errors.

Transport parsing may check JSON shape and primitive types. Do not duplicate
authoritative domain constraints such as minimum lengths, ownership, allowed
status transitions, or uniqueness. The Service, when present, validates those
rules again and remains authoritative.

Never import Models, Drizzle, schema tables, database clients, Policies, or
general Integrations. The direct-provider exception is limited to `@/lib/auth`
for authentication-only operations. Never accept an actor or ownership
identifier supplied by browser input; derive the actor from authentication.

## Location

```text
app/[page]/behaviors/[name]/
  [name].service.ts             # when application behavior requires it
  routes/
    route.ts
  tests/
    [name].route.test.ts
```

The URL follows the folder path:

```text
app/(app)/projects/behaviors/process-data/routes/route.ts
-> POST /projects/behaviors/process-data/routes
```

## Non-Streaming Pattern

Use a transport-only schema and import the command input type from the Service.
Keep the Service's validation authoritative.

```typescript
import { getUser } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  ProcessData,
  type ProcessDataInput,
} from "../process-data.service";

// Shape/type parsing only. ProcessData owns trimming, lengths, and domain rules.
const transportSchema: z.ZodType<ProcessDataInput> = z.object({
  name: z.string(),
});

function translateProcessDataError(error: unknown): NextResponse {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: error.issues[0]?.message ?? "Invalid data",
      },
      { status: 400 },
    );
  }

  // Map this behavior's established Service failures explicitly.
  if (error instanceof Error && error.message === "Data not found") {
    return NextResponse.json(
      { success: false, error: "Data not found" },
      { status: 404 },
    );
  }

  if (
    error instanceof Error &&
    (error.message === "Forbidden" || error.message === "Unauthorized")
  ) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  return NextResponse.json(
    { success: false, error: "Unable to process data" },
    { status: 500 },
  );
}

export async function POST(request: NextRequest) {
  const { user } = await getUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 },
    );
  }

  const transport = transportSchema.safeParse(body);
  if (!transport.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400 },
    );
  }

  try {
    const data = await ProcessData.execute({
      actorId: user.id,
      input: transport.data,
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return translateProcessDataError(error);
  }
}
```

Reuse an established Controller error translator when one exists. Otherwise map
the behavior's known validation, authorization, not-found, and conflict failures
explicitly. Do not return an arbitrary provider, database, or unknown exception
message to the client.

## Streaming Pattern

Authenticate and parse transport before opening the stream. Invoke exactly one
Service inside the stream, translate its known failures into stable events, and
always close the writer.

```typescript
import { getUser } from "@/lib/auth";
import { NextRequest } from "next/server";
import { z } from "zod";

import {
  GenerateContent,
  type GenerateContentInput,
} from "../generate-content.service";

const generateContentTransportSchema: z.ZodType<GenerateContentInput> = z.object({
  prompt: z.string(),
});

function translateGenerateContentError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Invalid generation request";
  }

  if (
    error instanceof Error &&
    (error.message === "Forbidden" || error.message === "Unauthorized")
  ) {
    return "Forbidden";
  }

  return "Unable to generate content";
}

export async function POST(request: NextRequest) {
  const { user } = await getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // This checks transport shape only; GenerateContent validates domain rules.
  const transport = generateContentTransportSchema.safeParse(body);
  if (!transport.success) {
    return new Response("Invalid request", { status: 400 });
  }

  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  const encoder = new TextEncoder();
  const send = (event: string, data: string) =>
    writer.write(
      encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
    );

  void (async () => {
    try {
      for await (const chunk of GenerateContent.execute({
        actorId: user.id,
        input: transport.data,
      })) {
        await send("token", chunk);
      }
      await send("complete", "");
    } catch (error) {
      await send("error", translateGenerateContentError(error));
    } finally {
      await writer.close();
    }
  })();

  return new Response(stream.readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

Extend `translateGenerateContentError` with the behavior's established Service
messages and keep the stable generic fallback for unknown failures.

## Webhooks

Treat a webhook signature or equivalent credential as transport authentication:

- Require the credential at the Route boundary.
- Read the raw body in the format the provider requires.
- Call exactly one Service with the raw transport values.
- Let the Service coordinate the signature-verifying Integration and business
  behavior; the Route never imports the Integration directly.
- Return stable success and failure responses without echoing provider details.

## Specification

Follow the canonical Route format in `docs/references/specification.md`. Include
the Behavior section for both streaming and non-streaming Routes.

```markdown
# Process Data Route

**Method:** POST
**Path:** /projects/behaviors/process-data/routes

## Description

Processes uploaded data and returns the normalized result.

## Behavior

- Implements: Process Data

## Input

- fileId: string - uploaded file identifier

## Returns

- success: boolean
- data: ProcessedResult

## Scenarios

### Process successfully

#### Input
fileId: "file-123"

#### Response
{ success: true, data: { ... } }
```

For streaming Routes, replace `Returns` with `Emitted Events` and `Completion`,
then describe each scenario with `Emit:` steps.

## Verification

Create `tests/[name].route.test.ts` with Vitest:

- Call the real exported Route through its real Service, Policies, Models, and
  in-memory SQLite database. For an authentication-only Route, call the real
  local auth provider through the Route against in-memory SQLite.
- Replace only authentication, unavailable framework transport primitives, and
  external network providers.
- Use `PreDB` and `PostDB` for persistence outcomes.
- Verify unauthenticated requests, malformed transport, success, known Service
  error translation, and a stable unknown-error response.
- For SSE, verify event order, translated error events, and stream closure.
- For webhooks, verify missing/invalid credentials and stable acknowledgement.
- Do not mock the Service, local auth provider, Models, Drizzle, or database.

```bash
bun run test path/to/tests/name.route.test.ts
```

## Checklist

- Authenticate or require the webhook credential.
- Parse transport without duplicating domain rules.
- Normally call exactly one behavior-named Service. Authentication-only Routes
  may call the narrow local `@/lib/auth` provider directly.
- Keep all Infrastructure imports out of the Route.
- Translate every known failure and hide unexpected exception details.
- Close streams on success and failure.
- Include the Route's Behavior in its technical specification.
- Pass the focused real-path Route test.
