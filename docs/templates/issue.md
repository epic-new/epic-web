# [Issue title]

[Brief overview of what this issue accomplishes.]

# Functional Specification

## Behavior: [Name]

[One paragraph describing the behavior in user-facing terms.]
Directory: `app/[page]/behaviors/[behavior-name]/`

### Rules

#### [Rule Name]
- When:
  - [Condition]
- Then:
  - [Observable outcome]

#### [Rule Name]
- When:
  - [Condition]
- Then:
  - [Observable outcome]

### Scenarios

#### [Primary Use Case]

##### PreDB
[table-name]:
col_a, col_b, col_c
1, foo, bar

##### Steps
* Act: [User or system performs an action]
* Check: [Observable UI or response outcome]
* Check: [Observable persistence outcome]

##### PostDB
[table-name]:
col_a, col_b, col_c
1, changed, value

#### [Meaningful Failure]

##### PreDB
[Optional CSV tables as needed]

##### Steps
* Act: [Trigger the failure]
* Check: Error "[message]" is shown or returned
* Check: Persistence remains unchanged

##### PostDB
[Expected unchanged tables]

# Technical Specification

Include only the technical units required by this Behavior. Technical scenarios
belong under the unit whose public contract they verify.

## Model: [Resource]Model

File: `shared/models/[resource].ts`

[Static, table-oriented persistence API used by Services.]

### Records
- [Resource]Record: `typeof [table].$inferSelect`
- New[Resource]Record: `typeof [table].$inferInsert`

### Methods
- [method](parameters, transaction?): Promise<[Resource]Record>

### Scenarios

#### Scenario: [Persistence contract]

##### PreDB
[table]:
[state]

##### Steps
* Call: [Resource]Model.[method](...)
* Returns: [expected plain record]

##### PostDB
[table]:
[expected state]

---

## Policy: [Resource]Policy

File: `[scope]/[resource].policy.ts`

[Pure authorization decisions over an actor and the records involved.]

### Methods
- [operation](actor: Actor, records: readonly [Resource]Record[]): boolean

### Scenarios

#### Scenario: [Authorized actor]

##### Steps
* Call: [Resource]Policy.[operation](actor, records)
* Returns: true

#### Scenario: [Unauthorized actor]

##### Steps
* Call: [Resource]Policy.[operation](otherActor, records)
* Returns: false

---

## Service: [BehaviorName].execute(command: CommandType): Promise<ResultType>

File: `[behavior-path]/[behavior-name].service.ts`

[Authoritative validation, authorization, business rules, sequencing, and
transaction boundary for this Behavior. The behavior-named class keeps one public
static execute method.]

- Command: [authenticated actor plus untrusted behavior input]
- Returns: [plain schema-inferred record or serializable result]
- Uses: [Models, Policies, and Integrations]
- Authorizes: private `static authorize(actor, records)` delegates to [Policy]

### Scenarios

#### Scenario: [Successful behavior]

##### PreDB
[table]:
[state]

##### Steps
* Call: [BehaviorName].execute({ actorId, input })
* Returns: [expected result]

##### PostDB
[table]:
[expected state]

#### Scenario: [Authorization or business failure]

##### PreDB
[table]:
[state]

##### Steps
* Call: [BehaviorName].execute({ actorId: otherActor.id, input })
* Throws: "[expected error]"

##### PostDB
[unchanged state]

---

## Action: [actionName](input: InputType): Promise<ActionResponse<ResultType>>

Use an Action by default. If the behavior needs HTTP semantics, streaming, a
webhook, or external-client access, replace or supplement this section with the
Route format from `docs/references/specification.md`. An Action and Route may
coexist only when they expose distinct entry-point semantics; each calls exactly
one Service.

File: `[behavior-path]/[action-name].action.ts`

[Controller boundary that authenticates, adapts transport input, calls one
Service, and translates its result or errors.]

- Given: [request input and authentication assumptions]
- Returns: [public Action response]
- Calls: [BehaviorName].execute

### Scenarios

#### Scenario: [Authenticated request]

##### PreDB
[table]:
[state]

##### Steps
* Call: [actionName](input) as [actor]
* Returns: [expected response]

##### PostDB
[expected state]

#### Scenario: Unauthenticated request

##### PreDB
[table]:
[initial state]

##### Steps
* Call: [actionName](input) without a session
* Returns: { success: false, error: "Unauthorized" }

##### PostDB
[unchanged state]

---

## Query or Mutation Module

File:
- Initial page read and page-wide keys: `app/[page]/[page-name].query.ts`
- Additional/on-demand read: `[behavior-path]/[behavior-name].query.ts`
- Write: `[behavior-path]/[behavior-name].mutation.ts`

[Describe the TanStack Query key, Action-backed query/mutation function,
optimistic transition, reconciliation, invalidation, and rollback. Authenticated
user-owned keys include actor identity.]

---

## Behavior Hook: use[BehaviorName]()

File: `[behavior-path]/use-[behavior-name].hook.ts`

[Public Presentation entry point for this Behavior.]

### State
- isLoading: boolean
- error: string | null

### Returns
- handle[BehaviorName]: (input: Type) => Promise<ResultType>
- isLoading: boolean
- error: string | null

### Dependencies
- `[page-name].query.ts`, `[behavior-name].query.ts`, or `[behavior-name].mutation.ts`
- `useQuery` or `useMutation` from TanStack Query

### Scenarios

#### Scenario: [Successful cache transition]

##### PreState
query `['resource', actorId, 'list']`: [initial cache]
isLoading: false
error: null

##### Steps
* Call: handle[BehaviorName](input)
* Returns: [result]

##### PostState
query `['resource', actorId, 'list']`: [final cache]
isLoading: false
error: null

##### PostDB
[table]:
[expected persisted state, when this Hook changes persistence]

#### Scenario: [Rollback]

##### PreState
[initial cache]

##### Steps
* Call: handle[BehaviorName](invalidInput)
* Throws: "[expected error]"

##### PostState
[restored cache and error state]

##### PostDB
[expected unchanged persisted state, when applicable]

---

## Component: [ComponentName]

File: `[page-path]/components/[component-name].tsx`

[What the component renders and which public Behavior Hook it consumes.]

### Props
- [propName]: [Type] - [description]

### State

#### Local
- [stateName]: [Type]

#### Shared
- [atom]: [Type] - Jotai UI state only

Server data is consumed through the public Behavior Hook and TanStack Query; it
is not declared as component-owned state.

---

## Integration: [IntegrationName]

File: `shared/integrations/[integration-name].ts`

[External system adapter called by the Service.]

### Methods
- [method](input: Type): Promise<ResultType>

### Scenarios

#### Scenario: [External success or normalized failure]

##### Steps
* Call: [IntegrationName].[method](input)
* Returns: [expected normalized result]

# Tasks

* [ ] Infrastructure
  * [ ] Add/update Model and its real in-memory database tests
  * [ ] Add/update Integration when required
* [ ] Service
  * [ ] Add/update Policy and pure Policy tests
  * [ ] Implement `[behavior-name].service.ts`
  * [ ] Add `[behavior-name].service.test.ts` with PreDB/PostDB
* [ ] Controller
  * [ ] Implement Action or Route calling exactly one Service
  * [ ] Add boundary tests using the real Service/Model/database path
* [ ] Presentation
  * [ ] Implement query/mutation module and public Hook
  * [ ] Add Hook cache tests using the real Action and in-memory database
  * [ ] Implement Components and focused presentation tests
* [ ] Verification
  * [ ] Run focused tests, `bun run test`, and `bun run typecheck`

# Notes

[Additional implementation decisions.]
