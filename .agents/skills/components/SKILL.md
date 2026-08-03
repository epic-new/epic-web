---
name: components
description: Write React components following the Epic architecture patterns. Use when creating page components, UI components, or refactoring components to follow the four-layer architecture. Triggers on "create a component", "add a component", or "write a component for".
---

# Components

## Overview

This skill creates React components that follow the Epic four-layer architecture.
Components belong to the **Presentation layer** and handle UI rendering only;
behavior interaction is delegated to hooks.

## Architecture Context

```
page.tsx (Server Component)      -> prefetch + HydrationBoundary
  └─ PageContent (Client)        -> Components -> Hooks
                                       Hooks -> TanStack Query (server state)
                                              -> Jotai atoms (UI state only)
```

Components:
- Only render UI and consume hooks
- NO direct server actions or data fetching
- NO business logic
- Use TypeScript interfaces for props
- Prefer accessible names and semantic elements; add `data-testid` only when no
  stable accessible selector exists

### Page Server Component + prefetch

A page that renders a read is a **Server Component** that prefetches the query
and hydrates a client content component. Keep the page prefetch-only; put the
interactive UI (dialog state, hook calls) in the `*-content.tsx` client child.

```tsx
// page.tsx (Server Component — no 'use client')
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/get-query-client';
import { getUser } from '@/lib/auth';
import { listItemsQuery, defaultParams } from './items.query';
import { PageContent } from './page-content';

export default async function Page() {
  const { user } = await getUser();
  if (!user) throw new Error('Unauthorized');
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery(listItemsQuery(user.id, defaultParams));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageContent />
    </HydrationBoundary>
  );
}
```

The client component consumes the data through a `useQuery` hook — it never
reads the cache directly. The prefetched actor identity and default params must
match the client's first render so the hydrated query key matches. For user-owned
data, the page-wide keys include that identity for cache partitioning; server-side
authorization remains mandatory.

### Navigation & entry points (linking between pages)

When a task asks you to add an entry point — a link/button from one page to
another (e.g. "add a Contacts link on the home view") — use `next/link`:

```tsx
// Plain navigation link — works in BOTH Server and Client Components.
import Link from 'next/link';
<Link href="/contacts" className="text-primary underline-offset-4 hover:underline">
  Go to contacts
</Link>
```

To style that link as a button, render the real `Button` with `asChild` so it
applies its classes to the `Link` — but `Button` is a Client Component, so the
host must be a Client Component too:

```tsx
'use client';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
<Button asChild><Link href="/contacts">Go to contacts</Link></Button>
```

Do NOT call `buttonVariants({ ... })` directly in a Server Component to style a
link — `buttonVariants` is a client-only export and throws at render on the
server (see Constraints). The styleguide's `buttonVariants` "As Link" example is
client-only.

## Before Writing a Component

1. **Read `docs/DESIGN.md`** to find where components and tokens are defined
2. **Check if it already exists**: Review `app/styleguide/navigation.ts`
3. **Use existing primitives**: Compose from components in `components/` subdirectories
4. **Use design tokens**: Use Tailwind semantic classes mapped to CSS variables

## Design Token Usage

**Read `app/globals.css`** to see all available semantic tokens.

Use Tailwind classes mapped to CSS variables (e.g., `bg-primary`, `text-muted-foreground`, `border-border`).

**Never use** hardcoded colors like `bg-gray-100`, `text-black`, `#ffffff`, or `rgb(...)`.

The token names in `globals.css` map directly to Tailwind classes:
- `--primary` → `bg-primary`, `text-primary`
- `--muted-foreground` → `text-muted-foreground`
- `--border` → `border-border`

## When Creating New Shared Components

If a component doesn't exist and should be reusable:
1. Create it in `components/ui/[component-name].tsx` using a kebab-case filename
2. Add a styleguide page at `app/styleguide/components/[component-name]/page.tsx`
3. Update `app/styleguide/navigation.ts` with the new component (include description)
4. Follow the styleguide page pattern with "Notes for the AI" section

## Component Location

```
app/[page]/
  page.tsx                    # Server Component: prefetch + HydrationBoundary
  [page-name].query.ts       # Initial page query + page-wide query keys
  [page-name]-content.tsx     # Client Component: dialog/UI state, consumes hooks
  state.ts                    # Jotai atoms (UI state only)
  components/                 # Page-specific components
    [component-name].tsx      # kebab-case filename
```

## Component Specification Format

Follow the Epic Component specification format from `references/specification.md`:

```markdown
# ComponentName

[Short description of what this component renders]

## Props
- propName: Type - description

## State

### Local
- localState: Type

### Shared
- items: Type[] - server state exposed by useListItems()
- uiState: Type - UI state exposed by the owning hook

## Children
- ChildComponent
- AnotherChild
```

## Implementation Pattern

Reads and writes are **separate hooks**, so they're usually separate components:
a list/table component consumes a `useQuery`-backed read hook; a dialog/form
consumes a `useMutation`-backed hook. Don't expect one hook to return both
`items` and `handleAction`.

### Read / list component

```typescript
'use client';

import { useListItems } from '../behaviors/list-items/use-list-items.hook';

export function ItemsList() {
  // isLoading from the read hook (isPending for always-on reads,
  // isLoading for enabled-gated ones — the hook decides).
  const { items, isLoading, error } = useListItems();

  if (isLoading) return <p role="status">Loading...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <ul aria-label="Items">
      {items.map((item) => (
        <li
          key={item.id}
          // Optimistic rows carry `pending` — dim them until the server confirms.
          className={item.pending ? 'opacity-50' : undefined}
        >
          {item.name}
        </li>
      ))}
    </ul>
  );
}
```

### Mutation / dialog component

`await handleX()` inside `try/catch` and toast — the rejected promise carries
both validation and server errors. (`isLoading` disables the submit button.)

```typescript
'use client';

import { useCreateItem } from '../behaviors/create-item/use-create-item.hook';
import { toast } from 'sonner';

export function CreateItemDialog({ open, onOpenChange }: Props) {
  const { handleCreateItem, isLoading } = useCreateItem();

  const onSubmit = async (data: unknown) => {
    try {
      await handleCreateItem(data);
      toast.success('Item created');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create item');
    }
  };

  return (
    <form aria-label="Create item" /* onSubmit -> onSubmit(...) */>
      <label htmlFor="item-name">Name</label>
      <input id="item-name" name="name" />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating…' : 'Create'}
      </button>
    </form>
  );
}
```

For an **on-demand read** in a dialog, pass the open state into the read hook so
it only fetches when shown: `useItemSessions(item?.id, open)`.

## Testing Selectors

Design the component so tests can query it as a user would. Prefer role,
accessible name/label, and visible text. Use `data-testid` only for output with no
stable accessible selector, such as a canvas visualization or otherwise
unlabelled third-party surface. When needed, use a semantic name such as
`pipeline-canvas` rather than mirroring implementation structure.

## State Management

Server state (lists, records) comes from hooks backed by TanStack Query — never
store it in Jotai. `state.ts` holds **UI state only** (dialogs, selections,
filter/sort/page inputs that feed query keys):

```typescript
import { atom } from 'jotai';

// UI state only — server data lives in the TanStack Query cache.
export const pageAtom = atom(1);
export const searchAtom = atom('');
export const dialogAtom = atom<'add' | 'edit' | null>(null);
```

## Hard-won practice notes

- **Many components can call the same read hook — no prop-drilling.** Both the page-content (for the error banner) and the data table call `useListUsers()`; TanStack dedupes by query key, so it's one fetch and one shared cache entry. Pass UI callbacks down, not server data.
- **A page with dialog `useState` cannot be a Server Component.** That's the reason for the split: `page.tsx` (Server, prefetch-only) wraps `*-content.tsx` (Client) that owns dialog/selection state. Don't try to add `useState` to the prefetching page.
- **Server Components are prefetch-only.** Prefetch into the query client and `dehydrate`; never `fetchQuery` and render the result server-side — let the client `useQuery` own the data, or hydration and the client diverge.
- **Mutations: catch the rejection, don't read `error`.** Dialogs do `await handleX(); toast.success()` / `catch { toast.error() }`. The hook's `error` field is only for inline display of the last error; the thrown rejection is the reliable path (it carries validation + server errors).
- **`isLoading` comes from the hook, not the component.** Render the hook's flag as-is; don't recompute loading from `data == null` (that breaks with `keepPreviousData` and hydration).
- **Optimistic rows carry a `pending` flag** — style them (dim/disable) so the UI reflects the in-flight state; `onSuccess` replaces them with authoritative records and `onError` rolls them back.

## Constraints

- NEVER import database clients in components
- NEVER call server actions directly - use hooks
- NEVER read the query cache directly from a component - go through a hook
- NEVER store server state in Jotai - use the query cache
- NEVER put business logic in components
- NEVER access window object in server components
- NEVER render query results server-side - Server Components only prefetch + hydrate
- NEVER call a function or value imported from a `'use client'` module (e.g. `buttonVariants`, `cva` helpers, hooks) inside a Server Component — it throws `Attempted to call X() from the server` at render. To link to another page styled as a button, use `<Button asChild><Link href="...">…</Link></Button>` from a Client Component, or make the host a Client Component. A bare `<Link>` (optionally with plain Tailwind classes) needs no client boundary and is fine in a Server Component.
- ALWAYS delegate state management to hooks
- ALWAYS provide stable accessible names; use `data-testid` only when no stable accessible selector exists

## Specification Template

```markdown
# CreateProjectForm

Renders the form used to create a new project with a name input and submit button.

## Props
- onSuccess: (project: Project) => void - optional callback after creation

## State

### Local
- (none - delegated to hook)

### Shared
- projects: Project[] - server state exposed by useListProjects()
- dialogOpen: boolean - UI state exposed by the owning hook

## Children
- TextInput
- SubmitButton
```
