---
name: verify
description: Verify that an implemented issue works by exercising its behavior in a real browser with agent-browser, checking every scenario from the issue's specification. Use after implementing an issue, or when the user asks to verify/confirm a behavior works. Triggers on "verify this issue", "verify the behavior", or "check the issue works".
---

# Verify

You are verifying that a web issue's implementation is working correctly by exercising it in the browser.

Use `npx agent-browser` to drive the browser (fetched on demand — no install needed). Verify runs against the **PREVIEW** — the application URL given in the prompt. In a remote sandbox that is the preview's **public HTTPS URL** (e.g. `https://8080-<sandbox>.proxy.epic.new`); locally it is the per-issue dev server on `http://localhost:<port>`.

**Never rewrite the URL to plain-HTTP `localhost` in a remote sandbox.** The preview's auth cookies are `Secure`/`SameSite=None`/`Partitioned` (its Better Auth base URL is the HTTPS proxy domain) and Chromium silently drops them over plain-HTTP `localhost` — sign-in appears to succeed but no session cookie sticks and every protected page bounces to `/signin`. Driven through the HTTPS URL itself, the same cookies work.

There is no separate verify server to boot: the preview is already running (supervisor-managed in the sandbox; `epic preview start` locally). If the URL doesn't respond, wait a moment and retry — never start a second dev server.

## Workflow

1. Read the issue file the user provides. Locate its `# Functional Specification` section.
2. Inside it, find the `## Behavior: <name>` block. Treat that block as the source of truth for what to verify.
3. Enumerate **every scenario under `### Scenarios`**. Each `#### <scenario-name>` is one verifiable scenario — a worked walkthrough with optional `#### PreDB`, required `#### Steps` (using `Act:` / `Check:` keywords), and optional `#### PostDB`. Follow the Steps in order.

   The `### Rules` block is **not** verified independently. Rules are declarative `When:` / `Then:` context that tells you what a scenario's `Check:` assertions mean — do **not** emit a PASS/FAIL line for a rule. Every line in the report corresponds to a Scenario.
4. Open the browser and navigate to the application.
5. For each scenario, in order:
   - **Assign a distinct test user to the scenario** (see [Test Users](#test-users)). For the Nth scenario, use `userSeeds[(N - 1) % userSeeds.length]`. Using a different user per scenario keeps the scenarios isolated so data created by one doesn't bleed into the next.
   - **If the scenario requires an authenticated user, sign in as that assigned test user first** (via the app's signin page) before driving its steps. Skip this only when the scenario is itself an unauthenticated flow (e.g. signin/signup, public landing pages), in which case use the credentials directly as the scenario dictates.
   - If the scenario has `#### PreDB`, **set the database into that state before driving the Steps** (see [Setting up scenario state](#setting-up-scenario-state)). This is setup only: insert the rows the block names; you do not read the database back afterward.
   - **Start this scenario's recording**, once the user is signed in and any `PreDB` state is set, and immediately before the first `Act:` step:
     `npx agent-browser record restart $EPIC_MEDIA_DIR/scenario-<N>.webm`
     `<N>` is the scenario's 1-based position, so scenario 3 always writes `scenario-3.webm`. Call this exactly **once per scenario** — never mid-scenario, and never twice with the same file name. Recording it after setup keeps sign-in and seed data out of the video.
   - Drive the UI per the scenario's `Act:` steps. Use `snapshot` to see the page; use the `@e…` refs it prints to `click`, `fill`, `type`, etc.
   - Confirm the scenario's `Check:` assertions match what's actually on screen / in network responses. If the scenario has a `#### PostDB` block, confirm the equivalent outcome **through the UI or network** — do not query the database to assert it.
   - Record: PASS or FAIL, with a one-line reason, and note the recording's file name for the JSON block.
   - **Keep each recording short.** A scenario's video should cover its `Act:` and `Check:` steps and nothing else — aim for under 60 seconds. If a scenario is still running well past that, stop recording (`npx agent-browser record stop`), finish verifying it without video, and omit `video` for that scenario. A missing recording is fine; a huge one is not.

6. After the last scenario, stop recording: `npx agent-browser record stop`. Recordings are only flushed to disk on stop — skipping it leaves the last scenario's file truncated or absent.

## Test Users

**If the prompt contains a "Test credentials" block, use it directly and skip this section entirely** — the harness already read the seeded users; do not `cat` seed files or run `db:seed`.

Fallback (no block in the prompt): the values live in `db/seed/.credentials/user-seeds.<db>.json`, written by `bun run db:seed` and keyed by the database the preview targets. `db/seed/user.seed.ts` exports them as the `userSeeds` array (`email`, `password`, `name`, `userId`; passwords are generated per environment — never assume a default), but it is only a loader — `cat`-ing it shows the loading code, not the credentials. Read the JSON file directly:

```bash
cat db/seed/.credentials/user-seeds.*.json
```

If no such file exists, run `bun run db:seed` (safe to re-run; reconciles in place) with the same `DATABASE_URL` the preview uses (the one in `.env`), then re-read. `bun run db:reset` only when the schema is stale — it drops all data.

- Assign one distinct user per scenario, round-robin by scenario order (`userSeeds[(N - 1) % userSeeds.length]`). One user per scenario keeps data created by one scenario from bleeding into the next. With 5 seeded users, the first five scenarios each get a unique user.
- **One browser session at a time.** Each `--session <name>` is a FULL Chrome instance, and the sandbox has a hard memory cgroup shared with two dev servers — parallel sessions get the OOM killer shooting Chrome and the servers mid-scenario (symptoms: pages stuck on "Loading...", "Under Construction" for routes that exist, sign-ins that never land). Run scenarios sequentially in one session, and when the next scenario needs a different user, `npx agent-browser --session <name> close` the previous session (or just sign out) BEFORE opening the next. Never keep more than one session alive.
- **Never `pkill` the dev/next servers as memory triage** — the preview you are verifying against is one of them; killing it destroys your own test target and its compiled routes. Close browser sessions instead; that's where the memory goes.
- To authenticate, navigate to the signin page and fill the assigned user's `email` and `password`, then submit and confirm the redirect to the authenticated home page before proceeding with the scenario's steps.

## Setting up scenario state

When a scenario has a `#### PreDB` block, put the database into that state **before** driving its Steps. This is setup only — insert the rows the block names; you never read the database back to assert (PostDB checks are confirmed through the UI/network instead).

Use the `PreDB` helper from `lib/db-test` (the same one the unit tests use). Write a throwaway script and run it against the **same database the preview reads** — the `DATABASE_URL` in `.env` (default `file:./db/databases/development.db`):

```bash
cat > /tmp/verify-setup.ts <<'EOF'
import { db } from "@/db";
import * as schema from "@/db/schema";
import { PreDB } from "@/lib/db-test";

await PreDB(
  db,
  schema,
  {
    // rows from the scenario's #### PreDB block, e.g.
    // posts: [{ id: 1, userId: "<assigned user's userId>", title: "First Post" }],
  },
  { wipe: false }, // add rows without clobbering seeded users / other scenarios
);
process.exit(0);
EOF
bun /tmp/verify-setup.ts   # picks up DATABASE_URL from .env — the preview's database
```

- Pass `{ wipe: false }` so PreDB inserts the scenario's rows without deleting the seeded users — sign-in depends on them. Only use the default `wipe: true` (optionally scoped with `{ only: ["<table>"] }`) when the scenario owns that feature table outright and needs a clean slate. **Never wipe the auth/user tables.**
- When a PreDB row needs an owner, reference the assigned test user's `userId` from `db/seed/user.seed.ts`.
- Delete the temp script when done.

## Browser automation with agent-browser

### Prerequisites

In the sandbox, `agent-browser` and its Chrome for Testing build are pre-provisioned in the snapshot — `npx agent-browser` resolves instantly, no install step. Only on a machine where the first command fails with a missing-browser error, provision once:

```bash
npx agent-browser install
```

### Quick start

```bash
# open the browser and navigate to the application URL from the prompt
npx agent-browser open <application-url>
# take a snapshot to see element refs (@e1, @e2, …)
npx agent-browser snapshot
# interact with the page using the @refs from the snapshot
npx agent-browser click @e15
npx agent-browser fill @e5 "user@example.com"
npx agent-browser type @e7 "search query"
npx agent-browser press Enter
# take a screenshot if needed
npx agent-browser screenshot
# close the browser when done
npx agent-browser close
```

### Common commands

- `open [url]` / `goto <url>` — open browser / navigate
- `snapshot` — capture the page with `@e…` element refs (`snapshot -i` for interactive elements only)
- `click @ref` / `hover @ref` — pointer actions
- `fill @ref "<text>"` / `type @ref "<text>"` — input
- `press <key>` — keyboard (Enter, ArrowDown, Tab, …)
- `screenshot` — take a screenshot
- `console` / `network requests` — read console / network
- `close` — close the browser

### Refs go stale after every interaction

Element refs (`@e1`, `@e2`, `@e15`, …) are only valid until the next DOM update. After any
`click`, `fill`, `press`, or navigation, **all previous refs are invalid** — call `snapshot`
again before using any ref on the updated page.

```bash
npx agent-browser fill @e5 "user@example.com"
npx agent-browser snapshot   # required — refs have changed
npx agent-browser fill @e8 "password"  # use refs from the new snapshot
```

Always close the browser when done with `npx agent-browser close`.

## Verification Report

After verifying all scenarios, print a report with exactly this shape:

```
── Verification Report ─────────────────
[PASS] <scenario name>  <one-line reason>
[FAIL] <scenario name>  <one-line reason>
...

Score: <passed>/<total> scenarios passed
```

Grammar rules (so the report parses cleanly the way a test runner's output does):
- One scenario per line. Start the line with the status token `[PASS]` or `[FAIL]` (no leading whitespace).
- Separate `<scenario name>` from `<one-line reason>` with **two or more spaces** (or a tab). The name itself must not contain a run of 2+ spaces.
- Keep each reason on a single line. Brackets, quotes, and slashes inside the reason are fine.
- End with a single `Score: <passed>/<total> scenarios passed` line whose numbers match the report.

If a scenario fails, the one-line reason should describe what was expected vs what actually
happened (missing element, wrong text, error state, etc.). If any scenario fails, hand the
failures to the implementation steps (or the **execute** skill) to fix, then verify again.
