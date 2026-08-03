---
name: review
description: Review an Epic issue implementation against its canonical Functional and Technical Specifications, using the comparison base supplied by the CLI harness and emitting a structured read-only report. Use for `epic issue review` or when the user asks to review an issue branch against its spec.
---

# Review

Review one issue's implementation against its DB-backed specification. The review harness
fetches the issue into a read-only ephemeral session buffer (`writesContent: false`), so
findings belong in the review transcript/report; do not edit that buffer.

## Invocation boundary

The repository normally forbids agents from running git commands because the Epic CLI owns
repository workflow. The only exception in this skill is an active `epic issue review` phase
whose harness supplies all of the following:

- the absolute ephemeral issue-buffer path;
- the worktree working directory;
- the comparison base or target branch/ref.

In that harness-owned phase, use read-only `git diff` and `git log` commands only. If any input
is missing, do not assume `main` and do not run git; tell the user to invoke
`epic issue review <id>` so the CLI can provide the boundary.

## Workflow

1. Read the pure-Markdown issue buffer without editing it. Lifecycle state lives in the
   database; there is no YAML front matter.
2. Read the canonical body:
   - `# Functional Specification` → one `## Behavior` → named Rules and Scenarios;
   - `# Technical Specification` → the units and scenarios that own implementation contracts;
   - `# Tasks` and `# Notes`, when present.
3. From the supplied worktree, inspect the implementation relative to the supplied base:
   - `git diff --name-status <base>...HEAD`
   - `git diff --stat <base>...HEAD`
   - `git log --oneline <base>..HEAD`
   - selective ranges from `git diff <base>...HEAD`
4. Open the changed files needed to judge the Rules, Scenarios, technical contracts, and
   relevant tests. Do not judge from commit messages alone.
5. Emit the review report using the structure below.

## Review report

```markdown
# Review Report

## Summary

[What the branch changes and whether it fulfills the Behavior.]

## Acceptance Criteria

- [x] Rule: [Rule Name] — [evidence]
- [ ] Scenario: [Scenario Name] — [missing or uncertain evidence]

## Files Changed

- `path/to/file.ts` — [purpose in this issue]

## Risks / Follow-ups

- [Concrete concern or uncovered gap]
```

Create one checklist item for every Functional Rule and Functional Scenario. Check an item
only when the code and tests provide clear evidence. Use `None.` when there are no risks.

## Reporting rules

- Print the report to the phase transcript/stdout. Do not write a `# Review` section into the
  issue buffer: the harness does not persist review-buffer edits.
- Do not modify the issue buffer's Functional Specification, Technical Specification, Tasks,
  Notes, or existing Review content.
- Do not edit implementation files, commit, add, push, merge, rebase, reset, or switch
  branches. Review is documentation-only; its git exception is read-only.
- End with `Review complete for <issue-id>`.
