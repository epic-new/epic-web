# Epic Specification Format

This document defines a **behavior-centric specification system** for describing software. Specifications are organized into two categories:

**Functional Specifications** describe *what the system does* from the user's perspective. They form a hierarchy:

```
Project → Flow → Page → Behavior
        → Automation
```

**Technical Specifications** describe *how the system is built* from the developer's perspective. They are a flat catalog of implementation units:

```
Function | Service | Policy | Model | Integration | Component | Hook | Route | Workflow
```

**Behavior and Automation are the leaves of the Functional hierarchy** and the primary units that Technical specs reference. Behaviors are user-triggered; Automations are system-triggered. All specifications are written in concise, human-readable Markdown.

---

# Part 1: Functional Specifications

Functional specifications describe user journeys, screens, and observable actions. A product manager or designer could write and read these without knowing the codebase.

---

## 1. Project Specification Format

Project specifications describe **the entire application** as a composition of pages and flows, each with their associated behaviors. They provide a high-level map of the system.

### Purpose

Project specifications answer:
- What pages exist in the application?
- What flows guide users through the application?
- Which behaviors are available on each page?
- Which behaviors comprise each flow?

### Structure

A project specification consists of:
1. A heading naming the **project**
2. A short description of the application
3. A **Pages** section listing all pages with their behaviors
4. A **Flows** section listing all flows with their behaviors
5. An **Automations** section listing all automations with their triggers

### Conventions

- Each page entry includes the path and a list of behaviors
- Each flow entry includes a description and an ordered list of behaviors
- Each automation entry includes a name, trigger type, and description
- Behaviors are listed by name, linking pages and flows to the behavior specifications

### Scenario

```markdown
# Project Management App

A web application for creating and managing projects with team collaboration.

## Pages

### Projects Page
**Path:** `/projects`

#### Behaviors
- List Projects
- Create Project
- Delete Project

### Project Details Page
**Path:** `/projects/:id`

#### Behaviors
- View Project
- Edit Project
- Add Team Member
- Remove Team Member

### Settings Page
**Path:** `/settings`

#### Behaviors
- Update Profile
- Change Password
- Manage Notifications

## Flows

### User Onboarding
Guides a new user from account creation to their first project.

#### Behaviors
1. User Registration
2. User Authentication
3. Create Project
4. View Project

### Team Collaboration
Allows a project owner to invite and manage team members.

#### Behaviors
1. View Project
2. Add Team Member
3. Assign Task
4. Remove Team Member

### Project Lifecycle
Covers the full lifecycle of a project from creation to completion.

#### Behaviors
1. Create Project
2. Edit Project
3. Add Team Member
4. Complete Project
5. Archive Project

## Automations

### Send Weekly Digest
**Trigger:** Schedule — every Monday at 8am UTC

Sends a summary email to all active users with their activity from the past week.

### Archive Stale Projects
**Trigger:** Schedule — every day at midnight

Automatically archives projects with no activity in the past 90 days.
```

---

## 2. Flow Specification Format

Flow specifications describe **user journeys** as ordered collections of behaviors across pages. A flow represents how a user moves through the system over time. It does not introduce new behavior or UI; it only references existing behaviors and the pages where they occur.

### Purpose

Flow specifications answer:
- How does a user accomplish a goal end-to-end?
- In what order are behaviors experienced?
- On which pages do those behaviors occur?

### Structure

A flow specification consists of:
1. A heading naming the **flow**
2. A short description of the journey and its goal
3. An ordered list of **steps**

Each step references:
- a **behavior**
- the **page path** where it occurs
- a brief description of user intent

### Scenario

```markdown
# User Onboarding

Guides a new user from account creation to their first successful project.

## Behaviors

1. **User Registration** — `/signup`
   User creates a new account.

2. **User Authentication** — `/login`
   User logs into the application.

3. **Create Project** — `/projects`
   User creates their first project.

4. **View Project Dashboard** — `/projects/:id`
   User sees the project overview and next actions.
```

---

## 3. Page Specification Format

Page specifications describe **application pages (routes)** as compositions of components and behaviors. They sit above components and below flows, making routing and UI composition explicit.

### Purpose

Page specifications answer:
- What is this page responsible for?
- Which components are rendered on this page?
- Which behaviors are exposed through this page?

### Structure

A page specification consists of:
1. A heading naming the **page**
2. The route **path**
3. A short **overview**
4. A list of **components** rendered on the page
5. A list of **behaviors** available from the page

### Scenario

```markdown
# Projects Page

**Path:** `/projects`

## Overview

Displays the user's projects and allows creating and managing them.

## Components

### ProjectList

Displays the list of projects for the current user.

### CreateProjectForm

Allows the user to create a new project.

## Behaviors

### Create Project

Allows the user to create a new project from the projects page.

### Delete Project

Allows the user to remove an existing project.
```

---

## 4. Behavior Specification Format

Behavior specifications describe **end-to-end observable behavior** governed by declarative rules. Behavior is the leaf of the Functional hierarchy and the primary unit that Technical specs reference.

### Structure

A behavior specification consists of:
1. A top-level heading naming the **behavior**
2. A one-paragraph description
3. The behavior directory
4. A **Dependencies** section (optional) - ordered list of prerequisite behaviors
5. A **Rules** section - named rules with When/Then conditions
6. A **Scenarios** section - concrete scenarios demonstrating the behavior

Each scenario may include:
- **PreDB** (optional) - system state before the behavior
- **Steps** (required) - actions and verifications
- **PostDB** (optional) - system state after the behavior

### Step Keywords

Steps use prefixes to distinguish actions from verifications:
- **Act:** - user or system performs an action (changes state)
- **Check:** - verification that something is true (asserts state)

### Dependencies Section

The optional Dependencies section lists behaviors that must be completed before the current behavior can be performed. This is useful for:
- Documenting prerequisite behaviors in flows
- Test generation (ensuring setup steps are run)
- Understanding behavior ordering in the system

Dependencies are listed as an ordered list of behaviors with their specific scenario:

```markdown
## Dependencies

1. Create Project: User creates a new project successfully
2. View Project: User views project details
```

### Scenario

```markdown
# Create Project

Allows authenticated users to create a new project.
Directory: `app/projects/behaviors/create-project/`

## Rules

### Authentication Required
- When:
  - User is not authenticated
- Then:
  - Reject with "Unauthorized"

### Unique Name Per User
- When:
  - Project name already exists for user
- Then:
  - Reject with "Project name already exists"
  - Form field "name" shows error

### Name Required
- When:
  - Project name is empty
- Then:
  - Reject with "Name is required"
  - Form field "name" shows error

### Name Too Long
- When:
  - Project name exceeds 100 characters
- Then:
  - Reject with "Name must be 100 characters or less"
  - Form field "name" shows error

### Default Status
- When:
  - Project is created successfully
- Then:
  - Status defaults to "draft"
  - Created timestamp is set

## Scenarios

### User creates a new project successfully

#### PreDB
users:
id, email, role, status
1, user@scenario.com, client, active

projects:
id, user_id, name, status
1, 1, Test Project, active

#### Steps
* Act: User logs in as "client"
* Act: User navigates to the projects page
* Act: User submits the create project form with name "New Project"
* Check: New project appears in the list
* Check: Project status is "draft"

#### PostDB
projects:
id, user_id, name, status
1, 1, Test Project, active
2, 1, New Project, draft

### User tries to create project with duplicate name

#### PreDB
users:
id, email, role, status
1, user@scenario.com, client, active

projects:
id, user_id, name, status
1, 1, Existing Project, active

#### Steps
* Act: User logs in as "client"
* Act: User navigates to the projects page
* Act: User submits the create project form with name "Existing Project"
* Check: Error "Project name already exists" is shown
* Check: No new project is created
```

### Scenario with Dependencies

```markdown
# Add Team Member

Allows a project owner to add a team member to their project.
Directory: `app/projects/behaviors/add-team-member/`

## Dependencies

1. Create Project: User creates a new project successfully
2. View Project: User views project details

## Rules

### Project Must Exist
- When:
  - Project does not exist
- Then:
  - Reject with "Project not found"

### Owner Only
- When:
  - User is not the project owner
- Then:
  - Reject with "Only the project owner can add members"

## Scenarios

### Owner adds team member successfully

#### PreDB
users:
id, email, role
1, owner@scenario.com, client
2, member@scenario.com, client

projects:
id, user_id, name
1, 1, My Project

project_members:
id, project_id, user_id
(empty)

#### Steps
* Act: User logs in as "owner@scenario.com"
* Act: User navigates to project details page
* Act: User submits add member form with email "member@scenario.com"
* Check: Member appears in team list

#### PostDB
project_members:
id, project_id, user_id
1, 1, 2
```

**Rules** are named declarative constraints with When/Then conditions. Each rule has a descriptive name, a list of conditions (When), and a list of outcomes (Then). Multiple conditions are implicitly AND. For OR logic, create separate rules. **Scenarios** demonstrate how the behavior plays out in concrete scenarios. Steps focus on **observable behavior**, not implementation details.

---

## 5. Automation Specification Format

Automation specifications describe **system-triggered processes** governed by declarative rules. Automations belong directly to the Project (not to a Page) and are always implemented as workflows.

### Structure

An automation specification consists of:
1. A top-level heading naming the **automation**
2. A one-paragraph description
3. The automation directory
4. A **Trigger** section — what initiates the automation
5. A **Rules** section — named rules with When/Then conditions
6. A **Scenarios** section — concrete scenarios demonstrating the automation

### Trigger Section

**Scheduled:**
```markdown
## Trigger

- Schedule: `0 8 * * 1` — every Monday at 8am UTC
```

**Internal event:**
```markdown
## Trigger

- Event: `user.signed_up` — fires when a new user completes registration
```

### Scenario

```markdown
# Send Weekly Digest

Sends a weekly summary email to all active users with their activity from the past week.
Directory: `shared/automations/send-weekly-digest/`

## Trigger

- Schedule: `0 8 * * 1` — every Monday at 8am UTC

## Rules

### Active Users Only
- When:
  - User status is "active"
- Then:
  - Include user in the digest batch

### Skip Empty Digest
- When:
  - User has no activity in the past 7 days
- Then:
  - Skip email for that user

## Scenarios

### Digest sent to active users with activity

#### PreDB
users:
id, email, status
1, alice@scenario.com, active
2, bob@scenario.com, active
3, carol@scenario.com, inactive

activity_events:
id, user_id, created_at
1, 1, 2026-05-18T10:00:00Z

#### Steps
* Act: Scheduler triggers "Send Weekly Digest" on 2026-05-25 at 8am UTC
* Check: Email sent to alice@scenario.com
* Check: No email sent to bob@scenario.com (no activity this week)
* Check: No email sent to carol@scenario.com (inactive)

#### PostDB
digest_emails:
id, user_id, sent_at
1, 1, 2026-05-25T08:00:00Z
```

---

# Part 2: Technical Specifications

Technical specifications describe implementation units that realize behaviors. They are a flat catalog - each spec type stands alone and references behaviors it participates in.

---

## 6. Function Specification Format

Function specifications describe the **behavioral contract** of a single function. They focus on _intent_, not implementation.

### Structure

A function specification consists of:
1. A heading whose title is the **function signature**
2. A short description
3. A small set of keywords
4. Optional **Scenarios** with PreDB/PostDB (for functions that modify state)

### Keywords

- **Given** - input parameters and assumptions
- **Returns** - value or outcome returned
- **Calls** (optional) - direct dependencies

### Scenarios Section

For functions that modify database state (like server actions), include scenarios showing state transitions:

- **PreDB** - database state before execution (CSV format)
- **Steps** - function call and expected result using keywords:
  - `Call:` - invoke the function with specific inputs
  - `Returns:` - expected return value
  - `Throws:` - expected error for non-Action functions
- **PostDB** - database state after execution (CSV format)

When the function is a Server Action, it is a Controller contract: it
authenticates the request, adapts transport input, calls exactly one Service, and
translates the result or error. It never imports a Model, Drizzle, schema table,
or Integration. Every Action returns the shared serializable union
`ActionResponse<T> = { success: true; data: T } | { success: false; error: string }`.
Action scenarios use `Returns:` for both success and failure responses; errors
from authentication or the Service are translated into the failure variant rather
than specified as thrown errors.

### Scenario (Simple Function)

```markdown
## validateProjectName(name: string): ValidationResult

Validates a project name against naming rules.

- Given: a project name string
- Returns: validation result with errors if invalid
```

### Scenario (Server Action with State Changes)

```markdown
## createProject(input: CreateProjectInput): Promise<ActionResponse<ProjectRecord>>

Creates a new project for the authenticated user.

- Given: project name and authenticated user with "client" role
- Returns: a success response containing the newly created project, or a failure response
- Calls: CreateProject.execute

### Scenario: Create project successfully

#### PreDB
users:
id, email, role
1, user@scenario.com, client

projects:
id, user_id, name, status
1, 1, Existing Project, active

#### Steps
* Call: createProject({ name: "New Project" }) as user 1
* Returns: { success: true, data: { id: 2, name: "New Project", status: "draft", userId: 1 } }

#### PostDB
projects:
id, user_id, name, status
1, 1, Existing Project, active
2, 1, New Project, draft

### Scenario: Reject duplicate name

#### PreDB
projects:
id, user_id, name
1, 1, My Project

#### Steps
* Call: createProject({ name: "My Project" }) as user 1
* Returns: { success: false, error: "Project name already exists" }

#### PostDB
projects:
id, user_id, name
1, 1, My Project
```

---

## 7. Service Specification Format

Service specifications describe the server-side implementation of one functional
Behavior. The Service owns authoritative validation, authorization, business
rules, sequencing, and atomicity decisions. It delegates persistence to
Models and external communication to Integrations.

### Structure

A Service specification consists of:
1. A heading naming the class and its `execute` command
2. A short description of the behavior it implements
3. The command and result types
4. Its Model, Policy, and Integration dependencies
5. Scenarios with PreDB/Steps/PostDB

### Scenarios Section

The Service is the existing behavior-named server class renamed from
`[name].behavior.ts` to `[name].service.ts`; it is not an additional wrapper and
does not require a `Service` suffix on the class name. Each class is stateless and
exposes one public `static execute`.

When authorization is required, `execute` calls a private
`static authorize(actor, records)` method. That method delegates the decision to
a pure Policy. Service scenarios directly call `execute` and follow the same
PreDB/Steps/PostDB format as other database-backed specs.

Generate these scenarios as `[name].service.test.ts`. There is no separate
server-side `[name].behavior.test.ts`; *Behavior* is the functional slice, while
the Service is the technical module that implements and directly tests its
business rules.

### Scenario

```markdown
# CreateProject.execute(command: CreateProjectCommand): Promise<ProjectRecord>

Creates one project for the authenticated actor.

## Command
- actorId: string - authenticated identity supplied by the Controller
- input: CreateProjectInput - untrusted behavior input

## Returns
- ProjectRecord - schema-inferred plain record returned by ProjectModel

## Dependencies
- ProjectModel - project persistence
- ProjectPolicy - project authorization

## Scenarios

### Scenario: Create a new project

#### PreDB
projects:
id, name, status
(empty)

#### Steps
* Call: CreateProject.execute({ actorId: "1", input: { name: "New Project" } })
* Returns: { id: 1, name: "New Project", status: "draft" }

#### PostDB
projects:
id, name, status
1, New Project, draft

### Scenario: Reject duplicate project name

#### PreDB
projects:
id, name, status
1, Existing Project, active

#### Steps
* Call: CreateProject.execute({ actorId: "1", input: { name: "Existing Project" } })
* Throws: "Project name already exists"

#### PostDB
projects:
id, name, status
1, Existing Project, active
```

---

## 8. Model Specification Format

Model specifications describe static, table-oriented Infrastructure APIs. A
Model owns Drizzle queries for one table and returns schema-inferred plain
records. It does not authenticate, authorize, orchestrate a use case, or return
class instances.

### Structure

A Model specification consists of:
1. A heading naming the Model
2. Its table and inferred record types
3. Its static persistence methods
4. Optional transaction requirements
5. Scenarios with PreDB/Steps/PostDB

### Scenario

```markdown
# ProjectModel

Provides persistence operations for the `project` table.
File: `shared/models/project.ts`

## Records
- ProjectRecord: `typeof project.$inferSelect`
- NewProjectRecord: `typeof project.$inferInsert`

## Methods
- find(id, transaction?): Promise<ProjectRecord | null>
- listByUser(userId, transaction?): Promise<ProjectRecord[]>
- create(attributes, transaction?): Promise<ProjectRecord>
- update(record, changes, transaction?): Promise<ProjectRecord | null>
- softDelete(record, transaction?): Promise<ProjectRecord | null>

## Scenarios

### Scenario: Create a project record

#### PreDB
projects:
id, user_id, name
(empty)

#### Steps
* Call: ProjectModel.create({ userId: "1", name: "New Project" })
* Returns: ProjectRecord with name "New Project"

#### PostDB
projects:
id, user_id, name
<uuid>, 1, New Project
```

---

## 9. Policy Specification Format

Policy specifications describe pure authorization decisions. Policies receive an
authenticated actor and the records involved in an operation. They do not query
or mutate the database and do not depend on transport or UI code.

### Structure

A Policy specification consists of:
1. A heading naming the Policy
2. The actor and record types it evaluates
3. Its static decision methods
4. Scenarios expressed as direct calls and returns

### Scenario

```markdown
# ProjectPolicy

Determines which project operations an actor may perform.

## Methods
- update(actor: Actor, records: readonly ProjectRecord[]): boolean
- delete(actor: Actor, records: readonly ProjectRecord[]): boolean

## Scenarios

### Scenario: Owner may update a project

#### Steps
* Call: ProjectPolicy.update({ id: "user-1" }, [{ id: "project-1", userId: "user-1" }])
* Returns: true

### Scenario: Another user may not update a project

#### Steps
* Call: ProjectPolicy.update({ id: "user-2" }, [{ id: "project-1", userId: "user-1" }])
* Returns: false
```

---

## 10. Integration Specification Format

Integration specifications describe Infrastructure adapters for third-party
systems such as payments, email, storage, and AI APIs. Integrations own SDK and
protocol mechanics, retries, and external error normalization. They do not own
application authorization or business sequencing and are called by Services.

### Structure

An Integration specification consists of:
1. A heading naming the Integration
2. The external system and configuration it wraps
3. Its public methods and serializable results
4. Its external failure behavior
5. Scenarios expressed as direct calls and outcomes

### Scenario

```markdown
# EmailIntegration

Provides the Infrastructure adapter for the configured email provider.

## Methods
- send(message: EmailMessage): Promise<EmailResult>

## Scenarios

### Scenario: Send an email successfully

#### Steps
* Call: EmailIntegration.send({ to: "user@example.com", subject: "Welcome" })
* Returns: { success: true, messageId: "message-1" }

### Scenario: Normalize a provider failure

#### Steps
* Call: EmailIntegration.send({ to: "invalid", subject: "Welcome" })
* Throws: "Email provider rejected recipient"
```

---

## 11. Component Specification Format

Component specifications describe **UI components** in terms of their inputs, state, and structure.

### Purpose

Component specifications answer:
- What inputs it accepts
- What state it owns locally
- What state it shares with other components
- How it is composed structurally

### Structure

A component specification consists of:
1. A heading naming the **component**
2. A short description
3. Optional **props** accepted by the component
4. A **state** section, grouped into Local and Shared
5. Optional **children** listing direct subcomponents

### Conventions

- The component name is an H1 heading
- All subsections are H2 headings
- State is always grouped under **Local** and **Shared**
- State entries use the format `name: type`
- Absence of a section is meaningful

### Scenario

```markdown
# CreateProjectForm

Renders the form used to create a new project.

## Props
- onSuccess: (projectId: number) => void

## State

### Local
- name: string
- isSubmitting: boolean

### Shared
- status: boolean
- result: string

## Children
- TextInput
- SubmitButton
- ErrorBanner
```

---

## 12. Behavior Hook Specification Format

Behavior hook specifications describe the **entry point of a behavior** — the bridge between UI components and its TanStack Query module.

### Purpose

Hook specifications answer:
- What behavior does this hook trigger?
- What data does a read hook expose, or what is a mutation hook's handler signature?
- What state does it manage?
- What does it return to components?

### Key Principle

**One behavior = One public hook = One TanStack Query primitive**

Each behavior has one public client module, `use-[behavior-name].hook.ts`, which
exports its React hook. An initial page-read hook consumes `[page-name].query.ts`; an
additional or on-demand read hook consumes its behavior `.query.ts`; a write hook
consumes one `.mutation.ts`. Page-wide keys for authenticated user-owned data include
the actor/user identity. Components import only the hook module.

### Structure

A hook specification consists of:
1. A heading with the **hook signature**
2. A short description referencing the behavior
3. **Parameters** it accepts (optional)
4. **State** it manages internally
5. **Returns**, according to the TanStack Query primitive:
   - Read hooks: `data`, `isLoading`, and `error`
   - Mutation hooks: `handle[Behavior]`, `isLoading`, and `error`
6. Its page- or behavior-owned query module, or its `.mutation.ts` dependency
7. **Scenarios** — test scenarios using explicit TanStack Query cache
   `PreState`/`Steps`/`PostState`, plus `PostDB` whenever persistence is observable

Read hooks do not expose a mutation handler. Mutation hooks do not expose query
data as their public state; authoritative server data remains in the query cache
and is consumed through a read hook.

### Scenario (Mutation Hook)

```markdown
# use-create-project.hook.ts — useCreateProject()

Public entry point for the Create Project behavior. It invokes one mutation module that performs the cache transition and calls the server action.

## State
- isLoading: boolean
- error: string | null

## Returns
- handleCreateProject: (name: string) => Promise<ProjectRecord> - triggers the behavior
- isLoading: boolean - submission in progress
- error: string | null - current error message

## Dependencies
- `create-project.mutation.ts` — mutation options and optimistic cache transition

## Scenarios

### Scenario: Create project successfully

#### PreState
query `['projects', 'user-1', 'list']`: []
isLoading: false
error: null

#### Steps
* Call: handleCreateProject("New Project")
* Returns: ProjectRecord named "New Project"

#### PostState
query `['projects', 'user-1', 'list']`: [{ id: 1, name: "New Project", status: "draft", pending: false }]
isLoading: false
error: null

#### PostDB
projects:
id, user_id, name, status
<uuid>, user-1, New Project, draft

### Scenario: Reject empty name

#### PreState
query `['projects', 'user-1', 'list']`: []
isLoading: false
error: null

#### Steps
* Call: handleCreateProject("")
* Throws: "Name is required"

#### PostState
query `['projects', 'user-1', 'list']`: []
isLoading: false
error: "Name is required"

#### PostDB
projects:
id, user_id, name, status
(empty)
```

---

## 13. Route Specification Format

Route specifications describe **HTTP Controller endpoints** for behaviors that
need HTTP semantics, streaming, or external access. They are the HTTP counterpart
to Server Actions. A Route authenticates or verifies its transport boundary,
adapts the request, calls exactly one Service, and translates the response; it
does not call Models, Drizzle, or Integrations directly.

### Purpose

Route specifications answer:
- What behavior does this route implement?
- What input does it accept?
- What does it return (or emit for streaming)?
- When does it complete or fail?

### Structure

A route specification consists of:
1. A heading naming the **route**
2. The HTTP **method** and **path**
3. A short description
4. The **Behavior** it implements
5. **Input** (request payload)
6. **Returns** (for non-streaming) or **Emitted Events** (for streaming)
7. **Scenarios**

### Consumption

Routes are consumed by hooks via `fetch` (non-streaming) or `fetchEventSource` (streaming).

### Non-Streaming Route Scenario

```markdown
# Process Data Route

**Method:** POST
**Path:** /projects/behaviors/process-data/routes

## Description

Processes uploaded data and returns results.

## Behavior

- Implements: Process Data

## Input

- fileId: string - ID of the uploaded file

## Returns

- success: boolean
- data: ProcessedResult

## Scenarios

### Process successfully

#### Input
fileId: "file-123"

#### Response
{ success: true, data: { processedAt: "...", items: [...] } }

### Invalid file

#### Input
fileId: ""

#### Response
{ success: false, error: "File ID is required" }
```

### Streaming Route Scenario

For streaming routes, use `Emit:` to describe events sent over the stream:

```markdown
# Generate Specification Route

**Method:** POST
**Path:** /projects/behaviors/generate-spec/routes

## Description

Generates a project specification incrementally.

## Behavior

- Implements: Generate Specification

## Input

- prompt: string - user description of the project

## Emitted Events

- token - partial generated text
- complete - generation finished

## Completion

- Success: emits `complete`, then closes stream
- Error: emits `error`, then closes stream

## Scenarios

### Generate specification successfully

#### Input
prompt: "Project management app"

#### Stream
* Emit: token - "# Project Management App"
* Emit: token - "\n## Pages"
* Emit: complete - ""

### Generation fails

#### Input
prompt: ""

#### Stream
* Emit: error - "Prompt is required"
```

---

## 14. Workflow Specification Format

Workflow specifications describe **durable, multi-step background processes** that survive failures and can resume from checkpoints. They are implementation-agnostic and can be realized using systems like Inngest, Trigger.dev, or useworkflow.

### Purpose

Workflow specifications answer:
- What behavior does this workflow implement?
- What input does it accept?
- What steps execute durably?
- What gets persisted at each checkpoint?
- What are the success and failure outcomes?

### When to Use Workflows

Use a workflow instead of an action when:
- The process is long-running (seconds to days)
- Failure recovery is critical (must resume, not restart)
- Multiple external calls need atomic checkpointing
- The process involves waiting (sleep, webhooks, external events)

### Structure

A workflow specification consists of:
1. A heading naming the **workflow**
2. A short description explaining why durability is needed
3. The **Behavior** it implements
4. **Input** it accepts
5. **Steps** - ordered, atomic units with what each persists
6. **Completion** - success and failure outcomes
7. **Scenarios** showing step-by-step execution

### Steps Section

Each step represents a durable checkpoint. If the workflow fails after a step completes, it resumes from the next step, not from the beginning. Include:
- What the step does
- What it persists (the checkpoint data)
- Optional retry policy if non-default

### Scenario

```markdown
# Process Order Workflow

Handles order processing with payment and fulfillment. Requires durability because payment and shipping are external calls that must not be duplicated on retry.

## Behavior

- Implements: Process Order

## Input

- orderId: string - ID of the order to process

## Steps

### 1. Validate Order
Checks order exists and is in valid state for processing.
- Persists: validatedOrder

### 2. Process Payment
Calls payment integration to charge the customer.
- Persists: paymentResult
- Retry: 3 attempts with exponential backoff

### 3. Reserve Inventory
Reserves items in the warehouse system.
- Persists: reservationId

### 4. Send Confirmation
Sends order confirmation email to customer.
- Persists: emailSent

## Completion

- Success: Order status set to "confirmed", customer notified
- Failure: Order status set to "failed", payment reversed if charged, admin notified

## Scenarios

### Process order successfully

#### PreDB
orders:
id, status, total
1, pending, 99.00

payments:
id, order_id, status
(empty)

#### Steps
* Step: Validate Order completes
  - Persists: { orderId: 1, total: 99.00, items: [...] }
* Step: Process Payment completes
  - Persists: { chargeId: "ch_123", status: "succeeded" }
* Step: Reserve Inventory completes
  - Persists: { reservationId: "res_456" }
* Step: Send Confirmation completes
  - Persists: { emailSent: true }

#### PostDB
orders:
id, status, total
1, confirmed, 99.00

payments:
id, order_id, status
1, 1, succeeded

### Payment fails and workflow compensates

#### PreDB
orders:
id, status, total
1, pending, 99.00

#### Steps
* Step: Validate Order completes
  - Persists: { orderId: 1, total: 99.00, items: [...] }
* Step: Process Payment fails
  - Throws: "Card declined"
* Compensation: Order marked as failed

#### PostDB
orders:
id, status, total
1, failed, 99.00
```

---

# Principles

- Behavior and Automation are the leaves of the Functional hierarchy
- Functional specs describe _what_, Technical specs describe _how_
- Functional specs are hierarchical (Project → Flow → Page → Behavior; Project → Automation)
- Technical specs are a flat catalog (Function, Service, Policy, Model,
  Integration, Component, Hook, Route, Workflow)
- Thin Presentation: the client triggers intent; Controllers adapt transport,
  Services realize business behavior, and Infrastructure performs external effects
- A behavior may have at most one Action, one Route, and one Workflow — each serves a distinct purpose
- Model, Service, Action, and Hook persistence tests use real in-memory SQLite;
  only authentication/framework and external-system boundaries are replaced
- State ownership is always explicit
- Omitted sections are meaningful
- Formats are minimal and consistent

This system is documentation, but also a **design and reasoning tool**.
