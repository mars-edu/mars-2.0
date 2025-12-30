#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ "${1:-}" = "--dry-run" ]; then
  "$SCRIPT_DIR/convex-clear.sh" --dry-run --all
  exit 0
fi

"$SCRIPT_DIR/convex-clear.sh" --all

echo "Seeding basic data (bases)..."
npx convex run testSeed:seedBasicData "{}"
