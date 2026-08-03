---
name: hooks
description: Write React hooks following the Epic architecture patterns. Use when creating custom hooks for state management, server action calls, optimistic updates, and validation. Triggers on "create a hook", "add a hook", or "write a hook for".
---

# Hooks

## Overview

This skill creates React hooks that follow the Epic four-layer architecture.
Hooks belong to the **Presentation layer**. Server state is owned by **TanStack
Query** (`useQuery`/`useMutation`); **Jotai is retained for UI state only**
(dialogs, selections, filter/sort/page inputs).

## Architecture Context

```
Presentation: Components -> Hooks -> TanStack Query cache (server state)
                          |                 Jotai atoms (UI state only)
                          v
Controller: Actions (atomic) OR Routes (streaming)
```

Hooks:
- Run in the browser (Presentation layer)
- Read server state with `useQuery`; write it with `useMutation`
- Use Jotai atoms ONLY for UI state — never for server data
- May perform optional Zod validation for immediate UX feedback; the Controller
  or its Service remains authoritative
- Call ONE Controller entry point (Action or Route, never both) as the `queryFn`/`mutationFn`
- Handle optimistic updates and rollback through the query cache
- NEVER access database or import server-only code

### Read vs Write

- **Initial page read** → `useQuery` with `app/[page]/[page-name].query.ts` (for example, `items.query.ts`), which owns the initial query options and page-wide query keys. The page Server Component prefetches it and hydrates via `HydrationBoundary`.
- **Additional/on-demand read** → `useQuery` with a behavior `[name].query.ts` that imports its keys from `[page-name].query.ts`.
- **Write** → `useMutation` options in `[name].mutation.ts`, optimistic by default (`onMutate` snapshot/pending, `onSuccess` reconcile, `onError` rollback, `onSettled` invalidate). Mutations with no list representation are plain mutations.

### Controller Entry Point Rule

Each hook calls exactly ONE Controller entry point:

**Action** (default):
- Import and call directly
- Most behaviors
- Simpler mental model

**Route**:
- Call via `fetch` or `fetchEventSource`
- Streaming/SSE, webhooks, HTTP semantics needed
- Supports both request/response and streaming

Never call both. Never call multiple endpoints.

## Hook Location and Naming

```
app/[page]/
  [page-name].query.ts             # Initial page query + page-wide query keys
  behaviors/[behavior-name]/
    use-[behavior-name].hook.ts    # React hook
    [behavior-name].query.ts       # Additional/on-demand read options (optional)
    [behavior-name].mutation.ts    # Write mutation options (when applicable)
    [behavior-name].action.ts      # Server action it calls
```

- The hook lives directly in the behavior folder — there is NO `hooks/` subfolder
- File names use `use-[behavior-name].hook.ts` and match the exported function
- Behavior folders use kebab-case

## Hook Specification Format

Follow the Epic Hook specification format:

```markdown
## useHookName(params?: ParamType)

[Short description of what stateful logic this hook encapsulates]

### Parameters
- paramName: Type - description

### State
- stateName: Type
- anotherState: Type

### Returns
- value: Type - description
- action: () => void - description

### Dependencies
- useOtherHook - why it's needed

### Scenarios

#### Scenario: [Observable hook outcome]

##### PreState
[Initial TanStack Query cache and hook state]

##### Steps
* Call: [public handler or render the read hook]
* Returns: [expected result]

##### PostState
[Final cache and hook state]
```

## Implementation Pattern

### Initial page query options (`[page-name].query.ts`)

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

### Read hook (`useQuery`)

```typescript
'use client';
import { useQuery } from '@tanstack/react-query';
import { useAtomValue } from 'jotai';
import { listItemsQuery } from '../../items.query';
import { pageAtom, searchAtom } from '@/app/[page]/state'; // UI state

export function useListItems(actorId: string) {
  // UI-state atoms feed the query key.
  const page = useAtomValue(pageAtom);
  const search = useAtomValue(searchAtom);

  const query = useQuery(listItemsQuery(actorId, { page, search }));

  return {
    items: query.data?.items ?? [],
    isLoading: query.isPending,
    error: query.error ? (query.error as Error).message : null,
  };
}
```

The page Server Component prefetches and hydrates:

```tsx
// page.tsx (Server Component)
const queryClient = getQueryClient();
await queryClient.prefetchQuery(listItemsQuery(actorId, defaultParams));
return (
  <HydrationBoundary state={dehydrate(queryClient)}>
    <PageContent />
  </HydrationBoundary>
);
```

### On-demand and paginated reads

Keep an on-demand query beside its behavior and import the page-wide key factory
from `[page-name].query.ts`. Paginated initial reads remain in `[page-name].query.ts`.

```typescript
// On-demand read (e.g. a dialog): fetch only when opened.
export function useItemSessions(actorId: string, id: string | undefined, open: boolean) {
  const query = useQuery({ ...sessionsQuery(actorId, id ?? ''), enabled: open && !!id });
  // Use query.isLoading (isPending && isFetching), NOT isPending — a disabled
  // query is "pending" forever, but isLoading stays false until it actually runs.
  return {
    sessions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
  };
}

// Paginated read: keepPreviousData so rows don't blank while the next page loads.
const query = useQuery({
  ...listItemsQuery(actorId, params),
  placeholderData: keepPreviousData,
});
```

### Mutation options (`[name].mutation.ts`, optimistic)

Keep the Controller call and cache transition in one behavior mutation module.
Use the Action's public input type and narrow its discriminated response union explicitly.

```typescript
// create-item.mutation.ts (shared by the public hook and focused tests)
import { mutationOptions, type QueryClient } from '@tanstack/react-query';
import { createItem, type CreateItemInput } from './create-item.action';
import { itemsKeys, type ItemsListData } from '../../items.query';

export type { CreateItemInput } from './create-item.action';

export function createItemMutation(queryClient: QueryClient, actorId: string) {
  return mutationOptions({
    mutationFn: async (input: CreateItemInput) => {
      const response = await createItem(input);
      if (!response.success) throw new Error(response.error);
      return response.data;
    },
    onMutate: async (input: CreateItemInput) => {
      await queryClient.cancelQueries({ queryKey: itemsKeys.lists(actorId) });
      const previous = queryClient.getQueriesData<ItemsListData>({
        queryKey: itemsKeys.lists(actorId),
      });
      const temporaryId = `temp-${Date.now()}`;
      queryClient.setQueriesData<ItemsListData>(
        { queryKey: itemsKeys.lists(actorId) },
        (old) => old
          ? { ...old, items: [{ ...input, id: temporaryId, pending: true }, ...old.items] }
          : old,
      );
      return { previous, temporaryId };
    },
    onSuccess: (created, _input, context) => {
      queryClient.setQueriesData<ItemsListData>(
        { queryKey: itemsKeys.lists(actorId) },
        (old) => old
          ? {
              ...old,
              items: old.items.map((item) =>
                item.id === context?.temporaryId ? created : item,
              ),
            }
          : old,
      );
    },
    onError: (_error, _input, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({
      queryKey: itemsKeys.all(actorId),
    }),
  });
}
```

### Public mutation hook

The hook consumes the mutation module and preserves the public
`{ handleX, isLoading, error }` contract.

```typescript
'use client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createItemMutation,
  type CreateItemInput,
} from './create-item.mutation';

export function useCreateItem(actorId: string) {
  const mutation = useMutation(createItemMutation(useQueryClient(), actorId));
  const handleCreateItem = (input: CreateItemInput) => mutation.mutateAsync(input);

  return {
    handleCreateItem,
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
```

Mutations with no list representation (e.g. set-password, redirect-on-success) are plain mutations — no `onMutate`/`onError` cache work.

## Hard-won practice notes

Lessons that prevent real, hard-to-spot bugs:

- **Preserve the hook's public return shape.** When migrating or refactoring, keep `{ handleX, isLoading, error }` byte-for-byte identical so consuming components need zero changes. This is the difference between touching one file and touching twenty.
- **Prefetch identity and params must equal the client's first render.** Export `defaultParams` from `[page-name].query.ts`; use the same actor identity and params for BOTH server `prefetchQuery` and the first client hook call. If they differ, hydration **silently misses** — no error, just a refetch and a loading flash. The key hash drops `undefined` fields but keeps `''`, so match exactly.
- **`isPending` vs `isLoading`.** Always-enabled reads → `isPending`. `enabled`-gated reads → `isLoading` (a disabled query is "pending" forever).
- **Refresh = invalidate, not refetch.** `queryClient.invalidateQueries({ queryKey })` is stable and refetches the whole family; `query.refetch()` captured in a `useCallback` dep is unstable (the query object is new each render).
- **Client validation is optional UX validation.** When it adds value, parse once
  in the handler before `mutateAsync`; never treat it as authoritative or remove
  the corresponding Controller or Service validation.
- **Authenticated page-wide keys include actor identity.** Every key for user-owned data must include the actor/user identity to prevent cache data crossing identities. This is cache partitioning only; the server action still derives identity from authentication and enforces authorization.
- **Query modules have NO `'use client'`.** The Server Component and client hooks both import `[page-name].query.ts`; additional behavior `.query.ts` files are also shared. Keep them directive-free. Mutations and additional queries import the page-wide key factory from `[page-name].query.ts`.
- **Page split.** A page that renders a read is a Server Component (prefetch + `HydrationBoundary`) wrapping a `*-content.tsx` client component that holds dialog/UI state. A page with `useState`/dialogs can't itself be a Server Component.
- **UI-state atoms shared across dynamic routes** (e.g. a global `sort` atom reused for `/table/[name]`) can desync from the per-route prefetch default — scope them per route or accept the extra client refetch.

## Route Consumption Patterns

### Non-Streaming Route

Treat a request/response Route like any other write: its behavior mutation module
owns `fetch`, and its public hook consumes those options. Never store the returned
server data in Jotai.

```typescript
// route-behavior.mutation.ts
import { mutationOptions } from '@tanstack/react-query';

export function routeBehaviorMutation() {
  return mutationOptions({
    mutationFn: async (input: Input): Promise<Result> => {
      const response = await fetch(`/page/behaviors/behavior-name/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error ?? 'Request failed');
      }
      return data.data;
    },
  });
}
```

```typescript
'use client';
import { useMutation } from '@tanstack/react-query';
import { routeBehaviorMutation } from './route-behavior.mutation';

export function useRouteBehavior() {
  const mutation = useMutation(routeBehaviorMutation());
  return {
    handleRouteBehavior: (input: Input) => mutation.mutateAsync(input),
    isLoading: mutation.isPending,
    error: mutation.error ? mutation.error.message : null,
  };
}
```

### Streaming Route (SSE)

TanStack Query does not model an open event stream. Keep its transient buffer in
hook-local React state; use Jotai only for UI controls shared by components.

```typescript
import { fetchEventSource } from '@microsoft/fetch-event-source';
import { useState, useRef } from 'react';

export function useStreamingBehavior() {
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = async (input: Input) => {
    setIsLoading(true);
    setError(null);
    setResult('');

    abortControllerRef.current = new AbortController();

    await fetchEventSource(`/page/behaviors/behavior-name/routes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: abortControllerRef.current.signal,

      onmessage(event) {
        switch (event.event) {
          case 'token':
            setResult(prev => prev + event.data);
            break;
          case 'complete':
            setIsLoading(false);
            break;
          case 'error':
            setError(event.data);
            setIsLoading(false);
            break;
        }
      },

      onclose() {
        setIsLoading(false);
      },

      onerror(err) {
        setError('Connection failed');
        setIsLoading(false);
      },
    });
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setIsLoading(false);
  };

  return { result, isLoading, error, handleGenerate, handleCancel };
}
```

### Key Differences

| Aspect | Action | Route | Streaming Route |
|--------|--------|-------|-----------------|
| Import | Action function | `fetch` | `fetchEventSource` |
| Call | `await action(input)` | `await fetch(url)` | `await fetchEventSource(url)` |
| Response | Single result | Single result | Multiple events |
| Cancellation | Not supported | Not typical | Via `AbortController` |

---

## Key Patterns

### 1. Optional UX Validation
- Prefer the input type exposed by the Action contract
- Add Zod validation in the handler only when immediate client feedback is useful
- Parse once before `mutateAsync`; the Controller, or its Service when present,
  still validates authoritatively

### 2. Optimistic Updates (via the query cache)
- Define options in `[name].mutation.ts`; the public hook only consumes them
- `onMutate`: cancel in-flight queries, snapshot with `getQueriesData`, apply the optimistic change with `setQueriesData` (temp id, `pending: true`)
- `onSuccess`: replace the temporary record with the authoritative Action result
- `onError`: restore the snapshot
- `onSettled`: `invalidateQueries` to reconcile with the server

### 3. Error Handling
- Surface `mutation.error` / `query.error` as a string; `isPending`/`isLoading` for loading
- Narrow the ActionResponse explicitly in `queryFn`/`mutationFn`; throw its error when `success` is false and return its data otherwise
- Controller errors, and Service errors when a Service exists, reject from
  `mutationFn`, so they reach the same `catch`
- Provide descriptive error messages

### 4. State Management
- Server state lives in the TanStack Query cache — never in Jotai
- Use Jotai atoms (from `state.ts`) ONLY for UI state; filter/sort/page atoms feed query keys
- Return a consistent shape: reads `{ data, isLoading, error }`; mutations `{ handleX, isLoading, error }`

### 5. Server Action Calls
- Actions are called by the shared query/mutation option module, not by Components
- Await the Action, check `response.success`, throw `new Error(response.error)` on failure, and return `response.data` on success so failures enter query/mutation error state
- Never call actions directly from components

## Constraints

- NEVER import Services, Policies, Models, database clients, or Integrations
- NEVER store server state in Jotai — use the query cache
- NEVER call more than one Controller entry point (Action or Route)
- NEVER put business logic in hooks - that belongs in Services
- ALWAYS include both loading and error states (`isPending`/`isLoading` + `error`)
- NEVER rely on optional client validation instead of Controller or Service validation
- ALWAYS preserve the hook's public return shape when refactoring (keep components untouched)
- ALWAYS define write options in `[name].mutation.ts`
- ALWAYS make list mutations optimistic (`onMutate`/`onSuccess`/`onError`/`onSettled`); plain mutations otherwise
- ALWAYS support cancellation for streaming behaviors (routes)

## Specification Template

Use the canonical Behavior Hook format in
`docs/references/specification.md`: H1 hook/file signature, H2 State, Returns,
Dependencies, and Scenarios. A write hook lists its `[name].mutation.ts`
dependency and actor-partitioned cache PreState/PostState. Scenarios name the
public `handleX` handler and show authoritative success or exact rollback.

## Test Generation

Generate test files at `[behavior-path]/tests/use-[behavior-name].hook.test.tsx`.
Read `references/testing.md` before writing a Hook integration test. It shows the
existing `deferred`, `createTestClient`, and `queryWrapper` helpers and the full
pending -> success and pending -> rollback paths. Action-backed Hooks exercise
the real Action -> Service -> Model path, or the real Action -> local auth
provider -> in-memory SQLite path for authentication-only behaviors. Route-backed
Hooks replace only browser network transport and rely on the Route test for the
real server path.
