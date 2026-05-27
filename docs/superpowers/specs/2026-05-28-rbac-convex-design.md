# Dynamic RBAC + Drop tRPC Backend

**Date:** 2026-05-28  
**Branch:** experental-convex-api  
**Status:** Approved

---

## Overview

Two changes shipped together:

1. **Dynamic RBAC** — replace hardcoded role arrays in `useRBAC.ts` with a Convex-backed permissions table. Backend mutations enforce permissions server-side; frontend reads the same table for nav/route UX.
2. **Drop tRPC** — delete the `backend/` directory (Hono + tRPC + Prisma/D1). All functionality it provided already exists in Convex.

---

## Data Model

New table in `convex/schema.ts`:

```ts
permissions: defineTable({
  resource: v.string(),
  action: v.union(
    v.literal("navigate"),
    v.literal("read"),
    v.literal("write"),
  ),
  roles: v.array(roleValidator),
  description: v.optional(v.string()),
})
  .index("by_resource_action", ["resource", "action"])
```

- `resource` — logical feature name matching nav item IDs and Convex module names (e.g. `"journals"`, `"analytics"`, `"marks"`)
- `action` — `"navigate"` for route/nav guards, `"read"` for query-level enforcement, `"write"` for mutation-level enforcement
- `roles` — subset of `["ADMIN", "TEACHER", "STUDENT", "PARENT"]` that are allowed

### Initial Seed

Derived from current hardcoding in `useRBAC.ts` and local `requireAdmin` functions:

| resource | action | roles |
|---|---|---|
| `home` | navigate | ADMIN, TEACHER, STUDENT, PARENT |
| `journals` | navigate | ADMIN, TEACHER |
| `journals` | read | ADMIN, TEACHER |
| `journals` | write | ADMIN, TEACHER |
| `planning` | navigate | ADMIN, TEACHER |
| `protocol` | navigate | ADMIN, TEACHER |
| `reports` | navigate | ADMIN, TEACHER |
| `rup` | navigate | ADMIN, TEACHER |
| `schedule` | navigate | ADMIN, TEACHER |
| `analytics` | navigate | ADMIN |
| `analytics` | read | ADMIN |
| `workload` | navigate | ADMIN |
| `timetable` | navigate | ADMIN |
| `cabinet-management` | navigate | ADMIN |
| `specialty-catalog` | navigate | ADMIN |
| `discipline-catalog` | navigate | ADMIN |
| `student-card` | navigate | ADMIN |
| `teacher-card` | navigate | ADMIN |
| `marks` | read | ADMIN, TEACHER |
| `marks` | write | ADMIN, TEACHER |
| `users` | write | ADMIN |
| `substitutions` | write | ADMIN |
| `settings` | navigate | ADMIN, TEACHER, STUDENT, PARENT |

---

## Backend Enforcement

### `convex/lib/rbac.ts` (new file)

```ts
import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  resource: string,
  action: "navigate" | "read" | "write"
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) throw new ConvexError({ code: "UNAUTHORIZED" });

  const rule = await ctx.db
    .query("permissions")
    .withIndex("by_resource_action", q =>
      q.eq("resource", resource).eq("action", action)
    )
    .unique();

  if (!rule) throw new ConvexError({ code: "PERMISSION_NOT_DEFINED" });

  if (!user.roles.some(r => (rule.roles as string[]).includes(r)))
    throw new ConvexError({ code: "FORBIDDEN" });
}
```

### Phase 1 — High-risk mutations (this sprint)

Add `requirePermission` calls to:

| File | resource | action |
|---|---|---|
| `convex/marks/mutations.ts` | `marks` | `write` |
| `convex/substitutions/mutations.ts` | `substitutions` | `write` |
| `convex/users/mutations.ts` | `users` | `write` |
| `convex/makeupRequests/mutations.ts` | `marks` | `write` |

The existing local `requireAdmin` helper functions in `substitutions/mutations.ts` are deleted and replaced by `requirePermission`.

### Phase 2 — Sweep

Remaining queries/mutations get `requirePermission` calls added as each module is next touched.

---

## Permissions Queries

### `convex/permissions/queries.ts` (new file)

```ts
export const getMyPermissions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return [];

    const all = await ctx.db.query("permissions").collect();
    return all
      .filter(p => p.action === "navigate" && user.roles.some(r => p.roles.includes(r)))
      .map(p => p.resource);
  }
});
```

Returns the list of navigable resources for the authenticated user (e.g. `["home", "journals", "planning"]`). Frontend uses this list exclusively — no role logic lives in the frontend.

---

## Frontend Changes

### `src/composables/useRBAC.ts` — rewritten

- Remove all `Role.*` imports and hardcoded role arrays from nav items
- Replace with a live `useConvexQuery` call to `getMyPermissions`
- `ALL_NAV_ITEMS` becomes a static constant with `resource` field (no `roles` field)
- `canNavigate(resource)` checks membership in the query result

```ts
const ALL_NAV_ITEMS = [
  { id: "home", resource: "home", label: ..., icon: "home", route: "/home" },
  { id: "journals", resource: "journals", label: ..., icon: "book", route: "/journals/" },
  // ...
]

export function useRBAC() {
  const userStore = useUserStore();

  const myPermissions = useConvexQuery(
    api.permissions.queries.getMyPermissions,
    computed(() => userStore.currentUser?._id
      ? { userId: userStore.currentUser._id }
      : "skip"
    )
  );

  const canNavigate = (resource: string) =>
    myPermissions.data?.includes(resource) ?? false;

  const getNavigationItems = computed(() =>
    ALL_NAV_ITEMS.filter(item => canNavigate(item.resource))
  );

  return { canNavigate, getNavigationItems };
}
```

### Route guards — `src/router/index.ts`

Each route definition gets `meta: { resource: "journals" }`. The `beforeEach` guard checks:

```ts
router.beforeEach(async (to) => {
  const resource = to.meta.resource as string | undefined;
  if (resource && !rbac.canNavigate(resource))
    return { name: "forbidden" };
});
```

---

## tRPC Removal

### What gets deleted

- Entire `backend/` directory
- `"backend"` workspace entry in root `package.json`

### What gets cleaned up in frontend

| File | Change |
|---|---|
| `src/components/JournalTab.vue` | Remove 4 stale tRPC comments (lines 1733, 1932, 3081, 3096) |
| `src/components/FloatingJournalRow.vue` | Remove 2 stale tRPC comments (lines 383, 437) |
| `src/stores/marksStore.ts` | Remove stale tRPC comment (line 439) |
| `src/lib/auth.ts` | Delete `getAuthHeaders` (already marked unused) |
| `src/types/auth.ts` | Remove `ConvexAuthResponse` / `ConvexValidationResponse` if unused after cleanup |

### Nothing migrated

All backend functionality already exists in Convex:

| Backend feature | Convex equivalent |
|---|---|
| Auth (login/register/validateToken) | `convex/auth/mutations.ts` |
| Marks CRUD | `convex/marks/` |
| Files | `convex/files/` |
| WebSocket | Convex reactivity |

---

## Seed Mutation

A one-time `convex/permissions/mutations.ts` internal mutation `seedPermissions` inserts the initial permission rows if the table is empty. Called once via Convex dashboard or a deploy hook.

---

## Out of Scope

- Admin UI for editing permissions at runtime (future work)
- Phase 2 sweep of remaining queries/mutations (incremental, per-module)
- Custom role creation (only 4 fixed roles: ADMIN, TEACHER, STUDENT, PARENT)
