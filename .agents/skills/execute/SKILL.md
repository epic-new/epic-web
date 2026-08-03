---
name: execute
description: Execute an issue through the Epic four-layer architecture and verify its scenarios with Vitest.
---

# Execute

Implement one planned issue in dependency order. Load the layer-specific skills
for the parts the issue requires.

## Layers and Skills

| Skill | Responsibility |
|---|---|
| models | Static table persistence and schema-inferred records |
| integrations | External services and complex infrastructure logic |
| services | Validation, Policy-based authorization, business rules, sequencing, and transactions |
| actions | Authentication, transport adaptation, and error translation |
| routes | Streaming, webhooks, and HTTP endpoints |
| hooks | TanStack Query behavior hooks and UI-only Jotai state |
| components | Accessible user presentation |
| test | Model, Policy, Service, Action, hook, route, and component verification with Vitest |

## Execution Order

1. Create or update static Models and their focused in-memory database tests.
2. Create or update Integrations when required.
3. Create the behavior Service, its Policies, and its focused
   `[name].service.test.ts` using PreDB/PostDB. Do not create a server
   `[name].behavior.test.ts`.
4. Create the thin Controller Action or Route and its boundary test.
5. Create UI-only state and query or mutation option factories.
6. Create the public behavior hook.
7. Write the Hook integration test with a fresh QueryClient and in-memory SQLite.
   Use the real Action for Action-backed Hooks; for Route-backed Hooks, replace
   only browser network transport and keep the real HTTP contract in the Route
   test.
8. Create or update components.
9. Write component tests for the relevant functional Act/Check steps.
10. Run the focused tests, then the complete Vitest suite and typecheck.

## Architecture Rules

- Presentation imports Controller entry points but never Services, Policies,
  Models, Drizzle, Integrations, or server-only implementation modules.
- Controller Actions and Routes authenticate, adapt transport, call exactly one
  Service, and never access Infrastructure directly.
- A Service uses the behavior-named class in `.service.ts` and keeps one public
  `static execute`.
- Services own authoritative validation, authorization, business rules,
  sequencing, and transaction boundaries. They call Models and Integrations but
  never write Drizzle queries.
- Authorized Services call a private `static authorize(actor, records)` that
  delegates to a pure Policy.
- Static Models in `shared/models` own Drizzle queries and return plain
  schema-inferred records. Models never authenticate or authorize.
- Infrastructure imports Drizzle and external APIs, never Controllers, Services,
  Hooks, or Components.
- TanStack Query owns server state.
- Jotai owns UI state only.
- The initial page read and page-wide keys use `[page-name].query.ts`; additional
  or on-demand reads may use a behavior `[name].query.ts` that imports the page
  keys.
- For authenticated user-owned data, every page-wide key includes the actor/user identity for cache partitioning; server actions still derive identity from authentication and enforce authorization.
- Writes use a `[name].mutation.ts` module.
- The Service class is `[name].service.ts`.
- An HTTP Route lives at `behaviors/[name]/routes/route.ts`.
- The public hook entry point is `use-[name].hook.ts`.
- A page that renders a read prefetches the query and hydrates its client
  page-content component.

## Action and Route Verification

Write tests immediately after the server boundary is created.

- Call the real Action or Route through its real Service and Models.
- Use the in-memory SQLite database.
- Translate specification PreDB/PostDB tables directly.
- Verify success, validation, authorization, and meaningful failures.
- Replace only unavailable framework primitives such as `headers()`,
  `redirect()`, or external network services.

Run:

```bash
bun run test path/to/action.test.ts
```

## Hook Verification

Hook tests are integration tests for frontend orchestration.

- Use `// @vitest-environment jsdom`.
- Create a fresh QueryClient with retries disabled.
- Seed query cache pre-state when specified.
- Call the real Action for Action-backed Hooks. For Route-backed Hooks, replace
  only browser network transport; the separate Route test exercises the real
  Route -> Service -> Model path.
- Wrap direct mutation calls in async `act()`.
- Verify optimistic state, final cache state, rollback, and PostDB.
- Use `waitFor()` for eventual query or mutation state.

Run:

```bash
bun run test path/to/tests/use-name.hook.test.tsx
```

## Component Verification

Use Testing Library to map user-facing Act/Check steps to the presentation layer.

- Prefer role, label, and visible-text queries.
- Replace the behavior hook with its public contract when isolating presentation.
- Verify entered data, submission, loading, errors, and rendered outcomes.
- Do not repeat database assertions already owned by action/hook tests.

Run:

```bash
bun run test path/to/component.test.tsx
```

## Scenario Traceability

Every functional behavior scenario must map to one or more technical scenarios:

```text
Functional scenario
  ├─ service scenario: business, authorization, and database outcome
  ├─ action/route scenario: authentication and transport outcome
  ├─ hook scenario: orchestration and cache outcome
  └─ component scenario: user interaction and presentation outcome
```

Vitest owns automated coverage. After execution, the separate Epic `verify` phase
may still exercise the functional scenarios in a real browser; it is acceptance
verification, not a second automated test suite.

## Final Verification

Run the automated Vitest suite and quality checks once as a final batch:

```bash
bun run test
bun run typecheck
bun run lint
```

Fix failures at the owning layer and rerun the focused test before the final
batch.

## Preview and Dev Server

- Vitest is the automated test runner. Do not create or start a separate spec,
  Playwright, or verify server during execution.
- Browser acceptance belongs to the separate **verify** phase, which uses the
  preview URL supplied by the Epic CLI.
- In a remote sandbox, the preview is supervisor-managed. If it briefly stops
  responding, wait and retry; never start or kill a second development server.
- Locally, `epic preview start <issue>` is the CLI entry point for the per-issue
  development server. Starting that preview is outside the execute phase.
- Preserve a remote preview's public HTTPS URL. Do not replace it with plain-HTTP
  localhost, because secure authentication cookies will not work there.

## Phase Discipline

- Use the focused Vitest command for the layer currently being implemented. Fix
  failures at that owning layer and rerun that focused test before proceeding.
- Run the complete Vitest suite, typecheck, and lint once as the final batch. Do
  not rerun a completed command merely to reread its output.
- Do not run builds unless the user explicitly requests one.
- Do not manage the development server; the sandbox supervisor or Epic CLI owns
  the preview lifecycle.
- Do not run git commands; the Epic CLI harness owns repository workflow.
