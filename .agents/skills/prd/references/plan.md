# Plan PRD

Given the ephemeral PRD buffer the invoking prompt points you at, draft or refine its body
**in place**. Write the body using the Concepts and Specification Format in `SKILL.md`.

## Process

1. Read the pure-Markdown PRD buffer and its current contents to understand what is already captured. If the body is empty, draft from scratch; otherwise refine and improve what is there.
2. Rewrite the body below the existing `# PRD-N Title` heading, following the
   Specification Format in `SKILL.md`. Do not add YAML front matter.
3. **Do not create a new file** — edit the named buffer in place so the CLI can persist it.
4. **Do not edit the `# PRD-N Title` heading.** Only rewrite the body below it.

## When invoked directly

If nothing in the request names a PRD buffer, tell the user to run
`epic prd plan <PRD-id>` so the CLI can fetch the DB-owned content and provide one.
