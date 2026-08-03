---
name: merge
description: Merge an approved Epic issue branch into the target branch supplied by the CLI harness, resolving safe textual conflicts or aborting cleanly when human judgment is required. Use only for an `epic issue merge` or `epic issue approve` phase.
---

# Merge

Merge an issue only inside the Epic CLI's merge phase.

## Invocation boundary

The repository normally forbids agent-run git commands. This skill is the narrow exception
used by the CLI harness after it has verified the branch and supplied:

- issue id and title;
- feature branch;
- target branch;
- main-repository working directory;
- feature worktree path for read-only reference.

If those inputs are absent, do not run git. Delegate to `epic issue merge <id>` or
`epic issue approve <id>` so the CLI can establish the controlled merge phase.

## Workflow

1. Confirm `pwd` is the supplied main-repository root, never the feature worktree.
2. Confirm the supplied target branch is checked out with
   `git rev-parse --abbrev-ref HEAD`. If it is not, stop non-zero; do not switch branches.
3. Run `git merge --no-ff <feature-branch>`.
4. On success, emit `Merged <feature-branch> into <target-branch> for <issue-id>` and stop.
5. On conflicts:
   - inspect `git status`, the unified conflict diff, and both sides of each file;
   - preserve the issue's feature intent together with valid target-branch changes;
   - resolve only conflicts whose combined result is unambiguous;
   - stage only the resolved paths and run `git commit --no-edit`;
   - emit the success line above.
6. If a binary conflict, contradictory requirement, or other judgment call remains, run
   `git merge --abort`, report the files and reason, and exit non-zero.

## Hard rules

- Run only in the supplied main repository; never mutate the feature worktree.
- Never reset, force-push, rebase, switch branches, or amend unrelated commits.
- Never delete any branch or tag. The CLI owns all worktree and branch cleanup after success.
- Never push. The CLI owns remote synchronization.
- Do not edit ephemeral issue/PRD session buffers or DB-owned lifecycle state during merge.
- Exit non-zero after any failure so the CLI preserves the branch and worktree for recovery.
