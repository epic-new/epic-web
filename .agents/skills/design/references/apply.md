# Apply docs/DESIGN.md

Apply the project's existing visual design specification to the codebase. Read
`docs/DESIGN.md` (the architecture's canonical design-system entry point) and
edit the existing styling so the running app matches its tokens.

## Goal

Apply the design to the project. Decide which files to change and edit them in place so the running app matches the design tokens in `docs/DESIGN.md`.

## Instructions

- Read `docs/DESIGN.md`, then follow every source path it names before editing (component inventory, global CSS, theme files, and component documentation).
- Translate the design tokens into the project's **existing** styling system rather than introducing a new one. Match the project's color format, units, and file structure.
- Cover every section present in `docs/DESIGN.md`: colors, typography, spacing, elevation/shadows, border-radius/shapes, and per-component tokens.
- Edit files in place. Make the smallest set of changes that realizes the design. Do not scaffold a new project or rewrite unrelated code.
- Skip sections that are absent from `docs/DESIGN.md` rather than inventing values.
- Do not commit; the user reviews the diff in git afterward.

## When done

Summarize which files you changed and how each maps back to the design tokens.
