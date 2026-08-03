---
name: test
description: Write Vitest tests for behavior scenarios at the Model, Policy, Service, Action, Hook, Route, and Component boundaries. Use when creating tests from PreDB/Steps/PostDB or Act:/Check specifications.
---

# Test

## Overview

Verify every functional behavior scenario through the technical units that implement
it. Vitest is the only automated test runner. There is no separate browser or E2E
suite.

Tests use real code and the in-memory SQLite database wherever persistence is part
of the behavior. Mock only framework boundaries, external services, or a
component's behavior-hook contract.

## Choose the Test Boundary

| Boundary | File | Verifies |
|---|---|---|
| Model | `shared/models/tests/[name].test.ts` | Table queries and persistence against real SQLite |
| Policy | `[name].policy.test.ts` | Pure actor/record authorization decisions |
| Service | `[name].service.test.ts` | Validation, authorization, business rules, transactions, and PreDB/PostDB transitions |
| Action | `[name].action.test.ts` | Authentication, transport adaptation, and error translation through the real Service/Model path, or through the real local auth provider for authentication-only flows |
| Route | `[name].route.test.ts` | HTTP authentication/signature handling, request/response semantics, and the real Service/Model path, or through the real local auth provider for authentication-only flows |
| Behavior hook | `use-[name].hook.test.tsx` | TanStack Query state and optimistic transitions; real Action path for Action-backed hooks, browser transport replacement for Route-backed hooks |
| Component | `[Name].test.tsx` | User inputs, accessible output, loading/error presentation, and calls into the behavior hook |

Read:

- `references/unit.md` for Model, Service, Action, Route, and Hook database tests.
- `references/functional-scenario-mapping.md` for mapping functional Act/Check scenarios across
  Service, Action, Hook, and Component tests.

## Shared Principles

- Keep one `it()` test per technical scenario.
- Use the functional scenario title, or a clearly traceable derivative, in the
  test name.
- Use `PreDB` and `PostDB` when database state is observable.
- Model, Service, Action, and Route tests use real code and in-memory SQLite.
  Action-backed Hook tests do the same through the real Action -> Service ->
  Model path. Authentication-only flows instead use the real Action -> local
  auth provider -> in-memory SQLite path and do not add an empty Service.
- A Route-backed Hook test may replace only browser network transport; verify the
  real Route -> Service -> Model path separately in its Route test.
- Do not mock Models, Services, Actions, or Drizzle inside their real integration paths.
- Give every hook test a fresh `QueryClient` with retries disabled.
- Include actor identity in every authenticated user-owned query key.
- Start an intentionally paused mutation inside synchronous `act()` so its
  pending state can be inspected; resolve and await settlement inside async
  `act()`. Use `waitFor()` for eventual query or mutation state.
- Component tests may replace the hook because the hook/database contract is
  verified separately.
- Do not assert private calls or internal implementation details.
- Start with the happy path, then add meaningful error and rollback scenarios.
- Do not create `[name].behavior.test.ts`: when a Service exists, the former
  server Behavior is now the Service and is verified by
  `[name].service.test.ts`. Authentication-only flows omit both the Service and
  its test.

## Workflow

1. Read the functional and technical scenarios.
2. Map each functional Check to an observable action, hook, or component outcome.
3. Write the smallest set of tests that covers every scenario without repeating
   the same assertion at every layer.
4. Run the focused file:

   ```bash
   bun run test path/to/name.test.ts
   ```

5. Run all tests after the behavior is complete:

   ```bash
   bun run test
   ```
