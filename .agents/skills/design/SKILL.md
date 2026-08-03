---
name: design
description: Manage the project's docs/DESIGN.md visual design spec (google-labs-code/design.md format). Works in two modes — generate docs/DESIGN.md from a description, or apply it to the project's UI by translating its tokens into the existing styling system. Use when the user wants to author, regenerate, or roll out the project's design system. Triggers on "generate the design", "create a DESIGN.md", "apply the design", or "roll out the design tokens".
---

# Design

Manage the project's `docs/DESIGN.md` — the canonical visual design-system entry
point named by the repository architecture. This skill works in two modes; pick
the mode first, then follow its reference, using the shared format below.

This mirrors the `epic design generate` and `epic design apply` CLI commands, merged into one skill. (The `epic design new` scaffold just writes an empty file and needs no skill.)

## Choosing the mode

- **generate** — author the spec. The user gives a **description** of the brand/product and wants `docs/DESIGN.md` written (or overwritten) from it. Output is the document itself. Follow `references/generate.md`.
- **apply** — roll the spec out. `docs/DESIGN.md` already exists and its tokens should be translated into the project's actual styling (CSS, theme files, Tailwind config, component styles). Output is **code changes**, not the spec. Follow `references/apply.md`.

If the request gives a description and wants the spec written, it is **generate**. If it asks to apply / roll out / realize the existing `docs/DESIGN.md` in the app, it is **apply**. If genuinely ambiguous, ask which one before starting.

## The DESIGN.md format (both modes)

`docs/DESIGN.md` follows the [google-labs-code/design.md](https://github.com/google-labs-code/design.md) open spec. It is **visual only** — never include system or architecture design (data models, API contracts, module boundaries).

Canonical sections, in this exact order. Only include a section when there is enough to fill it meaningfully; omit the rest rather than inventing placeholder defaults:

```
## Overview

Brand personality, target audience, and emotional tone in a few sentences.

## Colors

Primary, secondary, neutral, and semantic palettes with hex codes and usage rules.

## Typography

Font families, the size scale, weights, and line heights.

## Spacing

The base unit and the named scale values built from it.

## Elevation & Depth

Shadow tokens (or the flat-design alternative if the brand is flat).

## Shapes

Border-radius conventions across components.

## Components

Key component tokens — for each component list values like backgroundColor, textColor, typography, rounded, padding, etc.
```

Use concrete, usable values: real hex codes, named font families, numeric scales. Keep it tight and practical — an MVP design system, not an exhaustive style guide.

## References

- `references/generate.md` — write a complete `docs/DESIGN.md` from a description.
- `references/apply.md` — apply `docs/DESIGN.md` to the project's styling.
