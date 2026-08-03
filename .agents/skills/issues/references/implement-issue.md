# Implement Create Project Behavior

Create an authenticated project and add it to the actor-partitioned project list.

# Functional Specification

## Behavior: Create Project

Allows an authenticated user to create a project from the projects page.
Directory: `app/(app)/projects/behaviors/create-project/`

### Rules

#### Authentication Required
- When:
  - The request has no authenticated user
- Then:
  - Reject with "Unauthorized"

#### Name Required
- When:
  - Project name is empty after trimming
- Then:
  - Reject with "Name is required"

#### Owner Assignment
- When:
  - Project creation succeeds
- Then:
  - Persist the authenticated user as owner

### Scenarios

#### User creates a project successfully

##### PreDB
user:
id, email
user-1, user@example.com

project:
id, user_id, name
(empty)

##### Steps
* Act: User user-1 submits project name "New Project"
* Check: "New Project" appears in the project list
* Check: The project belongs to user-1

##### PostDB
project:
id, user_id, name
<uuid>, user-1, New Project

#### User submits an empty name

##### PreDB
project:
id, user_id, name
(empty)

##### Steps
* Act: User user-1 submits an empty project name
* Check: Error "Name is required" is returned
* Check: No project is created

##### PostDB
project:
id, user_id, name
(empty)

# Technical Specification

## Model: ProjectModel

File: `shared/models/project.ts`

Static Infrastructure API for the `project` table.

### Records
- ProjectRecord: `typeof project.$inferSelect`

### Methods
- create(attributes, transaction?): Promise<ProjectRecord>
- listActiveByUser(userId, transaction?): Promise<ProjectRecord[]>

### Scenarios

#### Scenario: Persist a project record

##### PreDB
project:
id, user_id, name
(empty)

##### Steps
* Call: ProjectModel.create({ userId: "user-1", name: "New Project" })
* Returns: ProjectRecord with owner user-1

##### PostDB
project:
id, user_id, name
<uuid>, user-1, New Project

## Policy: ProjectPolicy

File: `shared/policies/project.policy.ts`

Pure authorization decisions for project behaviors.

### Methods
- canCreate(actor, records): boolean

### Scenarios

#### Scenario: Authenticated actor may create

##### Steps
* Call: ProjectPolicy.canCreate({ id: "user-1" }, [])
* Returns: true

## Service: CreateProject.execute(command): Promise<ProjectRecord>

File: `app/(app)/projects/behaviors/create-project/create-project.service.ts`

Validates the command, authorizes the actor through ProjectPolicy, and delegates
persistence to ProjectModel.

- Command: trusted actorId plus untrusted project input
- Returns: ProjectRecord
- Uses: ProjectModel and ProjectPolicy
- Authorizes: private `static authorize(actor, records)`

### Scenarios

#### Scenario: Create a valid project

##### PreDB
user:
id, email
user-1, user@example.com

project:
id, user_id, name
(empty)

##### Steps
* Call: CreateProject.execute({ actorId: "user-1", input: { name: "New Project" } })
* Returns: ProjectRecord with name "New Project"

##### PostDB
project:
id, user_id, name
<uuid>, user-1, New Project

#### Scenario: Reject an empty name

##### PreDB
project:
id, user_id, name
(empty)

##### Steps
* Call: CreateProject.execute({ actorId: "user-1", input: { name: "" } })
* Throws: "Name is required"

##### PostDB
project:
id, user_id, name
(empty)

## Action: createProject(input): Promise<ActionResponse<ProjectRecord>>

File: `app/(app)/projects/behaviors/create-project/create-project.action.ts`

Authenticates the request, passes trusted actorId to CreateProject, and translates
the result or error.

### Scenarios

#### Scenario: Authenticated request creates a project

##### PreDB
user:
id, email
user-1, user@example.com

project:
id, user_id, name
(empty)

##### Steps
* Call: createProject({ name: "New Project" }) as user-1
* Returns: { success: true, data: ProjectRecord }

##### PostDB
project:
id, user_id, name
<uuid>, user-1, New Project

#### Scenario: Unauthenticated request is rejected

##### PreDB
project:
id, user_id, name
(empty)

##### Steps
* Call: createProject({ name: "New Project" }) without a session
* Returns: { success: false, error: "Unauthorized" }

##### PostDB
project:
id, user_id, name
(empty)

## Behavior Hook: useCreateProject()

File: `app/(app)/projects/behaviors/create-project/use-create-project.hook.ts`

Exposes `handleCreateProject` and runs `create-project.mutation.ts`.

### Scenarios

#### Scenario: Reconcile a successful optimistic project

##### PreState
query `['projects', 'user-1', 'list']`: []

##### Steps
* Call: handleCreateProject({ name: "New Project" })
* Returns: ProjectRecord

##### PostState
query `['projects', 'user-1', 'list']`: [ProjectRecord named "New Project"]
isLoading: false
error: null

##### PostDB
project:
id, user_id, name
<uuid>, user-1, New Project

# Tasks

* [ ] Add ProjectModel and its in-memory SQLite tests
* [ ] Add ProjectPolicy and pure authorization tests
* [ ] Implement `create-project.service.ts` and Service scenarios
* [ ] Implement the thin Action and authentication scenarios
* [ ] Implement mutation options and `useCreateProject`
* [ ] Test cache and PostDB through the real Action/Service/Model path
* [ ] Implement the form and visible behavior checks
* [ ] Run focused tests, `bun run test`, and `bun run typecheck`
