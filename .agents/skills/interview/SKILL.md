---
name: interview
description: Interview the user about an existing DB-backed issue or PRD, then rewrite the CLI-provided content buffer with richer, more concrete scope, acceptance criteria, goals, and flows before planning. Use when the user wants to flesh out, clarify, or enrich an issue or PRD through guided Q&A. Triggers on "interview me about this issue", "interview the PRD", "flesh out this issue", or "enrich this PRD".
---

# Interview

Conduct a focused, interactive interview about an existing **issue** or **PRD**, then rewrite
the CLI-provided content buffer with the richer content the conversation surfaces. The user
is present — ask questions one at a time and wait for each answer. Never invent answers.

This mirrors the `epic issue interview` and `epic prd interview` CLI commands, merged
into one skill. Issue and PRD content lives in the Epic database. The CLI fetches the
Markdown into an ephemeral session buffer, gives the agent its exact path, then PATCHes
edits back and discards the buffer. The two targets share the same shape (read the content
→ find gaps → ask focused questions one at a time → rewrite the body in place, keeping the
heading) but enrich different sections.

## Choosing the target

Neither an issue nor a PRD is owned by a tracked file. This skill never picks a path itself;
it reads and rewrites only the ephemeral issue or PRD buffer the invoking prompt names,
normally under `.epic/sessions/<ID>/`.

Decide what is being interviewed from the request and from how the invoking prompt
describes the file:

- An **issue** — the invoking prompt hands you an issue buffer, or the user says "issue".
  → Follow `references/issue.md`.
- A **PRD** — the invoking prompt hands you a PRD buffer, or the user says "PRD". → Follow
  `references/prd.md`.

If it is ambiguous which target or which type, ask the user before starting.

**If nothing names a buffer at all**, tell the user to run `epic issue interview <id>` or
`epic prd interview <PRD-id>` so the CLI can fetch the content and establish the buffer.

## Workflow (both targets)

1. Read the target buffer in full. It is pure Markdown: a top-level heading and body,
   with no YAML lifecycle front matter.
2. Identify the gaps worth asking about (the matching reference lists what to probe).
3. Ask the user **one focused question at a time** and wait for the answer. Keep
   questions concrete and answerable. Cap at roughly 5–10 questions; stop early once the
   file is clearly scoped or the user signals they are done.
4. Rewrite the buffer body **in place** at its existing path, following the rules in the
   matching reference.
5. Print a short confirmation summarizing what changed, then stop.

## Hard rules (both targets)

- **Do not add YAML front matter.** Identifiers and lifecycle state live in the database;
  status, assignee, dependencies, and other lifecycle fields stay outside this pure-Markdown
  session buffer.
- **Keep the existing top-level heading** (`# <ID> <title>` for issues, `# PRD-N Title`
  for PRDs) unless the user explicitly asks for a rename.
- **Edit the named buffer in place — do not create new files.**
- Preserve prior content that is still accurate; don't delete material just to fit a
  template.
- Keep issues in the canonical `Functional Specification → Behavior → Rules → Scenarios`
  and `Technical Specification → Tasks → Notes` shape. Do not add a parallel acceptance-
  criteria format.
- Keep PRDs in the canonical `Overview → Pages/Behaviors → Flows` shape. Record unresolved
  decisions under `## Open Questions` after `## Flows` rather than replacing those sections.

## References

- `references/issue.md` — full prompt for interviewing an **issue** (enriches scope,
  acceptance criteria, constraints).
- `references/prd.md` — full prompt for interviewing a **PRD** (enriches goals,
  non-goals, user flows, open questions).
