---
name: issues
description: Create or update project issues using functional Behavior Rules and Scenarios plus four-layer technical specifications for Models, Policies, Services, Controllers, Hooks, and Components.
---

# Issues

Issues connect observable product behavior to the technical units that implement
and verify it. Read the canonical formats before writing:

- `docs/references/specification.md`
- `docs/templates/issue.md`

Do not invent a competing issue format inside this skill.

## Architecture Vocabulary

```text
Presentation -> Controller -> Service -> Infrastructure
```

- **Behavior** is the functional vertical slice under
  `app/[page]/behaviors/[name]/`.
- **Presentation** contains Components, Hooks, queries, mutations, cache state,
  and UI-only Jotai state.
- **Controller** contains Actions, Routes, and workflow entry points.
- **Service**, when application behavior requires one, is the behavior-named
  server class in `[name].service.ts`, with one public `static execute`.
- **Policy** is a pure Service-layer authorization decision over an actor and
  records.
- **Model** is a static Infrastructure class in `shared/models` that owns Drizzle
  and returns plain schema-inferred records.
- **Integration** is an Infrastructure adapter called by Services.
- An authentication-only Controller may call the narrow local `@/lib/auth`
  provider directly instead of adding a pass-through Service.

## Workflow

### 1. Inspect Current State

Before writing or changing an issue:

1. Read the issue content from the exact session buffer named by the invoking
   CLI phase, or inspect it with `epic issue show <id> -b` when no phase is active.
2. Inspect only the page, behavior, schema, shared Model/Policy, and tests that the
   issue touches.
3. Record what already exists and write changes rather than duplicating units.
4. Follow current naming and public contracts unless the issue explicitly changes
   them.

### 2. Write the Functional Specification

Define exactly one user-facing Behavior per issue with:

- A concise description and behavior directory.
- Named Rules using When/Then.
- Named Scenarios using optional PreDB, required Act/Check Steps, and optional
  PostDB.

Scenarios describe observable outcomes, not implementation details. Use
`Scenarios`, never `Examples`, as the section name.

### 3. Write the Technical Specification

Include only units required by the Behavior:

- **Model** scenarios for table-level persistence.
- **Policy** scenarios for pure authorization decisions.
- **Service** scenarios, when a Service is required, for validation,
  authorization, business rules, transactions, and database outcomes through
  real Models.
- **Action/Route** scenarios for authentication, transport, and error mapping.
- **Query/Mutation** contract for TanStack Query keys and cache transitions.
- **Hook** scenarios with explicit cache PreState/Steps/PostState and PostDB when
  persistence changes.
- **Component** scenarios for user interaction and visible results.
- **Integration** scenarios for external-system mechanics and normalized failures.

Technical scenarios belong under their owning unit. Do not place unattached
technical scenarios at the top level.

### 4. Preserve the Behavior Organization

```text
app/[page]/behaviors/[name]/
  [name].service.ts            # when application behavior requires it
  [name].action.ts
  use-[name].hook.ts
  [name].query.ts              # optional read
  [name].mutation.ts           # optional write
  tests/
    [name].service.test.ts     # when a Service exists
    [name].action.test.ts
    use-[name].hook.test.tsx
```

Do not propose top-level layer directories. Models remain globally shared under
`shared/models`; Policies follow behavior, page, or global sharing scope.

### 5. Write Tasks in Dependency Order

1. Model and Integration Infrastructure.
2. Policy and Service, when application rules or record authorization require
   them. Authentication-only flows omit this step.
3. Controller Action or Route.
4. Query/mutation and public Hook.
5. Components.
6. Focused tests, full Vitest suite, and typecheck.

Tests use real in-memory SQLite through Models, Services, Actions, and Hooks. An
authentication-only flow uses the real Action -> local auth provider ->
in-memory SQLite path. Mock only authentication/framework primitives, external
networks, or a Hook contract inside an isolated Component test.

## File Handling

Issue content lives in the Epic database. When an invoking CLI phase names an
absolute issue buffer, read and edit that exact file in place. The buffer is
ephemeral pure Markdown (normally `.epic/sessions/<ID>/issue.md`), has no YAML
lifecycle front matter, and is PATCHed back to the database and discarded by the
CLI. Never create or write to `.epic/issues/`; that directory is not the source of
truth.

When no buffer is named:

- For an existing issue, inspect it with `epic issue show <id> -b`, then run the
  appropriate authoring phase such as `epic issue interview <id>` or
  `epic issue plan <id>` so the CLI can establish a buffer.
- For a new issue, run `epic issue new "<title>"`; the command creates the DB record
  and hands the authoring workflow a buffer.

Do not invent a path. There are no `pull`, `push`, or `sync` commands for issue
content.

## Validation Checklist

- [ ] Functional Behavior has named Rules and Scenarios.
- [ ] The issue contains exactly one Behavior.
- [ ] Every Scenario has Act/Check Steps and relevant PreDB/PostDB.
- [ ] Every required Model, Policy, Service, Controller, Hook, and Component
      scenario has a clear owner.
- [ ] When required, the Service file is `[name].service.ts`; its class remains
      behavior-named with `static execute`.
- [ ] Controllers authenticate and normally call one Service, never a Model. An
      authentication-only Controller may call only the narrow local `@/lib/auth`
      provider and omit the Service.
- [ ] Services authorize and call Models; Models alone own Drizzle queries.
- [ ] Hook cache keys include actor identity for user-owned data.
- [ ] Test tasks preserve the real in-memory database path.

## References

- `references/issue-template.md` points to the canonical issue template.
- `references/specification.md` points to the canonical specification.
- `references/implement-issue.md` is a worked implementation example.
- `references/change-issue.md` covers a change to existing behavior.
