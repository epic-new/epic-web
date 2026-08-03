# Generate docs/DESIGN.md

Given the brand/product **description** the user provides, write a complete
`docs/DESIGN.md` visual design spec. Use the format and canonical sections in
`SKILL.md`.

## Rules

- Write the complete file in one pass. Use the canonical sections from `SKILL.md`, in that exact order.
- If `docs/DESIGN.md` already exists as a lightweight source index, preserve its
  useful inventory paths in the generated document so UI skills can still find
  existing components, tokens, and component documentation.
- Only include a section if the description gives you enough to fill it meaningfully. Omit any section you cannot infer rather than filling it with placeholder copy or generic defaults.
- Use concrete, usable values: real hex codes for colors, named font families, numeric scales for spacing/typography, etc.
- Keep it tight and practical — this is an MVP design system, not an exhaustive style guide.
- Visual only — no system or architecture design.
