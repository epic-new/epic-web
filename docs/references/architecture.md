# Four-Layer Behavior-Oriented Architecture Reference

> A unidirectional architecture that separates presentation, transport control,
> business services, and infrastructure while keeping each user behavior
> colocated as a vertical slice.

## Architecture Overview

```
+-------------------------------------+
|        PRESENTATION LAYER           |
| Components + Hooks + Query State    |
+-------------------------------------+
              |
              v
+-------------------------------------+
|         CONTROLLER LAYER            |
| Actions + Routes + Workflow Inputs  |
+-------------------------------------+
              |
              v
+-------------------------------------+
|           SERVICE LAYER             |
| Services + Policies + Transactions  |
+-------------------------------------+
              |
              v
+-------------------------------------+
|      INFRASTRUCTURE LAYER           |
| Models + Database + Integrations    |
+-------------------------------------+
```

**Critical rule**: production dependencies flow downward one layer at a time.
Presentation cannot skip Controller, and Controllers normally delegate behavior
to a Service before Infrastructure is accessed. The only exception is an
authentication-only Controller, which may call the narrow `@/lib/auth` API
directly for sign-in, sign-up, sign-out, or session establishment. This exception
does not permit direct access to Models, Drizzle, schema tables, Policies, or
general Integrations.

Layers describe responsibilities and import boundaries, not top-level folders.
Feature files remain colocated in `app/[page]/behaviors/[name]/`.

**Behaviors** (user-triggered) and **Automations** (system-triggered) are the
functional units that span layers. A Behavior is triggered by a user action. An
Automation is triggered by a schedule or internal event and has no Presentation
layer.

---

## Layer Responsibilities

### Presentation Layer

| Component | Responsibility |
|-----------|----------------|
| **Components** | Render UI, collect user input, consume hooks |
| **Hooks** | Perform optional UX validation, read/write server state via TanStack Query (`useQuery`/`useMutation`), manage UI state (Jotai), optimistic updates, and call Controller entry points |
| **Queries** | `[page-name].query.ts` owns the initial page query and page-wide keys; additional/on-demand reads may use behavior `[name].query.ts` files |
| **States** | Jotai atoms for **UI state only** (dialogs, selections, filter/sort/page inputs) |

**Server state vs UI state**: All server state (lists, records, their loading/error/cache) lives in the **TanStack Query** cache. **Jotai is retained for pure UI state** — never for server data. Filter/sort/pagination atoms are UI state that feed query keys.

**May import**: React, Zod, Jotai, TanStack Query, Actions and other Controller entry points

**Must NOT import**: Services, Policies, Models, database clients, Drizzle,
Integrations, or other server-only implementation code

---

### Controller Layer

| Component | Responsibility |
|-----------|----------------|
| **Actions** | Thin Server Action controllers for authentication, transport conversion, calling one Service when application behavior is involved, and error translation |
| **Routes** | HTTP controllers for streaming, webhooks, HTTP semantics, or external clients |
| **Workflow entry points** | Durable invocation and checkpoint coordination; side-effecting steps delegate to Services |

**May import**: Services, the narrow `@/lib/auth` API, framework request/response
APIs

**Must NOT import**: Models, Drizzle, schema tables, database clients,
Policies, general Integrations, React, `window`, or Jotai atoms

Actions and Routes implement the Controller role without requiring controller
classes or a controller directory. Each entry point normally calls exactly one
Service and never accesses Infrastructure directly.

Authentication belongs here. Controllers derive the actor from the request; they
never accept an actor or ownership identifier supplied by browser input.

An authentication-only Controller may call `@/lib/auth` directly and omit a
pass-through Service when its entire purpose is sign-in, sign-up, sign-out, or
session establishment. This narrow auth API is a Controller-owned boundary, not
permission to call arbitrary provider SDKs or other Infrastructure modules.

If the flow introduces application-specific business rules, authorization over
records, Model access, or a general Integration—for example, provisioning a
workspace during sign-up—the Controller delegates that behavior to one Service.

Schema-inferred records may be returned through a Service and Controller as plain,
serializable values. Presentation imports the public result type from the Action
contract (for example `ItemRecord` as exposed by `listItems`), not directly from a
Model. Likewise, Service command types originate at the Service boundary and are
exposed through the Controller; Services never import input types from
Presentation modules.

---

### Service Layer

| Component | Responsibility |
|-----------|----------------|
| **Service classes** | One stateless class per behavior that contains application logic; authoritative validation, authorization, business rules, sequencing, and transaction boundaries |
| **Policies** | Pure authorization decisions over an actor and the records involved in the behavior |

When a behavior requires application logic, the existing server Behavior class
becomes a Service by renaming `[name].behavior.ts` to `[name].service.ts`. It
remains in the behavior directory, keeps the behavior-named class (for example
`CreateItem`), and keeps one public `static execute` method. This is a rename and
responsibility split, not an additional abstraction or a `CreateItemService`
wrapper. Authentication-only Controllers do not add an empty Service module.

Every Service that requires authorization calls a private `static authorize(actor,
records)` from inside `execute`; that method delegates the decision to a Policy.
Policies do not authenticate, query, mutate, or start transactions.

Services decide the atomicity strategy. Infrastructure provides transactions
and guarded writes, and Models accept a transaction executor when several reads
or writes must stay in one scope. For a single mutation after authorization, a
Model may instead make the write conditional on the policy-relevant state of the
record that was authorized. Multi-record changes use a transaction.

**May import**: Models, Integrations, Policies, validation libraries, transaction
facilities

**Must NOT import**: React, Hooks, Actions, Routes, Next request/response APIs,
Jotai, or TanStack Query

---

### Infrastructure Layer (Server)

The Infrastructure layer handles all communication with the external world: databases, third-party APIs, file systems, and external services.

| Component | Responsibility |
|-----------|----------------|
| **Models** | Static, table-oriented persistence APIs that own Drizzle queries and return schema-inferred plain records |
| **Database** | Drizzle client, schema definitions, migrations, and transaction implementation |
| **Integrations** | External API clients (email, payments, storage, etc.) |

**May import**: Drizzle/SQL client, external APIs, SDKs

**Must NOT import**: Presentation, Controllers, Services, or Policies

Models live in `shared/models/`, use static methods, and return schema-inferred
plain records such as `UserRecord = typeof user.$inferSelect`. Models do not receive an actor, make
authorization decisions, encode use-case sequencing, or return class instances.

---

## One-Way Data Flow

- **Infrastructure** never calls **Service**, **Controller**, or **Presentation**
- **Service** never calls **Controller** or **Presentation**
- **Controller** never calls **Presentation**
- **Presentation** Components never contain server code or manage atoms directly
- **Presentation** Hooks never touch the database directly
- **Controller** entry points never import Models, Drizzle, Policies, or general
  Integrations

```text
Component -> Hook -> Action/Route -> Service.execute
                                         |---> Policy
                                         |---> Model ------> Database
                                         `---> Integration -> External system

Component -> Hook -> Action/Route -> @/lib/auth
                                      (authentication-only exception)
```

---

## Behavior Entry Points

A behavior may have at most one Action, one Route, and one Workflow. Each serves a distinct purpose and they can coexist within the same behavior.

| Aspect | Action | Route | Workflow |
|--------|--------|-------|----------|
| Protocol | Server Action (direct import) | HTTP endpoint (fetch-based) | Durable background job |
| Invocation | `await action(input)` | `fetch()` or `fetchEventSource()` | `await workflow.start(input)` |
| Streaming | No | Optional (SSE supported) | No |
| Long-running | No | No | Yes |
| Retries | Manual | Manual | Automatic |
| File | `[name].action.ts` | `route.ts` | `[name].workflow.ts` |
| Location | `behaviors/[name]/` | `behaviors/[name]/routes/` | `behaviors/[name]/workflows/` |

### When to Use Each

**Action** (default):
- Most behaviors
- Direct function call semantics
- Simpler mental model

**Route**:
- Streaming/SSE required
- Webhooks (external integrations like Stripe)
- Need HTTP semantics (headers, status codes)
- External client access needed

**Workflow**:
- Long-running background processing
- Automatic retries and checkpointing required
- Multi-step orchestration with durable state

### Hook Consumption

**Non-streaming route:**
```typescript
const response = await fetch(`/${page}/behaviors/${behavior}/routes`, {
  method: 'POST',
  body: JSON.stringify(input),
});
const data = await response.json();
```

**Streaming route:**
```typescript
fetchEventSource(`/${page}/behaviors/${behavior}/routes`, {
  method: 'POST',
  body: JSON.stringify(input),
  signal: abortController.signal,
  onmessage(event) {
    // React to route-specific events
  },
});
```

---

## Server State (TanStack Query)

Server state is owned by the TanStack Query cache. Actions are the `queryFn`/`mutationFn` (Action-first); Routes are only for streaming/webhooks. The root layout wraps the app in `QueryClientProvider` using a `getQueryClient()` helper — a fresh `QueryClient` per request on the server, a singleton on the client — with a default `staleTime > 0`.

### The `[page-name].query.ts` convention

Each page owns one page-wide key factory and its initial query-options factory in `[page-name].query.ts` (for example, `items.query.ts`), so server prefetch, client hooks, and mutations agree on keys and functions. Additional or on-demand read behaviors may keep a `[name].query.ts` beside the behavior, but import their keys from `[page-name].query.ts`.

For authenticated user-owned data, every page-wide key MUST include the actor/user identity. The identity partitions client cache entries only; actions still derive identity from authentication and enforce authorization on the server.

```typescript
// app/items/items.query.ts
import { queryOptions } from '@tanstack/react-query';
import { listItems } from './behaviors/list-items/list-items.action';

export const itemsKeys = {
  all: (actorId: string) => ['items', actorId] as const,
  lists: (actorId: string) => [...itemsKeys.all(actorId), 'list'] as const,
  list: (actorId: string, params: ListParams) => [...itemsKeys.lists(actorId), params] as const,
  details: (actorId: string) => [...itemsKeys.all(actorId), 'detail'] as const,
  detail: (actorId: string, id: string) => [...itemsKeys.details(actorId), id] as const,
};

export function listItemsQuery(actorId: string, params: ListParams) {
  return queryOptions({
    queryKey: itemsKeys.list(actorId, params),
    queryFn: async () => {
      const response = await listItems(params);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
}
```

```typescript
// app/items/behaviors/view-item/view-item.query.ts
import { queryOptions } from '@tanstack/react-query';
import { itemsKeys } from '../../items.query';
import { viewItem } from './view-item.action';

export function viewItemQuery(actorId: string, id: string) {
  return queryOptions({
    queryKey: itemsKeys.detail(actorId, id),
    queryFn: async () => {
      const response = await viewItem(id);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
  });
}
```

### Reads — server prefetch + hydrate

The page is a Server Component that prefetches and hands the dehydrated cache to a client child. **Treat Server Components as prefetch-only** — no `fetchQuery` rendered server-side.

```tsx
// page.tsx (Server Component)
const queryClient = getQueryClient();
await queryClient.prefetchQuery(listItemsQuery(actorId, defaultParams));
return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <PageContent actorId={actorId} />   {/* client calls useQuery(listItemsQuery(actorId, params)) */}
  </HydrationBoundary>
);
```

The prefetched actor identity and default params must match the client's first render so the query key — and thus hydration — matches. Filter/sort/page atoms are UI state that feed the key.

A Server Component may read the authenticated session to redirect unauthenticated
users and to partition or prefetch the initial cache. That is a Presentation
concern, not authorization. The Action or Route authenticates independently and
the Service still authorizes the behavior; prefetched identity is never trusted
as proof of permission.

### Mutations — optimistic by default

Write options live in `[name].mutation.ts`, separate from the public Hook. The
module snapshots and applies pending state in `onMutate`, replaces temporary data
with the authoritative Action result in `onSuccess`, rolls back in `onError`, and
invalidates in `onSettled`. The Hook only consumes those options and exposes its
`{ handleX, isLoading, error }` contract.

```typescript
// create-item.mutation.ts
export function createItemMutation(queryClient: QueryClient, actorId: string) {
  return mutationOptions({
    mutationFn: async (input: CreateItemInput) => {
      const response = await createItem(input);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: itemsKeys.lists(actorId) });
      const previous = queryClient.getQueriesData({
        queryKey: itemsKeys.lists(actorId),
      });
      const temporaryId = `temp-${Date.now()}`;
      queryClient.setQueriesData(
        { queryKey: itemsKeys.lists(actorId) },
        (old) => addPendingItem(old, input, temporaryId),
      );
      return { previous, temporaryId };
    },
    onSuccess: (created, _input, context) =>
      queryClient.setQueriesData(
        { queryKey: itemsKeys.lists(actorId) },
        (old) => replaceItem(old, context?.temporaryId, created),
      ),
    onError: (_error, _input, context) =>
      context?.previous.forEach(([key, data]) =>
        queryClient.setQueryData(key, data),
      ),
    onSettled: () => queryClient.invalidateQueries({
      queryKey: itemsKeys.all(actorId),
    }),
  });
}

// use-create-item.hook.ts
const mutation = useMutation(createItemMutation(useQueryClient(), actorId));
```

Mutations with no list representation (e.g. set-password, redirect-on-success actions) are plain mutations without `onMutate`.

---

## Thin Presentation, Explicit Server Boundaries

The Presentation layer coordinates no business workflow. It triggers intent and
reacts to outcomes.

### Client Constraints

- No hook may call more than one Controller entry point
- No component may call Controller code directly
- No Presentation code may encode business rules
- No orchestration, sequencing, or workflow logic

### Controller Constraints

- Owns authentication and request-derived actor construction
- Owns transport conversion and response/error translation
- Calls exactly one Service when application behavior is involved
- May omit a pass-through Service only for sign-in, sign-up, sign-out, or session
  establishment that uses the narrow `@/lib/auth` API
- Never accesses Models, Drizzle, Policies, or general Integrations directly

### Service Constraints

- Owns authoritative validation, authorization, business rules, and sequencing
- Owns transaction boundaries
- Coordinates Models and Integrations

### Infrastructure Constraints

- Owns database queries and external-system communication
- Contains no authentication, authorization, or use-case orchestration

### Caching is a client concern (TanStack Query)

Adopting TanStack Query consciously relaxes the strict "thin client" rule: the client now owns **server-state caching, request retries, and optimistic UI** via the query cache. This is data-fetching infrastructure, not business logic — the rule that the client must not encode **business rules, orchestration, or sequencing** still holds.

### Review Heuristic

> "Is the client deciding anything it shouldn't?"

Violations:
- Calling multiple Controller entry points from one hook
- Branching based on backend **business** semantics
- Encoding domain rules or multi-step orchestration on the client
- Stitching partial backend results together

(Cache invalidation, query retries, and optimistic updates are **not** violations — they are TanStack Query's job.)

---

## Import Rules Summary

| From / To | Presentation | Controller | Service | Infrastructure |
|-----------|--------------|------------|---------|----------------|
| **Presentation** | Yes | Yes (entry points only) | No | No |
| **Controller** | No | Yes | Yes | No |
| **Service** | No | No | Yes | Yes |
| **Infrastructure** | No | No | No | Yes |

Production code may not skip a layer. The narrow authentication-only Controller
exception above does not make `@/lib/auth` a general Infrastructure entry point.
Tests may import database and schema modules only for deterministic `PreDB` setup
and `PostDB` assertions.

---

## Testing Close to Reality

Model, Service, Action, and behavior Hook tests use the real application code and
an isolated in-memory SQLite database. The database is recreated or cleared
between scenarios, so each test can describe its state with `PreDB`, execute the
real path, and verify persisted state with `PostDB`.

When a Service exists, the former server Behavior class is now that Service class,
so its direct module test is `[name].service.test.ts`. Do not keep or generate a
parallel `[name].behavior.test.ts`. *Behavior* still names the functional vertical
slice and its user-facing scenarios; it is no longer a separate server module or
test boundary. An authentication-only behavior has Action and Hook tests but no
empty Service test.

- Model tests call the static Model directly.
- Service tests call the behavior-named Service's `execute` method with real
  Models and Policies.
- Action tests mock only authentication or framework request context when that is
  an outer boundary, then exercise the real Action -> Service -> Model path.
- Authentication-only Action tests may instead exercise the real Action -> auth
  provider -> in-memory SQLite path without introducing or mocking a pass-through
  Service.
- Hook tests call the public handler and exercise the real Hook -> Action/Route ->
  Service -> Model path, or the real Hook -> Action -> auth provider -> in-memory
  SQLite path for authentication-only behaviors, while asserting both TanStack
  Query cache state and the database. For Route-backed Hooks, replace only the
  unavailable browser network transport while keeping the real Route test as the
  HTTP contract boundary.

Do not mock Models, Services, Actions, or the database inside those integration
paths. Mock only boundaries that cannot be meaningfully local, such as session
retrieval, framework transport objects, external network providers, and
clocks/randomness when determinism requires it. Do not mock the local auth
provider when it can run deterministically against the in-memory database.

---

## File Locations

| Type | Location | File Pattern |
|------|----------|--------------|
| Components | `app/[page]/components/` | `[component-name].tsx` (kebab-case) |
| Service class (when required) | `app/[page]/behaviors/[name]/` | `[name].service.ts` |
| Policy | Behavior, page-shared, or global shared scope | `[resource].policy.ts` |
| Behavior hook entry point | `app/[page]/behaviors/[name]/` | `use-[name].hook.ts` |
| Initial page query + page-wide keys | `app/[page]/` | `[page-name].query.ts` |
| Additional/on-demand query options | `app/[page]/behaviors/[name]/` | `[name].query.ts` |
| Mutation options | `app/[page]/behaviors/[name]/` | `[name].mutation.ts` |
| States | `app/[page]/behaviors/[name]/` | `state.ts` |
| Actions | `app/[page]/behaviors/[name]/` | `[name].action.ts` |
| Routes | `app/[page]/behaviors/[name]/routes/` | `route.ts` |
| Workflows (behavior) | `app/[page]/behaviors/[name]/workflows/` | `[name].workflow.ts` |
| Workflow Steps | `app/[page]/behaviors/[name]/workflows/steps/` | `[step-name].ts` |
| Automations | `shared/automations/[name]/workflows/` | `[name].workflow.ts` |
| Automation Steps | `shared/automations/[name]/workflows/steps/` | `[step-name].ts` |
| Integrations | `shared/integrations/` | `[name].ts` |
| Models | `shared/models/` | `[name].ts` |

---

## Sharing Hierarchy

Code can be shared at three levels, following the same structure at each scope:

```
shared/                              <- Global: shared across all pages
  integrations/
  models/                            <- Infrastructure shared by Services
  policies/                          <- Policies shared across pages
  actions/
  hooks/
  states/
  automations/                       <- System-triggered workflows
    [name]/
      workflows/
        [name].workflow.ts
        steps/

app/[page]/
  [page-name].query.ts               <- Initial query + page-wide query keys
  shared/                            <- Page-level: shared between behaviors
    state.ts
    actions/
    hooks/
    policies/
  behaviors/
    [behavior-name]/
      state.ts                       <- Behavior-level: specific to this behavior
      [name].service.ts              <- Application behavior only; omit for auth-only
      [name].action.ts               <- Thin Controller boundary
      use-[name].hook.ts             <- Exports the public use[Name] hook
      [name].query.ts                <- Additional/on-demand read only; imports page keys
      [name].mutation.ts             <- Write behavior only
      tests/
        [name].service.test.ts       <- When a Service exists
        [name].action.test.ts
        use-[name].hook.test.tsx
```

### Scope Rules

| Scope | Location | Shared Between |
|-------|----------|----------------|
| **Behavior** | `behaviors/[name]/` | Nothing (behavior-specific) |
| **Page** | `app/[page]/shared/` | Behaviors within the same page |
| **Global** | `shared/` | All pages and behaviors |

### When to Use Each Level

**Behavior-level** (default):
- State, hooks, Controllers, and any required Services or Policies specific to
  one behavior
- Start here; promote to higher levels only when needed

**Page-level shared**:
- State shared between 2+ behaviors on the same page
- Actions or hooks reused within the same page

**Global shared**:
- Models, Integrations, cross-page Policies, and globally reused actions/utilities
- Code needed by 2+ pages
- Core utilities used throughout the app
- Automations (always global — not page-specific)

---

## Automations

Automations are system-triggered processes that run independently of user interaction. They are parallel to Behaviors in the functional hierarchy — both are feature units, but with different triggers and no Presentation layer.

| Aspect | Behavior | Automation |
|--------|----------|------------|
| Trigger | User action | Schedule or internal event |
| Presentation | Component → Hook | None |
| Entry point | Action / Route / Workflow | Workflow only |
| Location | `app/[page]/behaviors/[name]/` | `shared/automations/[name]/` |

### Trigger Types

| Trigger | Description |
|---------|-------------|
| **Scheduled** | Cron expression — runs at a fixed time or interval |
| **Internal event** | Fired by the app via a queue — e.g. after a user signs up |

### Workflow Constraints

Workflow functions (`"use workflow"`) are sandboxed and must be **deterministic and side-effect-free**. All side effects happen in step functions (`"use step"`), which have full Node.js runtime access and are automatically retried on failure.

```typescript
export async function myAutomation() {
  "use workflow";
  // Orchestration only — no DB calls, no fetch, no Date.now()
  const result = await processStep();
  return result;
}

async function processStep() {
  "use step";
  // A side-effecting step enters through a Service; it does not call a Model,
  // Drizzle, or an Integration directly.
  return SendDigest.execute({ actor: systemActor, input });
}
```
