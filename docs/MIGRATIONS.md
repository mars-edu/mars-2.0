# Convex Migrations System

## Overview

This project uses an automated migration system for Convex database schema and data changes. Migrations are automatically run during the build process to ensure data consistency before deployment.

## How It Works

### 1. Migration Storage

Migrations are stored in the `convex/migrations/` folder as `.txt` files.

**Naming Convention:**
```
YYYYMMDD_HHMMSS_description.txt
```

**Example:**
```
20241224_055500_cleanup_education_schedules.txt
```

### 2. Migration File Format

Each migration file contains a single line with the Convex function path to execute:

```txt
migration/actions:cleanupEducationSchedules
```

### 3. Automatic Execution

Migrations run automatically during:
- **Production builds**: `npm run build:convex`
- **Manual execution**: `npm run migrate`

### 4. Execution Order

The migration runner:
1. Finds all `.txt` files in `convex/migrations/`
2. Sorts them alphabetically (timestamp ensures chronological order)
3. Executes each migration in order
4. Logs results to `migrations.log`
5. Displays a summary

## Creating a New Migration

### Step 1: Write the Migration Function

Create a migration action in `convex/migration/actions.ts`:

```typescript
// Internal mutation (does the actual work)
export const myMigrationInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Migration logic here
    console.log("[Migration] Running my migration...");

    // Your code here

    return { success: true, message: "Migration complete" };
  },
});

// Public action (wrapper for CLI)
export const myMigration = action({
  args: {},
  handler: async (ctx) => {
    console.log("[Migration] Starting my migration...");

    const result = await ctx.runMutation(
      internal.migration.actions.myMigrationInternal,
      {}
    );

    console.log(`[Migration] ${result.message}`);
    return result;
  },
});
```

### Step 2: Create Migration File

Create a new file in `convex/migrations/` with the timestamp naming convention:

```bash
# Get current timestamp
date +%Y%m%d_%H%M%S

# Create migration file
echo "migration/actions:myMigration" > convex/migrations/20241224_120000_my_migration.txt
```

### Step 3: Test Locally

Test your migration on dev environment:

```bash
# Run single migration
npx convex run migration/actions:myMigration

# Or run all migrations
npm run migrate
```

### Step 4: Commit and Deploy

```bash
git add convex/migrations/20241224_120000_my_migration.txt
git add convex/migration/actions.ts
git commit -m "feat: add migration for X"
git push
```

The migration will run automatically during `npm run build:convex`.

## Migration Runner Script

### Location
`scripts/run-migrations.sh`

### Features
- ✅ Runs all migrations in chronological order
- ✅ Colored console output for easy reading
- ✅ Logs to `migrations.log` file
- ✅ Handles errors gracefully
- ✅ Interactive prompts in non-CI environments
- ✅ Summary report after completion
- ✅ Idempotent (safe to run multiple times)

### Usage

```bash
# Run all migrations
./scripts/run-migrations.sh

# Or use npm script
npm run migrate
```

### Output Example

```
[INFO] Starting Convex migrations...
[INFO] Found 2 migration(s) to run
[INFO] Running migration: 20241224_055500_cleanup_education_schedules
[INFO]   → Executing: npx convex run migration/actions:cleanupEducationSchedules
[SUCCESS]   ✓ Migration completed: 20241224_055500_cleanup_education_schedules

[INFO] Running migration: 20241224_120000_my_migration
[INFO]   → Executing: npx convex run migration/actions:myMigration
[SUCCESS]   ✓ Migration completed: 20241224_120000_my_migration

[INFO] =========================================
[INFO] Migration Summary:
[SUCCESS]   Successful: 2
[INFO]   Failed: 0
[INFO]   Total: 2
[INFO] =========================================
[SUCCESS] All migrations completed successfully!
```

## Build Process Integration

### Updated build:convex Command

```json
{
  "scripts": {
    "build:convex": "npx convex codegen && ./scripts/run-migrations.sh && npx convex deploy --cmd 'npm run build'"
  }
}
```

### Execution Flow

1. **Generate TypeScript types**: `npx convex codegen`
2. **Run migrations**: `./scripts/run-migrations.sh`
3. **Deploy to Convex**: `npx convex deploy`
4. **Build frontend**: `npm run build` (during deployment)

## Best Practices

### ✅ DO

- **Write idempotent migrations**: Safe to run multiple times
- **Test locally first**: Always test on dev before production
- **Add logging**: Use console.log with `[Migration]` prefix
- **Return statistics**: Include success status and counts
- **Handle errors**: Use try-catch and return meaningful errors
- **Document changes**: Add comments explaining what the migration does

### ❌ DON'T

- **Don't delete old migrations**: Keep migration history
- **Don't modify existing migrations**: Create new ones instead
- **Don't skip testing**: Always test migrations locally first
- **Don't assume data state**: Check for existence before modifying
- **Don't forget rollback**: Consider how to undo if needed

## Migration Patterns

### Pattern 1: Data Cleanup

```typescript
export const cleanupInvalidData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const allRecords = await ctx.db.query("tableName").collect();
    const invalidRecords = allRecords.filter(r => !r.requiredField);

    for (const record of invalidRecords) {
      await ctx.db.delete(record._id);
    }

    return { deleted: invalidRecords.length };
  },
});
```

### Pattern 2: Data Backfill

```typescript
export const backfillMissingField = internalMutation({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("tableName").collect();
    const recordsToUpdate = records.filter(r => !r.newField);

    for (const record of recordsToUpdate) {
      await ctx.db.patch(record._id, {
        newField: "defaultValue",
      });
    }

    return { updated: recordsToUpdate.length };
  },
});
```

### Pattern 3: Data Transformation

```typescript
export const transformData = internalMutation({
  args: {},
  handler: async (ctx) => {
    const records = await ctx.db.query("tableName").collect();

    for (const record of records) {
      // Transform the data
      const newValue = transformFunction(record.oldValue);

      await ctx.db.patch(record._id, {
        oldValue: undefined, // Remove old field
        newValue: newValue,  // Add new field
      });
    }

    return { transformed: records.length };
  },
});
```

## Troubleshooting

### Migration Failed

If a migration fails:

1. **Check the logs**: View `migrations.log` for details
2. **Fix the issue**: Update the migration function
3. **Redeploy**: Run `npx convex dev` to update the function
4. **Retry**: Run `npm run migrate` again

### Migration Not Running

Ensure:
- Migration file is in `convex/migrations/` folder
- File has `.txt` extension
- File contains valid Convex function path
- Migration function exists in Convex

### Wrong Execution Order

Migrations execute in alphabetical order based on filename. Use the timestamp format `YYYYMMDD_HHMMSS_description.txt` to ensure correct ordering.

## Example: Complete Migration Flow

Let's say you need to add a required `academicYearId` field to the `educationSchedules` table:

### 1. Update Schema

```typescript
// convex/schema.ts
educationSchedules: defineTable({
  name: v.string(),
  startTime: v.string(),
  endTime: v.string(),
  order: v.number(),
  academicYearId: v.string(), // NEW REQUIRED FIELD
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

### 2. Create Migration Function

```typescript
// convex/migration/actions.ts
export const cleanupEducationSchedules = action({
  args: {},
  handler: async (ctx) => {
    const result = await ctx.runMutation(
      internal.migration.actions.deleteEducationSchedulesWithoutAcademicYear,
      {}
    );
    return {
      success: true,
      deleted: result.deleted,
      message: `Deleted ${result.deleted} invalid schedules`,
    };
  },
});
```

### 3. Create Migration File

```bash
echo "migration/actions:cleanupEducationSchedules" > \
  convex/migrations/20241224_055500_cleanup_education_schedules.txt
```

### 4. Test and Deploy

```bash
# Test locally
npm run migrate

# Commit
git add convex/migrations/20241224_055500_cleanup_education_schedules.txt
git commit -m "fix: add migration to cleanup invalid education schedules"
git push

# Deploy
npm run build:convex
```

Done! The migration runs automatically during deployment and cleans up invalid data before the schema validation occurs.

## CI/CD Integration

The migration runner detects CI environments (via `CI=true` env var) and runs non-interactively:

- No user prompts on failure
- Continues through all migrations
- Returns non-zero exit code if any migration fails
- Logs all output to `migrations.log`

## Log File

Migration logs are written to `migrations.log` in the project root:

```bash
# View recent migrations
tail -n 50 migrations.log

# Search for errors
grep ERROR migrations.log

# View specific migration
grep "my_migration" migrations.log
```

## Summary

The migration system ensures:
- ✅ **Automatic execution** during builds
- ✅ **Chronological order** via timestamps
- ✅ **Error handling** with graceful fallback
- ✅ **Logging and reporting** for audit trail
- ✅ **Idempotency** for safe re-runs
- ✅ **CI/CD compatibility** for automation

For questions or issues, check `migrations.log` or review existing migrations in `convex/migrations/` for examples.
