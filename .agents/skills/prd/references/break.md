# Break PRD

Read the PRD at the ephemeral buffer path the invoking prompt names,
then break it into issues. This mode does **not** edit the PRD body — it reads the PRD and
produces ephemeral staged issue drafts from it. The CLI parses those drafts, creates the
canonical issue records through the API, and removes the staging files.

- Break the PRD into exactly one issue per named Behavior. Do not combine behaviors into a
  feature issue, add page-wide implementation issues, pad with extras, or invent requirements.
- Each issue is just the title and a brief overview. The **build** skill turns each one into a full plan and implements it later.
- Issues follow this naming convention (use Title Case for behavior and page names, converting kebab-case to space-separated words):
  - Implement [Behavior Name] Behavior in [Page Name] Page
  - Change [Behavior Name] Behavior in [Page Name] Page to [What Change We Want]
  - Fix [Behavior Name] Behavior in [Page Name] Page

## Writing the staged issue drafts

Write each draft as a separate file in the exact ephemeral staging directory the invoking
prompt names (for example `$ISSUES_DIR`, normally
`.epic/sessions/<PRD-ID>/issues/`). These are scratch interchange files, not tracked issue
content or a local source of truth. This skill does not call the API and does not choose
filenames itself: follow the invoking prompt's **Issue File Format** exactly, including any
staging-only metadata it requires. The CLI owns parsing, POSTing the issues, remapping
placeholder identifiers, and deleting the staging directory.

## Using Flows for Ordering and Dependencies

If the PRD includes a **Flows** section or describes user journeys, use it to:

1. **Order issues correctly**: behaviors that appear earlier in a flow are emitted before the
   behaviors that directly follow them.
2. **Populate each issue's `depends_on` field** with direct prerequisites only. Use
   `depends_on: []` when none exist. The build scheduler reads these edges.

Rules for determining dependencies:

- Within a flow, add an edge from each behavior to its immediate preceding behavior. Add a
  different earlier behavior only when the PRD explicitly names it as the direct prerequisite.
- If a behavior appears in multiple flows, combine its immediate predecessors.
- Remove transitive dependencies. For `A → B → C`, write `B: [A]` and `C: [B]`, never
  `C: [A, B]`.
- Reference dependencies by their placeholder issue ID from this batch (e.g. `PROJ-1`), not by title.
- All IDs in `depends_on` must refer to issues created in this same batch.

Order issues in implementation sequence: foundational behaviors before dependent behaviors. Use the Flows section to determine the correct order when available.

## When invoked directly

If nothing names both a PRD buffer and staging directory, tell the user to run
`epic prd break <PRD-id>`. The CLI fetches the DB-owned PRD into an ephemeral buffer, creates
the staging directory, and POSTs the resulting issue records to the backend.
