#!/bin/bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  ./scripts/convex-clear.sh [--dry-run] <table> [table...]
  ./scripts/convex-clear.sh [--dry-run] --all

Examples:
  ./scripts/convex-clear.sh students specialties
  ./scripts/convex-clear.sh --all
  ./scripts/convex-clear.sh --dry-run students
EOF
}

DRY_RUN=false
USE_ALL=false
TABLES=()

while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run)
      DRY_RUN=true
      ;;
    --all)
      USE_ALL=true
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      TABLES+=("$1")
      ;;
  esac
  shift
done

if [ "$USE_ALL" = true ]; then
  TABLES=(
    users
    academicYears
    semesters
    specialties
    courses
    bases
    positions
    disciplines
    modules
    students
    teachers
    class9Items
    distributionEntries
    intermediateControls
    finalControls
    scheduledIntermediateControls
    scheduledFinalControls
    calendarEvents
    ktps
    ktpDetails
    journals
    journalStudents
    marks
    markHistory
    educationSchedules
    vacations
    sessions
    files
    passwordChangeHistory
    offlineQueue
    rupEntries
  )
fi

if [ ${#TABLES[@]} -eq 0 ]; then
  usage
  exit 1
fi

json_tables=$(printf '"%s",' "${TABLES[@]}")
json_tables="[${json_tables%,}]"

args=$(cat <<EOF
{"tables":${json_tables},"confirm":"DELETE_DATA","dryRun":${DRY_RUN}}
EOF
)

echo "Convex clear: ${TABLES[*]}"
npx convex run maintenance/actions:clearTables "$args"
