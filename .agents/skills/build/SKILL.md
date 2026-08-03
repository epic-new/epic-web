---
name: build
description: Complete one DB-backed Epic issue by planning and executing it through the CLI, then hand control back for verify/fix and approval. Use when the user asks to build, run, or complete an issue end to end.
---

# Build

Build one issue through the Epic lifecycle. Issue content lives in the Epic database. For
each phase, the CLI fetches it into a gitignored, pure-Markdown session buffer, gives the
agent that buffer's absolute path, PATCHes changes back, and discards the buffer. Never
create a tracked issue file or assume YAML lifecycle front matter exists.

## When the harness names an issue buffer

1. Read that exact ephemeral buffer, including its canonical Functional Specification, Technical
   Specification, Tasks, and Notes.
2. Use the **plan** skill with that buffer. Plan updates only the issue Markdown; it does not
   implement code.
3. Use the **execute** skill with the same buffer to implement the plan in dependency order.
4. Return control to the Epic CLI. Its build lifecycle runs browser verify, supplies failures
   to fix, and moves a passing manual build to review/approval. Do not duplicate those phases
   inside this orchestration skill.

## When no issue buffer is named

Do not guess a session path or create a local issue file.

- To inspect the current DB-owned issue content, run `epic issue show <id> -b`.
- To run the complete lifecycle, use `epic issue build <id>` with only flags shown by
  `epic issue build --help`.
- To run phases separately, use `epic issue plan <id>` followed by
  `epic issue execute <id>`; the CLI owns the ephemeral buffer and content PATCHes.

Never run git commands directly. Worktrees, commits, verification state, content persistence,
and merging are owned by the Epic CLI harness.
