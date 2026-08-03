---
name: plan
description: Update the ephemeral issue buffer supplied by the Epic CLI with a detailed implementation plan following the canonical issue template. Use when the user wants to plan an issue before implementing it. Triggers on "plan an issue", "plan this issue", or "update the issue with a plan".
---

# Plan

Given the ephemeral issue buffer the invoking CLI phase provides, update it with a detailed
implementation plan. Issue content lives in the Epic database; the buffer is pure Markdown,
contains no YAML lifecycle front matter, and is PATCHed back by the CLI.

- Update the issue buffer by following the `references/issue-template.md` format.

- If no buffer path is provided, do not invent or create an issue file. Run
  `epic issue plan <id>` so the CLI can fetch the DB-owned content and establish the buffer.

- Issues tend to follow this naming convention:
  - Implement [name of the behavior] in [name of the page]
  - Implement [name of the page] components
  - Change [name of the behavior] in [name of the page] to X
  - Fix [name of the bug] in [name of the behavior]
  - Change design of [name of the component/page] in [name of the page] to X

1. **Check the design system**: Read `docs/DESIGN.md` to find where components and tokens are defined, then check those files to identify what can be reused. Note in the plan which components will be used vs. created.
2. Navigate to the page folder if it already exists to understand what is already implemented before writing the plan. Also look at the current `schema.ts` if necessary. Don't change anything, you are only exploring in this phase.
   - **Explore selectively**: open only the files the issue touches or references; never dump whole directories into context (`find ... | xargs cat` is forbidden — it burns tokens and attention). For large files, read the relevant ranges. Quote every path in shell commands (route groups contain parentheses).
3. Update the issue buffer with a plan following the issue template. Only update that
   buffer; do not start implementing yet. Instructions for your plan:
   - If the behavior or component already exists, focus on what needs to change.
   - Make only the most important test cases. The test cases should take inspiration from the Scenarios provided in the Functional Specification when applicable, including Model, Service, Action, and Hook tests.
