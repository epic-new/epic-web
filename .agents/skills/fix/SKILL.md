---
name: fix
description: Repair a web issue's implementation so its failing verify scenarios pass on the next verify run, applying the smallest change per failure without touching passing scenarios. Use after a verify run reports failing scenarios, or when the user asks to fix failing checks for an issue. Triggers on "fix the failing scenarios", "make verify pass", or "repair this issue".
---

# Fix

You are repairing a web issue's implementation so that its failing verify scenarios pass on the next verify run. Plan and execute have already run in this session, so you have the ephemeral issue buffer, the plan, and the implementation context loaded — focus only on the failures the user hands you.

## Workflow

1. Re-read the issue buffer's `## Behavior: <name>` block to ground yourself in the rules and scenarios the failures are derived from.
2. For each failing scenario:
   - Locate the rule or scenario by name in the issue's `### Rules` / `### Scenarios` sections.
   - Read the relevant frontend code, backend handlers, and any database / fixture state the scenario assumed.
   - Form a hypothesis for *why* it failed from the one-line reason — wrong text on screen, missing element, failed network call, wrong PostDB row, etc.
   - Apply the smallest change that makes the scenario's `Then:` / `Check:` assertions hold.
3. After each fix, exercise the affected flow yourself (navigate to the page in the browser and walk the UI) so you have firsthand confirmation the scenario now passes.
4. When all failing scenarios are addressed, run the unit test suite (`bun run test`) to confirm nothing regressed.

## Scope rules

- **Do not** touch the passing scenarios. Verify already greenlit them; rewriting their UI or handlers re-opens the door to regressions.
- **Do not** edit the issue buffer body — its rules and scenarios are the contract you're
  satisfying, not the thing being changed. Lifecycle state lives in the Epic database and
  is not part of the pure-Markdown buffer.
- **Do not** introduce unrelated refactors, new abstractions, or speculative cleanups. Each fix is the minimal diff that flips its scenario from FAIL to PASS.
- If a failing scenario reflects an ambiguity in the spec rather than a code defect, stop and surface the ambiguity instead of guessing.

## Reporting

After applying fixes, summarize each failing scenario as one line: `<scenario name> — <what was wrong> -> <what you changed>`. Then list any tests or browser checks you ran with their pass/fail outcome.

The CLI re-runs verify after this session ends; you do not need to drive the browser verification pass yourself.
