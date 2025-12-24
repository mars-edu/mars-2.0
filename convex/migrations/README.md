# Convex Migrations

This folder contains Convex migration scripts that should be run during deployment.

## Structure

Each migration is a separate file that exports the migration function name to run.

## Naming Convention

Migrations should be named with a timestamp prefix for ordering:
```
YYYYMMDD_HHMMSS_description.txt
```

Example:
```
20241224_055500_cleanup_education_schedules.txt
```

## File Format

Each migration file should contain a single line with the Convex function path to run:

```
migration/actions:cleanupEducationSchedules
```

## Migration Runner

The `scripts/run-migrations.sh` script automatically runs all migrations in order during deployment.

## Adding a New Migration

1. Create a new file in this folder with the timestamp naming convention
2. Add the Convex function path to run
3. Commit the file
4. The migration will run automatically during `npm run build:convex`

## Manual Migration Execution

To run migrations manually:

```bash
# Run all migrations
./scripts/run-migrations.sh

# Run a specific migration
npx convex run migration/actions:cleanupEducationSchedules
```
