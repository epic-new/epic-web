// Loaded FIRST by vitest.setup.ts, before any "@/..." import.
//
// Static imports are hoisted, so assigning process.env inside vitest.setup.ts
// runs too late: `import { db } from "@/db"` executes db/index.ts — which
// creates the singleton client from the current DATABASE_URL — before any
// statement in the setup body. Forcing the in-memory URL here, in a module
// imported ahead of "@/db", guarantees unit tests run on an isolated in-memory
// database instead of test.db. After loading environment files, db/index.ts
// independently refuses to initialize a test client unless this value is still
// exactly ":memory:".
//
// (db/index.ts overlays .env.test with override:true on import; new projects
// have no .env.test, so nothing clobbers this. In the template's own checkout,
// keep DATABASE_URL out of .env.test for the same reason.)
process.env.DATABASE_URL = ":memory:";
