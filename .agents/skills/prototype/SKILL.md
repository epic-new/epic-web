---
name: prototype
description: Scaffold a numbered, throwaway UI prototype to quickly explore a feature in isolation. Use when the user wants to mock up, sketch, or rapidly prototype a page or screen without wiring it into the real app. Triggers on "prototype this", "mock up a", "create a prototype", or "sketch a UI for".
---

# Prototype

Scaffold a numbered prototype folder, write its `prompt.md`, then build the prototype
file the prompt describes. A prototype is a throwaway, self-contained exploration of
one interaction — prioritize getting the core interaction right over completeness, and
do not wire it into the real app.

This mirrors the `epic prototype new` CLI command: it picks the next numbered folder,
records the description in `prompt.md`, and creates `page.tsx` (web) or `screen.tsx`
(terminal).

## Choosing the type

There are two kinds of prototype:

| Type | Root | File created | Stack |
|------|------|--------------|-------|
| **web** | `app/prototypes/` | `page.tsx` | Next.js + React + Tailwind |
| **terminal** | `prototypes/` | `screen.tsx` | Ink + React |

Decide the type from the request:

- Use `--web` / "web" / "page" / anything that renders in a browser → **web** (default).
- Use `--terminal` / "terminal" / "TUI" / "CLI screen" → **terminal**.

If the request is ambiguous, default to **web** (this is a web app template). Only ask
the user when genuinely unsure between the two.

## Scaffolding steps

1. Determine the type (see above) and its root directory (`app/prototypes/` for web,
   `prototypes/` for terminal).
2. Find the next number: scan the root for existing `prototype-NN` folders and pick the
   next unused integer, **zero-padded to two digits** (`01`, `02`, …). Start at `01` if
   the root is empty or missing.
3. Create the folder `{root}/prototype-NN/`.
4. Write `{root}/prototype-NN/prompt.md` containing the user's description verbatim as
   the first line (this is what `epic prototype list` reads back).
5. Build the prototype file following the matching instructions below. Substitute the
   real folder path for `{{prototypeDir}}` and the user's request for `{{description}}`.
6. Report the path created and how to run it:
   - **web**: route is `/prototypes/prototype-NN`.
   - **terminal**: run with `bun prototypes/prototype-NN/screen.tsx`.

## Web prototype instructions

Create `{{prototypeDir}}/page.tsx`:

1. Create `{{prototypeDir}}/page.tsx` — a Next.js page component (React, client or
   server as appropriate).
2. Implement the described feature as a working prototype. Prioritise correctness of
   the core interaction over completeness.
3. Use Tailwind CSS for styling. Match the existing design language if one is present in
   the repo (check `docs/DESIGN.md`, `globals.css`, and `components/ui/`).
4. Do not modify other pages, layouts, or shared components unless strictly necessary
   for the prototype to render.

## Terminal prototype instructions

Create `{{prototypeDir}}/screen.tsx`:

1. Create `{{prototypeDir}}/screen.tsx` — an Ink/React component that implements the
   described feature.
2. Add `#!/usr/bin/env bun` as the first line and a default export that renders the
   screen with `render(<Screen />)` from `ink`.
3. Build the UI from Ink primitives (`Box`, `Text`, `useInput`, etc.). Keep the
   prototype self-contained — no extra UI dependencies are installed.
4. Implement the core TUI interaction described. Prioritise correctness of the main flow
   over completeness.
5. Do not modify other screens or shared components unless strictly necessary for the
   prototype to run.

## Notes

- Prototypes are throwaway. Keep them isolated — never edit shared components, actions,
  models, or routes to make a prototype work.
- The reference prompt templates this skill is built from live in
  `references/web.md` and `references/terminal.md`.
