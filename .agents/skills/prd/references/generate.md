# Generate PRD

Given the product or feature **description** the user provides, write a new Product
Requirements Document. Write the body using the Concepts and Specification Format in
`SKILL.md`.

## Writing the buffer

This skill does not create the PRD record, assign it a number, or pick a path — the invoking
command already did that before handing you the description. The invoking prompt names the
ephemeral PRD buffer to write, normally `.epic/sessions/<PRD-ID>/prd.md`. It is pure Markdown
and contains no YAML lifecycle front matter.

1. Read the buffer at the path the invoking prompt names — it currently holds just the
   description as plain text.
2. Replace it with the authored Markdown document. Start with a `# PRD-N [Title]` heading
   using the identifier supplied by the prompt/buffer and a concise title drawn from the
   description.
3. Write the body below the heading, following the Specification Format in `SKILL.md`.

Do not create a new file. The CLI PATCHes this buffer back to the Epic database.

## When invoked directly

If nothing in the request names a buffer to write, tell the user to run
`epic prd generate "<description>"`; the CLI will create the DB record and establish the
ephemeral buffer for the agent phase.
