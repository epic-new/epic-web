# Hook Integration Tests

Generate `[behavior-path]/tests/use-[behavior-name].hook.test.tsx`. Use JSDOM,
a fresh QueryClient, and the public `handleX` handler. For an Action-backed Hook,
use the real Action -> Service -> Model path and in-memory SQLite, replacing only
authentication/framework or unavailable external boundaries. For a Route-backed
Hook, replace only browser network transport; its Route test separately exercises
the real Route -> Service -> Model path.

For optimistic writes, test both scenarios:

1. Pause the authentication boundary with the repository's `deferred` helper.
2. Start `handleX` without awaiting it and assert the actor-partitioned cache has
   a `pending: true` record.
3. Resolve authentication, await the request, then assert the authoritative
   success record and PostDB.
4. In a failure test, observe the pending record, resolve the real request to a
   Service error, assert rejection/error, restore the exact cache snapshot, and
   assert unchanged PostDB.

```typescript
// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/auth', () => ({ getUser: vi.fn() }));

import { db } from '@/db';
import * as schema from '@/db/schema';
import { getUser } from '@/lib/auth';
import { PostDB, PreDB } from '@/lib/db-test';
import {
  createTestClient,
  deferred,
  queryWrapper,
} from '@/shared/tests/test-utils';
import { itemsKeys } from '../../../items.query';
import type { ItemRecord } from '../../../item';
import { useCreateItem } from '../use-create-item.hook';

const actor = {
  id: 'actor-1',
  email: 'actor@example.com',
  emailVerified: true,
};

describe('Create Item hook scenarios', () => {
  it('shows pending state, then reconciles success', async () => {
    const now = new Date();
    const input = { title: 'New', body: 'Body' };
    await PreDB(db, schema, {
      user: [{ ...actor, createdAt: now, updatedAt: now }],
      item: [],
    });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);

    const client = createTestClient();
    client.setQueryData<ItemRecord[]>(itemsKeys.list(actor.id), []);
    const { result } = renderHook(() => useCreateItem(actor.id), {
      wrapper: queryWrapper(client),
    });

    let request!: ReturnType<typeof result.current.handleCreateItem>;
    act(() => {
      request = result.current.handleCreateItem(input);
    });
    await waitFor(() => {
      expect(client.getQueryData<ItemRecord[]>(itemsKeys.list(actor.id)))
        .toEqual([expect.objectContaining({ ...input, pending: true })]);
    });

    await act(async () => {
      auth.resolve({ user: { id: actor.id } } as never);
      await request;
    });
    const [created] = client.getQueryData<ItemRecord[]>(itemsKeys.list(actor.id)) ?? [];
    expect(created).toMatchObject(input);
    expect(created.pending).toBeUndefined();
    await PostDB(db, schema, {
      item: [{ id: created.id, userId: actor.id, ...input, deletedAt: null }],
    });
  });

  it('shows pending state, then rolls back failure', async () => {
    const now = new Date();
    const before: ItemRecord = {
      id: 'one',
      userId: actor.id,
      title: 'Existing',
      body: 'Body',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };
    await PreDB(db, schema, {
      user: [{ ...actor, createdAt: now, updatedAt: now }],
      item: [before],
    });
    const auth = deferred<Awaited<ReturnType<typeof getUser>>>();
    vi.mocked(getUser).mockReturnValue(auth.promise);

    const client = createTestClient();
    client.setQueryData(itemsKeys.list(actor.id), [before]);
    const { result } = renderHook(() => useCreateItem(actor.id), {
      wrapper: queryWrapper(client),
    });

    let request!: ReturnType<typeof result.current.handleCreateItem>;
    act(() => {
      request = result.current.handleCreateItem({ title: '', body: 'Body' });
    });
    await waitFor(() => {
      expect(client.getQueryData<ItemRecord[]>(itemsKeys.list(actor.id)))
        .toContainEqual(expect.objectContaining({ title: '', pending: true }));
    });

    const rejection = expect(request).rejects.toThrow('Title is required');
    await act(async () => {
      auth.resolve({ user: { id: actor.id } } as never);
      await rejection;
    });
    expect(client.getQueryData(itemsKeys.list(actor.id))).toEqual([before]);
    await PostDB(db, schema, {
      item: [{
        id: before.id,
        userId: actor.id,
        title: before.title,
        body: before.body,
        deletedAt: null,
      }],
    });
  });
});
```

Use `setQueriesData`/`getQueriesData` assertions when the mutation updates a
whole list family. Never mock the Action, Service, Model, Policy, or Drizzle in
an Action-backed Hook integration path.
