# Change List Projects Behavior to Use TanStack Query

Move project-list server state out of Jotai and into an actor-partitioned TanStack Query
cache without changing the visible behavior.

# Functional Specification

## Behavior: List Projects

Shows the authenticated user's projects on the Projects page.
Directory: `app/(app)/projects/behaviors/list-projects/`

### Rules

#### Actor Isolation
- When:
  - A user opens the Projects page
- Then:
  - Only that user's projects are returned
  - The query key includes the authenticated actor identity

#### Server State Ownership
- When:
  - Projects are loading, loaded, refreshed, or fail to load
- Then:
  - TanStack Query owns the records, cache, loading state, and error state
  - Jotai contains only UI inputs such as filters, sort, and selection

#### No Visible Behavior Change
- When:
  - Project state moves from Jotai to TanStack Query
- Then:
  - The same projects, loading UI, empty state, and error UI remain visible

### Scenarios

#### User sees only their projects

##### PreDB
users:
id, email
user-1, one@example.com
user-2, two@example.com

projects:
id, user_id, name
project-1, user-1, First
project-2, user-2, Second

##### Steps
* Act: User user-1 opens the Projects page
* Check: Project "First" is visible
* Check: Project "Second" is not visible

##### PostDB
projects:
id, user_id, name
project-1, user-1, First
project-2, user-2, Second

# Technical Specification

## Model: ProjectModel

File: `shared/models/project.ts`

Static Infrastructure API that owns the Drizzle query for actor-owned projects.

### Methods
- listByUser(userId, transaction?): Promise<ProjectRecord[]>

### Scenarios

#### Scenario: List records for one owner

##### PreDB
projects:
id, user_id, name
project-1, user-1, First
project-2, user-2, Second

##### Steps
* Call: ProjectModel.listByUser("user-1")
* Returns: [ProjectRecord named "First"]

##### PostDB
projects:
id, user_id, name
project-1, user-1, First
project-2, user-2, Second

## Policy: ProjectPolicy

File: `shared/policies/project.policy.ts`

Pure authorization decisions for project reads.

### Methods
- list(actor, records): boolean

### Scenarios

#### Scenario: Actor may list their records

##### Steps
* Call: ProjectPolicy.list({ id: "user-1" }, [record owned by user-1])
* Returns: true

#### Scenario: Actor may not list another user's records

##### Steps
* Call: ProjectPolicy.list({ id: "user-1" }, [record owned by user-2])
* Returns: false

## Service: ListProjects.execute(command): Promise<ProjectRecord[]>

File: `app/(app)/projects/behaviors/list-projects/list-projects.service.ts`

Loads actor-owned records through ProjectModel and authorizes the result through
ProjectPolicy. The behavior-named class exposes one public `static execute` method.

### Scenarios

#### Scenario: List projects for the actor

##### PreDB
projects:
id, user_id, name
project-1, user-1, First
project-2, user-2, Second

##### Steps
* Call: ListProjects.execute({ actorId: "user-1", input: {} })
* Returns: [ProjectRecord named "First"]

##### PostDB
projects:
id, user_id, name
project-1, user-1, First
project-2, user-2, Second

## Action: listProjects(): Promise<ActionResponse<ProjectRecord[]>>

File: `app/(app)/projects/behaviors/list-projects/list-projects.action.ts`

Authenticates the request, calls `ListProjects.execute` once, and translates its result.

### Scenarios

#### Scenario: Authenticated request returns actor-owned projects

##### Steps
* Call: listProjects() as user-1
* Returns: { success: true, data: [ProjectRecord named "First"] }

#### Scenario: Unauthenticated request is rejected

##### Steps
* Call: listProjects() without a session
* Returns: { success: false, error: "Unauthorized" }

## Query Module

File: `app/(app)/projects/projects.query.ts`

- Key: `projectsKeys.list(actorId, params)` includes actor identity and UI filter inputs.
- Query function: calls `listProjects`, throws translated errors, and returns records.
- The page prefetches this factory and hydrates the same key used by the client.

## Behavior Hook: useListProjects()

File: `app/(app)/projects/behaviors/list-projects/use-list-projects.hook.ts`

Consumes `projects.query.ts` with `useQuery`; it does not mirror query data, loading, or
errors into atoms.

### Scenarios

#### Scenario: Hydrated list is isolated by actor

##### PreState
query `['projects', 'user-1', 'list', params]`: [ProjectRecord named "First"]

##### Steps
* Call: useListProjects({ actorId: "user-1", params })
* Returns: data containing "First", isLoading false, error null

##### PostState
query `['projects', 'user-1', 'list', params]`: [ProjectRecord named "First"]

##### PostDB
projects remain unchanged.

## Component: ProjectsList

File: `app/(app)/projects/components/ProjectsList.tsx`

Renders the public `useListProjects` contract. It may consume Jotai filter/sort/selection
inputs, but never project records or query status from atoms.

# Tasks

* [ ] Infrastructure
  * [ ] Keep ProjectModel as the only owner of the Drizzle list query
  * [ ] Add/update its real in-memory SQLite test
* [ ] Service
  * [ ] Add/update ProjectPolicy and pure Policy tests
  * [ ] Add/update ListProjects Service and its PreDB/PostDB tests
* [ ] Controller
  * [ ] Keep listProjects Action thin and test the real Service/Model/database path
* [ ] Presentation
  * [ ] Move records/loading/error from Jotai into `projects.query.ts`
  * [ ] Keep only filter/sort/selection atoms
  * [ ] Update the public Hook and its real Action/database test
  * [ ] Verify the component's visible loading, empty, error, and success states
* [ ] Verification
  * [ ] Run focused tests, `bun run test`, `bun run typecheck`, and `bun run lint`

# Notes

Do not keep a compatibility atom that mirrors query data; that creates two server-state
sources of truth.
