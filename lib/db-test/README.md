# DBTest

Database testing utilities for deterministic state management.

## Utilities

### PreDB

Sets up initial database state before tests with deterministic data.

```typescript
import { PreDB } from '@/lib/db-test';
import { db } from '@/db';
import * as schema from '@/db/schema';

await PreDB(db, schema, {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ],
  records: [
    { id: 1, userId: 1, label: 'First record' }
  ]
});
```

**Features:**
- Clears existing data in specified tables
- Inserts test data in a predictable order
- Handles foreign key relationships
- Works with in-memory SQLite for fast tests

### PostDB

Verifies database state after test execution.

```typescript
import { PostDB } from '@/lib/db-test';
import { db } from '@/db';
import * as schema from '@/db/schema';

await PostDB(db, schema, {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' },
    { id: 3, name: 'Charlie', email: 'charlie@example.com' }  // New user created by test
  ]
});
```

**Features:**
- Compares actual database state with expected state
- Provides detailed diff on mismatch
- Supports partial matching
- Works with in-memory SQLite for fast tests

## Usage Pattern

```typescript
import { describe, it } from 'vitest';
import { PreDB, PostDB } from '@/lib/db-test';
import { db } from '@/db';
import * as schema from '@/db/schema';

describe('User Creation', () => {
  it('should create a new user', async () => {
    // Setup: Define initial state
    await PreDB(db, schema, {
      users: [{ id: 1, name: 'Alice', email: 'alice@example.com' }]
    });

    // Act: Run the code being tested
    await createUser({ name: 'Bob', email: 'bob@example.com' });

    // Assert: Verify final state
    await PostDB(db, schema, {
      users: [
        { id: 1, name: 'Alice', email: 'alice@example.com' },
        { id: 2, name: 'Bob', email: 'bob@example.com' }
      ]
    });
  });
});
```

## Testing

Run tests:

```bash
bun test lib/db-test/tests/
```

## Dependencies

- `drizzle-orm` - Database ORM
- `vitest` - Testing framework
