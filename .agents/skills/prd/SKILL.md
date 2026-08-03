---
name: prd
description: Author and break down a Product Requirements Document (PRD), capturing the MVP pages, behaviors, and flows. Works in four modes — generate a brand-new PRD from a description, plan (fill in / refine) the body of an existing PRD in place, interview the user to enrich a PRD through guided Q&A, or break an existing PRD into implementation issues. Use when the user wants to spec out a new product or feature, flesh out a PRD, or turn a PRD into issues. Triggers on "create a PRD", "generate a PRD", "write a PRD", "plan this PRD", "interview the PRD", "break the PRD into issues", or "spec out this product".
---

# PRD

Author and break down a Product Requirements Document. PRD content lives in the Epic
database, not in tracked `.epic/prds/*.md` files. For an agent phase, the CLI fetches that
content into an ephemeral, pure-Markdown session buffer, names its absolute path in the
prompt, PATCHes edits back, and discards the buffer. Always use that exact path; never invent
a second PRD path or add YAML lifecycle front matter. This skill works in four modes. Pick
the mode first, then follow its reference, using the shared concepts and format below for
modes that write the PRD body.

This mirrors the `epic prd generate`, `epic prd plan`, `epic prd interview`, and `epic prd break` CLI commands, merged into one skill.

## Choosing the mode

- **generate** — there is no authored PRD yet. The user hands you a product or feature **description** and wants a new PRD created from scratch. The PRD record and ephemeral buffer are created for you; you only write the Markdown document. → Follow `references/generate.md`.
- **plan** — a PRD already exists and its body should be drafted or refined **in place**. → Follow `references/plan.md`.
- **interview** — a PRD already exists and the user wants to enrich it through a guided, one-question-at-a-time conversation before rewriting the body in place. → Follow `references/interview.md`.
- **break** — a PRD already exists and the user wants it turned into implementation **issues**. This mode reads the PRD buffer and writes issue drafts into the ephemeral staging directory the invoking prompt names; the CLI creates the DB records and removes the staging files. It does not edit the PRD body. → Follow `references/break.md`.

Route by what the user asks for:

- "break the PRD" / "turn it into issues" / `prd break` → **break**.
- "interview the PRD" / "interview me about this PRD" → **interview**.
- A description with no existing PRD → **generate**.
- An existing PRD to flesh out / refine → **plan**.

If it is genuinely ambiguous, ask which one before starting.

## Shared concepts

- Capture an **MVP** — only the most essential pages and behaviors. Iterate later.
- Focus on the product's core **job to be done**.
- **Authentication is already implemented.** The template ships sign-up, sign-in, and sign-out (better-auth) — pages, behaviors, and tests included. Do **not** add an Authentication page or sign-up/sign-in/sign-out behaviors to the PRD; they already exist. Spec only the product-specific surface.
- A **Behavior** is an action the user can take on a Page.
- A **job story** focuses on the job a user is trying to accomplish rather than the user themselves, emphasizing the context, motivation, and desired outcome:

  ```
  When <situation>, I want to <motivation>, so I can <expected outcome>.
  ```

- A **Flow** is a user workflow that connects behaviors across pages in order. Flows establish
  implementation order, but they do not imply that a step depends on every earlier step. The
  **break** mode creates only direct dependency edges, normally from each step to its immediate
  predecessor in that flow, and removes transitive edges.

## Specification Format (both modes)

Write the PRD **body** using this exact structure below its `# PRD-N Title` heading. The
buffer is pure Markdown; identity and lifecycle state live in the database, not front matter.

```
## Overview

[Brief description of the core job, target user, MVP boundary, and important non-goals]

## [page-name]

[Brief page description and when the user visits it]

### Behaviors

- **[behavior-name]**: [Single sentence describing what this behavior does]
- **[behavior-name]**: [Single sentence describing what this behavior does]

## [page-name]

[Brief page description]

### Behaviors

- **[behavior-name]**: [Description]

## Flows

### [Flow Name]
[One sentence describing the user goal]

1. [behavior-name] -- [page-name]
2. [behavior-name] -- [page-name]
3. [behavior-name] -- [page-name]

### [Flow Name]
[One sentence describing the user goal]

1. [behavior-name] -- [page-name]
2. [behavior-name] -- [another-page-name]
```

Keep it tight: every page earns its place by enabling at least one behavior in a flow; every
behavior maps to a concrete user goal; every flow step names one of those exact behaviors.
Once the PRD is written, the **break** mode creates exactly one implementation issue per
behavior.

## References

- `references/generate.md` — write the body of a brand-**new** PRD from a description.
- `references/plan.md` — draft or refine the body of an **existing** PRD in place.
- `references/interview.md` — interview the user to enrich an **existing** PRD, then rewrite its body in place.
- `references/break.md` — break an **existing** PRD into implementation issues.
