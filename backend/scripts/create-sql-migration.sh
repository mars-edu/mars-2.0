#!/bin/bash

FILENAME=${1:-migration_$(date +%Y%m%d%H%M%S).sql}

mkdir -p ./prisma/migrations

npx prisma migrate diff --from-empty-schema --to-schema-datamodel ./prisma/schema.prisma --script >"./prisma/migrations/$FILENAME"

echo "Generated SQL migration: ./prisma/migrations/$FILENAME"
