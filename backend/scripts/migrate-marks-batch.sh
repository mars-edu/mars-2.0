#!/usr/bin/env bash

# Batch migration script for marks
# Usage: ./scripts/migrate-marks-batch.sh

API_URL="https://mars-backend.robanokssamit-1ba.workers.dev/api/trpc/marks.migrateFromPiniaState"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMWIyOTQ5NS1jM2ZiLTRlNTktYmFiYi00ODQyOGY1Y2ZjMWMiLCJyb2xlcyI6WyJBRE1JTiJdLCJpYXQiOjE3NjMzMTk4NTcsImV4cCI6MTc2MzQwNjI1N30.-8D3fppL7Lr1khd3p8CMdAKd-5FsUlmV1BhCQPM4a8c"

SKIP=0
LIMIT=2  # Process 3 journals at a time to avoid CPU limits
HAS_MORE="true"

echo "Starting batch migration..."

while [ "$HAS_MORE" = "true" ]; do
  echo ""
  echo "Processing journals $SKIP to $((SKIP + LIMIT))..."
  
  RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Content-Type: application/json" \
    -H "X-Language: en" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"json\":{\"force\":true,\"skip\":$SKIP,\"limit\":$LIMIT}}")
  
  echo "Response: $RESPONSE"
  
  # Extract hasMore from response (requires jq)
  HAS_MORE=$(echo "$RESPONSE" | jq -r '.result.data.json.hasMore // false')
  MIGRATED=$(echo "$RESPONSE" | jq -r '.result.data.json.migrated // 0')
  
  echo "Migrated: $MIGRATED marks"
  echo "Has more: $HAS_MORE"
  
  if [ "$HAS_MORE" = "true" ]; then
    SKIP=$((SKIP + LIMIT))
    echo "Waiting 2 seconds before next batch..."
    sleep 2
  else
    echo ""
    echo "Migration complete!"
    break
  fi
done
