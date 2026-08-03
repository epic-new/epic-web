# Functional Scenario Mapping

Map each functional Act/Check scenario to the technical boundary that owns its
observable outcome. Do not create one monolithic browser test or repeat the same
database assertion at every layer.

```text
Functional scenario
  |-- Service test: validation, authorization, business result, PostDB
  |-- Action test: authentication, transport, response translation
  |-- Hook test: actor-partitioned cache and pending/success/rollback
  `-- Component test: inputs, interaction, loading/error/output presentation
```

There is no server `[name].behavior.test.ts`. The former server Behavior module
is now the behavior-named Service class, so its test is
`[name].service.test.ts`. “Functional scenario mapping” describes coverage
across layers; it is not another implementation module or test boundary.

## Service tests

Call the behavior-named Service's real `static execute` through real Policies,
Models, and in-memory SQLite. Use PreDB/PostDB for validation, authorization,
business rules, transactions, and persistence. Never mock the Model or database.

## Action tests

Call the real Action through its real Service and Models. Replace only request
authentication and unavailable framework primitives.

```typescript
await PreDB(db, schema, { item: [] });
const response = await createItem(input);
if (!response.success) throw new Error(response.error);
expect(response.data).toMatchObject(input);
await PostDB(db, schema, {
  item: [{ id: response.data.id, userId: actor.id, ...input }],
});
```

## Hook tests

Use JSDOM, a fresh QueryClient, actor-partitioned page keys, and the public
`handleX` handler. An Action-backed Hook test uses the real Action -> Service ->
Model -> in-memory SQLite path and may replace authentication/framework
boundaries. A Route-backed Hook test replaces only browser network transport;
its Route test covers the real Route -> Service -> Model path. Use the existing
`deferred` helper to hold an Action-backed boundary open long enough to inspect
optimistic state.

```typescript
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
await waitFor(() => {
  expect(client.getQueryData(itemsKeys.list(actor.id)))
    .toContainEqual(expect.objectContaining({ ...input, pending: true }));
});

await act(async () => {
  auth.resolve({ user: { id: actor.id } } as never);
  await request;
});
const [created] = client.getQueryData<ItemRecord[]>(itemsKeys.list(actor.id)) ?? [];
expect(created).toMatchObject(input);
expect(created.pending).toBeUndefined();
await PostDB(db, schema, { item: expectedRows });
```

Add a failure scenario that observes the pending record, resolves the real
request to a Service error, asserts the handler rejection/error, restores the
exact `before` cache, and proves unchanged PostDB.

For writes, verify:

1. PreDB and actor-partitioned pre-cache.
2. Optimistic `pending: true` cache state.
3. Authoritative success record and PostDB.
4. Exact rollback and unchanged PostDB on failure.

## Component tests

Replace the behavior hook only at its public contract. Use Testing Library and
prefer queries in this order: role, label, visible text, then test ID when no
semantic query fits.

Component tests may verify calls to `handleX`. Action and Hook tests prefer
return, cache, and database outcomes over internal call assertions.

## Act/Check routing

| Functional step | Owning test boundary |
|---|---|
| User enters or selects data | Component |
| User submits an operation | Component contract + Hook integration |
| Data changes | Action or Hook PostDB |
| A list/detail changes | Hook cache + Component visible output |
| Loading or error is shown | Hook state + Component presentation |
| Authentication is rejected | Action result + unchanged PostDB |
| Authorization is rejected | Service result + Action translation + unchanged PostDB |

## Completion checklist

- Every functional scenario maps to named technical tests.
- Persistence paths use real in-memory SQLite with PreDB/PostDB.
- Service tests call real Models; Action-backed Hook tests call the real Service
  through the Action; Route-backed Hooks have a real-path Route test.
- Every authenticated user-owned cache key includes actor identity.
- Hook writes cover pending, success, and rollback through `handleX`.
- Framework/external boundaries are the only replacements.
