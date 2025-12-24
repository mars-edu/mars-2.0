# MARS 2.0 Documentation

Welcome to the MARS 2.0 documentation! This folder contains all technical documentation for the project.

## 📚 Available Documentation

### System Documentation

#### [Migrations Guide](./MIGRATIONS.md)
Complete guide for the Convex migration system covering:
- How migrations work
- Creating new migrations
- Migration patterns and best practices
- Build process integration
- Troubleshooting

**When to read**: Before creating database schema changes or data migrations.

---

## 🚀 Quick Start Guides

### For Developers

#### First Time Setup
```bash
# Install dependencies
npm install

# Start development servers
npm run dev:all
```

#### Development Workflow
```bash
# Start Convex dev server (watches for changes)
npm run dev:convex

# Start frontend dev server (in another terminal)
npm run dev

# Or start both together
npm run dev:all
```

#### Testing
```bash
# Run unit tests
npm run test

# Run E2E tests (dev environment)
npm run test:e2e:dev

# Run E2E tests (prod environment)
npm run test:e2e:prod
```

#### Building & Deploying
```bash
# Build and deploy Convex backend (includes migrations)
npm run build:convex

# Build frontend
npm run build

# Preview production build
npm run preview
```

---

## 🏗️ Architecture Overview

### Tech Stack

**Frontend:**
- Vue 3 (Composition API)
- TypeScript
- Framework7 (Mobile-first UI)
- Pinia (State Management)
- Vite (Build Tool)

**Backend:**
- Convex (Real-time Database + Serverless Functions)
- TypeScript

**Testing:**
- Jest (Unit Tests)
- Playwright (E2E Tests)

### Project Structure

```
mars-2.0/
├── .claude/              # Claude Code configuration
│   ├── agents.md         # Agent instructions
│   └── commands/         # Custom slash commands
├── backend/              # Legacy backend (being phased out)
├── convex/               # Convex backend
│   ├── schema.ts         # Database schema
│   ├── migration/        # Migration actions
│   ├── migrations/       # Migration scripts (auto-run)
│   ├── academicYears/    # Academic years domain
│   ├── students/         # Students domain
│   ├── teachers/         # Teachers domain
│   ├── educationSchedules/  # Schedule domain
│   └── ...               # Other domains
├── docs/                 # Documentation (you are here!)
├── scripts/              # Build and utility scripts
│   └── run-migrations.sh # Migration runner
├── src/                  # Vue 3 frontend
│   ├── components/       # Vue components
│   ├── pages/            # Page components
│   ├── stores/           # Pinia stores
│   ├── types/            # TypeScript types
│   └── ...
└── package.json          # Project dependencies & scripts
```

---

## 🔑 Key Concepts

### Convex Backend

Convex organizes code by domain, with each domain having:

- **`queries.ts`** - Read-only operations (GET data)
- **`mutations.ts`** - Write operations (CREATE, UPDATE, DELETE)
- **`actions.ts`** - Complex operations (external APIs, migrations)

**Example:**
```
convex/students/
├── queries.ts    # list(), getById(), search()
├── mutations.ts  # create(), update(), remove()
└── actions.ts    # exportToExcel(), importFromCSV()
```

### Real-Time Data Flow

Convex provides real-time reactivity:

```typescript
// Frontend component
import { useConvexQuery } from 'convex-vue'
import { api } from '@/convex/_generated/api'

// Data updates automatically when backend changes
const students = useConvexQuery(api.students.queries.list, {})
```

### State Management

The project uses **Pinia** for local state and **Convex** for persistent/shared state:

- **Convex**: Database records, shared data
- **Pinia**: UI state, user preferences, temporary data

---

## 📖 Common Patterns

### Creating a New Entity

1. **Define Schema** (`convex/schema.ts`)
```typescript
myEntity: defineTable({
  name: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
})
```

2. **Create Domain Folder** (`convex/myEntity/`)
```
convex/myEntity/
├── queries.ts
├── mutations.ts
└── actions.ts (if needed)
```

3. **Implement CRUD Operations**
```typescript
// queries.ts
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("myEntity").collect();
  },
});

// mutations.ts
export const create = mutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.insert("myEntity", {
      name: args.name,
      ...createTimestamps(),
    });
  },
});
```

4. **Create Frontend Store** (`src/stores/myEntityStore.ts`)
```typescript
import { defineStore } from 'pinia'
import { useConvexQuery, useConvexMutation } from 'convex-vue'

export const useMyEntityStore = defineStore('myEntity', () => {
  const entities = useConvexQuery(api.myEntity.queries.list, {})
  const createEntity = useConvexMutation(api.myEntity.mutations.create)

  return { entities, createEntity }
})
```

---

## 🛠️ Development Tools

### NPM Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend dev server |
| `npm run dev:convex` | Start Convex dev server |
| `npm run dev:all` | Start both servers |
| `npm run build` | Build frontend |
| `npm run build:convex` | Deploy Convex + run migrations |
| `npm run migrate` | Run migrations only |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run preview` | Preview production build |

### Convex CLI

```bash
# Deploy to production
npx convex deploy

# Deploy to dev
npx convex dev

# Run a function
npx convex run myDomain/mutations:myFunction '{"arg": "value"}'

# View logs
npx convex logs

# Check deployment status
npx convex deployments list
```

---

## 🔍 Finding Your Way Around

### Looking for...

**User authentication?** → `convex/auth/`

**Academic year logic?** → `convex/academicYears/`

**Student management?** → `convex/students/`

**Schedule/timetable?** → `convex/educationSchedules/`

**Marks/grades?** → `convex/marks/`

**Database schema?** → `convex/schema.ts`

**Frontend components?** → `src/components/`

**State management?** → `src/stores/`

**Migrations?** → `convex/migrations/` + [MIGRATIONS.md](./MIGRATIONS.md)

---

## 📝 Contributing

### Before Making Changes

1. ✅ Check if documentation exists in `/docs`
2. ✅ Understand the existing patterns
3. ✅ Test on dev deployment first
4. ✅ Follow TypeScript best practices
5. ✅ Update documentation if adding new features

### Creating Migrations

Always use the migration system for schema changes:

```bash
# See full guide in MIGRATIONS.md
npm run migrate
```

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Use Composition API for Vue components
- Keep components small and focused

---

## 🐛 Troubleshooting

### Common Issues

**"Cannot find module '@/convex/_generated/api'"**
- Run `npx convex dev` to generate types

**Schema validation error**
- Check for missing required fields
- Create a migration to fix data (see [MIGRATIONS.md](./MIGRATIONS.md))

**Deployment fails**
- Check `migrations.log` for errors
- Verify all migrations pass locally first

**Frontend not connecting to Convex**
- Check `VITE_CONVEX_URL` in `.env`
- Verify Convex dev server is running

---

## 📚 Additional Resources

### External Documentation

- [Convex Docs](https://docs.convex.dev/) - Backend framework
- [Vue 3 Docs](https://vuejs.org/) - Frontend framework
- [Framework7 Docs](https://framework7.io/) - UI components
- [Pinia Docs](https://pinia.vuejs.org/) - State management
- [TypeScript Docs](https://www.typescriptlang.org/) - Language reference

### Internal Links

- [Main README](../README.md) - Project overview
- [Backend README](../backend/README.md) - Legacy backend docs
- [Migrations Guide](./MIGRATIONS.md) - Migration system

---

## 🤝 Need Help?

1. Check this documentation first
2. Search the codebase for similar patterns
3. Review the schema in `convex/schema.ts`
4. Check Convex logs: `npx convex logs`
5. Review `migrations.log` for migration issues

---

**Last Updated**: December 24, 2024
