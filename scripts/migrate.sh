#!/usr/bin/env bash
#
# Reusable Convex type-change migration runner (Pattern B — global bypass).
# See docs/migration-playbook.md. For important data prefer Pattern A (union).
#
# Automates the unavoidable 2-deploy dance for a strict field-type change:
#   1. transiently add { schemaValidation: false } to convex/schema.ts
#   2. deploy  (schema already declares the NEW type; validation off tolerates old data)
#   3. run the data migration (@convex-dev/migrations)
#   4. restore the strict schema
#   5. deploy  (all data migrated → strict validation passes)
#
# schemaValidation is deploy-time + GLOBAL — a migration CANNOT toggle it from
# inside itself; that's why this lives in a deploy script, not in the migration.
#
# Usage:
#   CONVEX_DEPLOY_KEY=<key> bash scripts/migrate.sh <file:migrationName> ['<json-args>']
# Example:
#   bash scripts/migrate.sh migrations/workloads:totalHoursToNumber
#
# ⚠️  Deploys the ENTIRE current codebase to the target deployment TWICE, and
#     runs with GLOBAL schema validation OFF during the window. Small/trusted
#     DBs only. For high-value data use Pattern A (per-field union) instead.

set -euo pipefail

NAME="${1:-}"
if [ -z "$NAME" ]; then
  echo "usage: bash scripts/migrate.sh <file:migrationName> ['<json-args>']"
  exit 1
fi
ARGS="${2:-}"
SCHEMA="convex/schema.ts"

if ! grep -q '^});$' "$SCHEMA"; then
  echo "✗ Could not find the defineSchema close ('});') in $SCHEMA — aborting." >&2
  exit 1
fi

echo "⚠️  This deploys the ENTIRE current codebase to the target Convex deployment"
echo "    TWICE, with GLOBAL schemaValidation OFF during the window."
echo "    Migration: $NAME"
read -r -p "Proceed? [y/N] " ok
[ "$ok" = "y" ] || { echo "aborted"; exit 1; }

BACKUP="$(mktemp)"
cp "$SCHEMA" "$BACKUP"
# Always restore the strict schema, even on failure, so the off-flag is never left committed.
trap 'cp "$BACKUP" "$SCHEMA"; rm -f "$BACKUP"' EXIT

echo "→ [1/5] widen: schemaValidation off"
sed -i 's|^});$|}, { schemaValidation: false });|' "$SCHEMA"

echo "→ [2/5] deploy (validation off)"
npx convex deploy

echo "→ [3/5] run migration: $NAME"
if [ -n "$ARGS" ]; then
  npx convex run "$NAME" "$ARGS"
else
  npx convex run "$NAME"
fi

echo "→ [4/5] restore strict schema"
cp "$BACKUP" "$SCHEMA"

echo "→ [5/5] deploy (strict)"
npx convex deploy

echo "✅ migration '$NAME' complete; schema back to strict."
