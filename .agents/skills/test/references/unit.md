# Technical Tests

Translate the Technical Specification scenarios into Vitest tests at the Model,
Policy, Service, Controller, and Hook boundaries. Test the public contract of each
unit, not private calls.

## Database Invariant

All persistence tests use the real Drizzle implementation against the configured
in-memory SQLite database. The test environment must refuse any non-memory
`DATABASE_URL`.

Do not mock:

- Drizzle or the database
- Models
- Services
- Actions called by Hooks

Replace only:

- Request authentication/session state
- Next.js runtime primitives unavailable to Vitest
- External network integrations
- Browser network transport in a Route-backed Hook test
- A Hook contract inside an isolated Component test

## Scenario Format

Database-backed technical scenarios use:

1. **PreDB** — deterministic initial rows.
2. **Steps** — direct call plus expected return or error.
3. **PostDB** — expected final rows.

```markdown
### Scenario: Create an item

#### PreDB
items:
id, user_id, name
(empty)

#### Steps
* Call: CreateItem.execute({ actorId: "user-1", input: { name: "New" } })
* Returns: ItemRecord with name "New"

#### PostDB
items:
id, user_id, name
<uuid>, user-1, New
```

Use placeholders such as `<uuid>` and `<timestamp>` in specifications. In tests,
assert generated values through the returned record rather than hardcoding them.

## Model Tests

Location:

```text
shared/models/tests/[name].test.ts
```

Model tests call one public static method and verify its table-level persistence
contract.

```typescript
import { describe, expect, it } from "vitest";

import { db } from "@/db";
import * as schema from "@/db/schema";
import { PostDB, PreDB } from "@/lib/db-test";
import { ItemModel } from "../item";

describe("ItemModel", () => {
  it("creates an item record", async () => {
    await PreDB(db, schema, { item: [] });

    const item = await ItemModel.create({
      id: "item-1",
      userId: "user-1",
      name: "New",
    });

    expect(item).toMatchObject({ id: "item-1", name: "New" });
    await PostDB(db, schema, {
      item: [{ id: "item-1", userId: "user-1", name: "New" }],
    });
  });
});
```

## Policy Tests

Policies are pure. Construct actor and record values directly and assert the
decision. Do not use the database unless the Policy contract itself changes to
require persisted state—which is normally a design error.

```typescript
expect(ItemPolicy.update(actor, [ownedItem])).toBe(true);
expect(ItemPolicy.update(otherActor, [ownedItem])).toBe(false);
```

## Service Tests

Location:

```text
app/[page]/behaviors/[name]/tests/[name].service.test.ts
```

Call the behavior-named Service class's real `static execute`. Use real Policies,
Models, transactions, and SQLite.

There is no `[name].behavior.test.ts`. The former server Behavior module is now
the behavior-named Service, and `[name].service.test.ts` owns that contract.

```typescript
await PreDB(db, schema, {
  user: [writer],
  item: [],
});

const created = await CreateItem.execute({
  actorId: writer.id,
  input: { name: "New" },
});

expect(created).toMatchObject({ userId: writer.id, name: "New" });
await PostDB(db, schema, {
  item: [{ id: created.id, userId: writer.id, name: "New" }],
});
```

Service scenarios cover:

- Authoritative validation
- Policy-backed authorization
- Business rules and sequencing
- Transaction commit and rollback
- Soft-deleted and missing records
- Returned records and final database state

## Action and Route Tests

Controller tests call the real Action or Route through its real Service and
Models. Authentication-only Controllers instead call the real local auth
provider against in-memory SQLite and do not add an empty Service. Replace only
the authentication/session boundary needed for the test to control the actor.

Focus these scenarios on:

- Unauthenticated requests
- Transport conversion
- HTTP or Action response shape
- Validation/business error translation
- Redirects, headers, status codes, and streaming events

Use `PostDB` to prove rejected boundaries did not mutate persistence. Detailed
business and authorization combinations belong primarily to Service tests.

## Hook Tests

Hook tests use JSDOM and a fresh QueryClient. An Action-backed Hook test calls the
real Action -> Service -> Model path against in-memory SQLite. For an
authentication-only flow, it calls the real Action -> local auth provider ->
in-memory SQLite path. A Route-backed Hook test replaces only browser network
transport; its separate Route test calls the real server path. Authenticated
user-owned keys always include actor identity. For Action-backed optimistic
writes, use the existing `deferred` helper to pause authentication so the pending
state is observable.

```typescript
// @vitest-environment jsdom
const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
vi.mocked(getUser).mockReturnValue(auth.promise);
const client = createTestClient();
client.setQueryData(itemsKeys.list(actor.id), before);

const { result } = renderHook(() => useCreateItem(actor.id), {
  wrapper: queryWrapper(client),
});

let request!: ReturnType<typeof result.current.handleCreateItem>;
act(() => {
  request = result.current.handleCreateItem(input);
});
await waitFor(() => expect(client.getQueryData(itemsKeys.list(actor.id)))
  .toContainEqual(expect.objectContaining({ ...input, pending: true })));

await act(async () => {
  auth.resolve({ user: { id: actor.id } } as never);
  await request;
});
expect(client.getQueryData(itemsKeys.list(actor.id))).toEqual(expectedCache);
await PostDB(db, schema, { item: expectedRows });
```

For mutation scenarios, assert the states named by the specification:

1. PreDB and initial cache.
2. Optimistic `pending: true` cache transition.
3. Reconciled cache and PostDB after success.
4. Rolled-back cache and unchanged PostDB after failure.

Start an intentionally paused mutation inside synchronous `act()` so pending
state is observable. Resolve the boundary and await settlement inside async
`act()`. Use `waitFor()` only for state that settles asynchronously.

## Component Tests

Component tests may replace the public Hook contract because the Hook integration
is verified separately. Use Testing Library semantic queries and verify visible
interaction and presentation outcomes. Do not repeat database assertions here.

## Completion Checklist

- Every Technical Scenario has one clearly traceable `it()` block.
- Every functional Check is covered at the owning technical boundary.
- Model, Service, Action, Route, and Action-backed Hook persistence paths use
  real in-memory SQLite, including the real local provider for authentication-only
  flows.
- Only framework, authentication, external network, or Component-Hook boundaries
  are replaced.
- Tests assert outcomes rather than private calls.
- Focused tests pass before the full suite.

Run:

```bash
bun run test path/to/focused.test.ts
bun run test
bun run typecheck
```
