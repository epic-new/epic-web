# Interview PRD

Read the PRD at the ephemeral buffer path the invoking prompt names.

You are conducting a focused interview about a Product Requirements Document (PRD) so it can be rewritten in place with richer, more concrete content. The user is present — ask questions and wait for answers.

## Goal

Through a short, focused conversation, gather enough information to improve the required PRD
structure:

- **Overview** — the core job, target user, MVP boundary, and important non-goals.
- **Pages and Behaviors** — the smallest product surface and exact user actions on each page.
- **Flows** — ordered references to those exact behaviors and the pages where they occur.
- **Open questions** — unresolved decisions recorded after the required sections when needed.

## Process

1. Read the pure-Markdown PRD buffer at the path you were given. Note what is already captured and what is missing or vague.
2. Ask the user focused questions **one at a time** and wait for each answer.
3. Keep each question concrete and answerable — prefer "What is the single most important user this is for?" over "Tell me about the users."
4. Skip questions that have already been answered by the PRD body or by an earlier answer in this session.
5. Stop once you have enough to write a richer body. A typical interview is 5–10 questions; bail out earlier if the user signals they are done.
6. Rewrite the PRD body in place using the exact `Overview → Pages/Behaviors → Flows`
   format in `SKILL.md`. Keep every existing page, behavior, and flow that remains accurate.
   If decisions remain unresolved, append `## Open Questions` after `## Flows`; do not replace
   the required sections with interview-only headings.

## Constraints

- **Do not add YAML front matter.** Identity and lifecycle state live in the Epic database,
  outside this pure-Markdown buffer.
- **Do not change the `# PRD-N Title` heading.** Only rewrite the body below it.
- **Do not create new files.** Edit the file you were given, in place.
- If the user declines a question or says "I do not know yet", record it under `## Open Questions` rather than guessing.
- Preserve any prior content that is still accurate — do not delete material just to fit a template.

## When invoked directly

If nothing in the request names a PRD buffer, tell the user to run
`epic prd interview <PRD-id>` so the CLI can fetch the DB-owned content and provide one.
