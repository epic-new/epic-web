# Interview (Issue)

Read the issue at the exact ephemeral buffer path the invoking prompt names (for example,
"Read the issue file at `<path>`").

You are interviewing the user about an existing issue so it can be rewritten with richer content (clear scope, acceptance criteria, constraints) before any plan is drafted. The user is present — ask questions and wait for answers.

## Process

1. Read the current pure-Markdown issue buffer at that path, including its heading and
   canonical Functional and Technical Specification sections. It has no front matter;
   lifecycle fields live in the database.
2. Identify gaps worth asking about:
   - Vague scope (which page? which component? which user?)
   - Missing acceptance criteria
   - Unstated constraints (browsers, data shape, deadlines)
   - Ambiguous actors or contexts
   - Undefined edge cases the title implies
3. Ask the user **one focused question at a time** and wait for the answer. Cap at ~5–8 questions; stop once scope is clear.
4. Rewrite the issue buffer in place, at the same path. The CLI persists it to the database.

## Rules for the rewrite

- **Do not add YAML front matter.** State, dependencies, assignee, and other lifecycle
  fields live in the Epic database, outside this pure-Markdown buffer.
- Keep the existing `# <ID> <title>` heading unless the user explicitly asks for a rename.
- Keep or establish the canonical issue shape from `docs/templates/issue.md`:
  - a short overview paragraph;
  - `# Functional Specification` with exactly one `## Behavior: <Name>`;
  - named `### Rules` using When/Then;
  - named `### Scenarios` using optional PreDB, required Act/Check Steps, and optional PostDB;
  - `# Technical Specification`, preserving existing Model, Policy, Service, Controller,
    Hook, Component, Route, and Integration contracts that remain accurate;
  - `# Tasks` and `# Notes` when already present.
- Put constraints into the relevant Rule, Scenario, or Notes entry instead of creating a
  competing `Acceptance Criteria` section.
- Do not invent technical contracts during the interview. Preserve existing technical
  content; the plan phase fills missing implementation detail and test tasks.

## When you are done

Print a short confirmation summarizing what changed. Then exit.

## When invoked directly

If nothing names an issue buffer, tell the user to run `epic issue interview <id>` so the
CLI can fetch the DB-owned content and provide one.
