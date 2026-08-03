---
name: integrations
description: Write Infrastructure adapters for external APIs, SDKs, email, payments, storage, AI, and other third-party systems. Use when isolating provider protocols, retries, configuration, response normalization, or external failures behind a Service-only contract.
---

# Integrations

Keep third-party communication in Infrastructure. Let a Service call an
Integration; never import an Integration from Presentation or a Controller.

```text
Controller -> Service -> Integration -> External system
```

An Integration owns provider SDK and protocol mechanics, configuration, response
decoding, safe retries, and stable external failure normalization. It does not
authenticate application users, authorize actors, query Models, sequence a use
case, or encode product business rules.

## Location

Use the canonical flat file layout:

```text
shared/integrations/
  example.ts
  tests/
    example.test.ts
```

Keep provider-specific public types in the same file by default. Extract a helper
only when it is independently reusable; do not create a directory and barrel for
each Integration.

## Contract

- Include `import "server-only"`.
- Expose serializable, application-facing inputs and results.
- Accept provider-specific values only inside the adapter.
- Normalize provider payloads before returning them.
- Throw stable Integration errors for external failures; never return raw response
  bodies, SDK errors, stack traces, or secrets.
- Retry only transient, safely repeatable operations. Respect provider retry and
  rate-limit metadata.
- Allow the external client boundary to be replaced in focused tests.
- Never import Actions, Routes, Services, Hooks, Components, Policies, Models,
  Drizzle, or schema tables.

## Implementation Pattern

```typescript
import "server-only";

import { z } from "zod";

export type ExampleIntegrationErrorCode =
  | "provider_not_configured"
  | "provider_rejected_request"
  | "provider_rate_limited"
  | "provider_unavailable"
  | "provider_invalid_response";

export class ExampleIntegrationError extends Error {
  constructor(
    public readonly code: ExampleIntegrationErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "ExampleIntegrationError";
  }
}

export interface CompleteInput {
  prompt: string;
}

export interface CompleteResult {
  id: string;
  text: string;
}

const providerResponseSchema = z.object({
  id: z.string(),
  output: z.string(),
});

export class ExampleIntegration {
  constructor(private readonly request: typeof fetch = fetch) {}

  async complete(input: CompleteInput): Promise<CompleteResult> {
    const apiKey = process.env.EXAMPLE_API_KEY;
    if (!apiKey) {
      throw new ExampleIntegrationError(
        "provider_not_configured",
        "Example provider is not configured",
      );
    }

    let response: Response;
    try {
      response = await this.request("https://api.example.com/complete", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
    } catch (cause) {
      throw new ExampleIntegrationError(
        "provider_unavailable",
        "Example provider is unavailable",
        { cause },
      );
    }

    if (response.status === 429) {
      throw new ExampleIntegrationError(
        "provider_rate_limited",
        "Example provider rate limit exceeded",
      );
    }

    if (response.status >= 500) {
      throw new ExampleIntegrationError(
        "provider_unavailable",
        "Example provider is unavailable",
      );
    }

    if (!response.ok) {
      throw new ExampleIntegrationError(
        "provider_rejected_request",
        "Example provider rejected the request",
      );
    }

    try {
      const providerResult = providerResponseSchema.parse(await response.json());
      return { id: providerResult.id, text: providerResult.output };
    } catch (cause) {
      throw new ExampleIntegrationError(
        "provider_invalid_response",
        "Example provider returned an invalid response",
        { cause },
      );
    }
  }
}

export const exampleIntegration = new ExampleIntegration();
```

Prefer stable codes plus safe messages when callers need to distinguish failure
classes. Preserve the original exception as `cause` for diagnostics, but do not
expose it through a Controller response. If logging is required, log safe metadata
through the project's logger; never log credentials, authorization headers, raw
webhook bodies, or complete provider responses.

## Retry Rules

- Retry network failures, rate limits, and selected 5xx responses only when the
  operation is idempotent or carries a provider idempotency key.
- Do not retry validation, authentication, permission, or other permanent 4xx
  failures.
- Bound attempts and delays; honor `Retry-After` when available.
- After retries are exhausted, throw the same stable normalized error contract.
- Keep workflow-level retries out of the Integration when a durable Workflow owns
  that policy.

## Specification

Read `references/specification.md`, which points to the canonical Integration and
Service formats. Describe normalized serializable results and stable external
failure behavior.

```markdown
# ExampleIntegration

Provides the Infrastructure adapter for the configured example provider.

## Methods
- complete(input: CompleteInput): Promise<CompleteResult>

## Scenarios

### Scenario: Complete successfully

#### Steps
* Call: ExampleIntegration.complete({ prompt: "Hello" })
* Returns: { id: "result-1", text: "Hello there" }

### Scenario: Normalize a provider outage

#### Steps
* Call: ExampleIntegration.complete({ prompt: "Hello" })
* Throws: ExampleIntegrationError with code "provider_unavailable" and message
  "Example provider is unavailable"
```

## Verification

Create `shared/integrations/tests/[name].test.ts` with focused Vitest tests. Replace
only the external `fetch`/SDK boundary; exercise the real Integration code.

Verify:

- Successful provider payloads become the declared serializable result.
- Network failures, rate limits, 5xx responses, permanent 4xx responses, and
  invalid payloads become their documented stable error codes and messages.
- Raw provider bodies, SDK messages, and secrets never appear in thrown public
  errors.
- Retry counts and delays follow the documented safe retry policy.
- Required configuration produces a stable configuration error.

Do not use SQLite for a focused Integration test because the Integration must not
access persistence. Service tests that coordinate an Integration and Models keep
the real SQLite path and replace only the external provider boundary.

```bash
bun run test shared/integrations/tests/name.test.ts
```

## Checklist

- Keep the Integration in `shared/integrations/[name].ts`.
- Permit only Services to consume it.
- Keep authentication, authorization, persistence, and use-case sequencing out.
- Return normalized serializable success values.
- Throw stable normalized failures without raw provider details.
- Retry only safe transient operations.
- Pass focused external-boundary tests.
