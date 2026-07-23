import { Migrations } from "@convex-dev/migrations";
import { components } from "../_generated/api";
import type { DataModel } from "../_generated/dataModel";

/**
 * Official stateful migration runner (@convex-dev/migrations).
 *
 * Replaces the former self-written `scripts/run-migrations.sh` + `.txt` pointer
 * + `convex/migration/*.ts` system. This component tracks migration state
 * (won't run twice, resumes where it left off), batches large tables, and
 * supports dryRun / getStatus / a serial runner.
 *
 * Define migrations with `migrations.define({ table, migrateOne })` in their own
 * files (e.g. convex/workloadMigrations.ts) and run them from the CLI:
 *   npx convex run <file>:<name> '{dryRun:true}'   # preview
 *   npx convex run <file>:<name>                     # execute
 *   npx convex run --component migrations lib:getStatus --watch
 */
export const migrations = new Migrations<DataModel>(components.migrations);

/** Generic runner: `npx convex run migrations:run '{fn:"migrations/workloads:backfillX"}'`. */
export const run = migrations.runner();
