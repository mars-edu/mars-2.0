# Agent Instructions for MARS 2.0

## Project Overview

MARS 2.0 is an education management system built with Vue 3, Convex (for backend), and Framework7 (for UI). It manages academic years, students, teachers, schedules, marks, and more.

## Documentation Location

📁 **All project documentation is located in the `/docs` folder.**

When working on tasks, agents should:

1. **Read relevant documentation** from `/docs` before making changes
2. **Update documentation** when implementing new features or systems
3. **Follow established patterns** documented in the guides

## Key Documentation Files

- **`/docs/MIGRATIONS.md`** - Complete guide for the Convex migration system
  - Read this before creating database migrations
  - Follow the patterns and best practices outlined
  - Use the migration runner for all data schema changes

## Project Structure

- **`/convex`** - Convex backend (serverless functions, schema, queries, mutations, actions)
- **`/src`** - Vue 3 frontend application
- **`/backend`** - Legacy backend (being phased out, Convex is primary)
- **`/scripts`** - Build and utility scripts
- **`/docs`** - Project documentation
- **`/.claude`** - Claude Code configuration

## Technology Stack

### Frontend
- **Vue 3** with Composition API
- **Pinia** for state management
- **Framework7** for mobile-first UI
- **Vite** for build tooling
- **TypeScript** for type safety

### Backend
- **Convex** - Primary backend (real-time database, serverless functions)
- **TypeScript** for all backend code

### Key Patterns

1. **Convex Functions**: Organized by domain (e.g., `convex/academicYears/`, `convex/students/`)
2. **Queries**: Read-only operations in `queries.ts` files
3. **Mutations**: Write operations in `mutations.ts` files
4. **Actions**: Complex operations (external APIs, migrations) in `actions.ts` files
5. **Schema**: Central schema in `convex/schema.ts`

## Common Tasks

### Creating a Migration
See `/docs/MIGRATIONS.md` for complete instructions.

```bash
# 1. Create migration function in convex/migration/actions.ts
# 2. Create migration file
echo "migration/actions:myMigration" > convex/migrations/$(date +%Y%m%d_%H%M%S)_description.txt
# 3. Test locally
npm run migrate
```

### Development Workflow
```bash
npm run dev:all        # Start both Convex and frontend dev servers
npm run dev            # Frontend only
npm run dev:convex     # Convex only
```

### Building
```bash
npm run build:convex   # Build and deploy Convex (includes migrations)
npm run build          # Build frontend only
```

## Important Notes

- **Convex is Real-Time**: All data updates propagate instantly to connected clients
- **Idempotent Migrations**: All migrations should be safe to run multiple times
- **Test Locally First**: Always test changes on dev deployment before production
- **Follow TypeScript**: Use proper types throughout the codebase

## When in Doubt

1. Check `/docs` for relevant documentation
2. Look for existing patterns in the codebase
3. Read the schema in `convex/schema.ts` to understand data structure
4. Test on dev deployment before production

## Updating This File

When adding new systems, patterns, or documentation:
1. Add documentation to `/docs` folder
2. Update this file to reference the new documentation
3. Keep instructions concise - detailed info goes in `/docs`
