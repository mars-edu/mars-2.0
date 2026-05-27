# Dynamic RBAC + Drop tRPC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded role arrays with a Convex-backed permissions table enforced server-side, add permission change history and date-range time limits, and delete the dead tRPC backend.

**Architecture:** A `permissions` Convex table is the single source of truth — `requirePermission()` in `convex/lib/rbac.ts` enforces access inside mutations, `getMyPermissions` feeds the frontend nav and Framework7 route guards reactively. A `permissionHistory` table logs every permission create/update/delete. The `backend/` directory (Hono + tRPC + Prisma/D1) is deleted because all its functionality already lives in Convex.

**Tech Stack:** Convex (schema/queries/mutations), Vue 3 composables, Framework7 router (`beforeEnter` callback pattern), Jest (pure unit tests for rbac helpers)

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `convex/schema.ts` | Add `permissions` + `permissionHistory` tables |
| Create | `convex/lib/rbac.ts` | Pure helpers + `requirePermission` enforcer |
| Create | `convex/lib/__tests__/rbac.spec.ts` | Unit tests for pure helpers |
| Create | `convex/permissions/queries.ts` | `getMyPermissions`, `getPermissionHistory` |
| Create | `convex/permissions/mutations.ts` | `seedPermissions` (internal) + `createPermission`, `updatePermission`, `deletePermission` |
| Modify | `convex/marks/mutations.ts` | Add `requirePermission` to `updateMark`, `batchUpdateMarks` |
| Modify | `convex/substitutions/mutations.ts` | Replace local `requireAdmin` with `requirePermission` |
| Modify | `convex/users/mutations.ts` | Add `requirePermission` to write mutations |
| Modify | `convex/makeupRequests/mutations.ts` | Replace local `requireAdmin` with `requirePermission` |
| Rewrite | `src/composables/useRBAC.ts` | Data-driven nav via Convex subscription |
| Modify | `src/composables/useRouteGuard.ts` | Use `canNavigate(resource)` instead of role array |
| Modify | `src/js/routes.ts` | `createAuthGuard(resource?)` reads permissions table |
| Delete | `backend/` | Entire directory |
| Modify | `package.json` | Remove backend workspace |
| Modify | `src/components/JournalTab.vue` | Remove stale tRPC comments |
| Modify | `src/components/FloatingJournalRow.vue` | Remove stale tRPC comments |
| Modify | `src/stores/marksStore.ts` | Remove stale tRPC comment |
| Modify | `src/lib/auth.ts` | Remove unused `getAuthHeaders` |

---

## Task 1: Add permissions + permissionHistory to Convex schema

**Files:**
- Modify: `convex/schema.ts`

- [ ] **Step 1: Add the two new tables**

In `convex/schema.ts`, find the closing brace of the `users` table definition (the line with `.index("by_email", ["email"]),`). Insert the following two table definitions immediately after it, inside the `defineSchema({...})` call:

```ts
  permissions: defineTable({
    resource: v.string(),
    action: v.union(
      v.literal("navigate"),
      v.literal("read"),
      v.literal("write"),
    ),
    roles: v.array(
      v.union(
        v.literal("ADMIN"),
        v.literal("TEACHER"),
        v.literal("STUDENT"),
        v.literal("PARENT"),
      )
    ),
    description: v.optional(v.string()),
    activeFrom: v.optional(v.number()),
    activeTo: v.optional(v.number()),
  })
    .index("by_resource_action", ["resource", "action"]),

  permissionHistory: defineTable({
    permissionId: v.id("permissions"),
    resource: v.string(),
    action: v.string(),
    changedBy: v.id("users"),
    changedAt: v.number(),
    previousRoles: v.array(
      v.union(
        v.literal("ADMIN"),
        v.literal("TEACHER"),
        v.literal("STUDENT"),
        v.literal("PARENT"),
      )
    ),
    newRoles: v.array(
      v.union(
        v.literal("ADMIN"),
        v.literal("TEACHER"),
        v.literal("STUDENT"),
        v.literal("PARENT"),
      )
    ),
    previousActiveFrom: v.optional(v.number()),
    previousActiveTo: v.optional(v.number()),
    newActiveFrom: v.optional(v.number()),
    newActiveTo: v.optional(v.number()),
    changeType: v.union(
      v.literal("created"),
      v.literal("updated"),
      v.literal("deleted"),
    ),
  })
    .index("by_permission", ["permissionId"])
    .index("by_changedBy", ["changedBy"])
    .index("by_changedAt", ["changedAt"]),
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run tsc
```

Expected: no errors on the schema additions.

---

## Task 2: Create convex/lib/rbac.ts + unit tests

**Files:**
- Create: `convex/lib/rbac.ts`
- Create: `convex/lib/__tests__/rbac.spec.ts`

- [ ] **Step 1: Write the failing tests first**

Create `convex/lib/__tests__/rbac.spec.ts`:

```ts
import { isPermissionActive, hasRoleAccess } from "../rbac";

describe("isPermissionActive", () => {
  it("returns true when no time bounds are set", () => {
    expect(isPermissionActive(undefined, undefined, 1000)).toBe(true);
  });

  it("returns false when now is before activeFrom", () => {
    expect(isPermissionActive(5000, undefined, 3000)).toBe(false);
  });

  it("returns false when now is after activeTo", () => {
    expect(isPermissionActive(undefined, 2000, 3000)).toBe(false);
  });

  it("returns true when now is within the active window", () => {
    expect(isPermissionActive(1000, 5000, 3000)).toBe(true);
  });

  it("returns true when now equals activeFrom boundary", () => {
    expect(isPermissionActive(3000, 5000, 3000)).toBe(true);
  });

  it("returns true when now equals activeTo boundary", () => {
    expect(isPermissionActive(1000, 3000, 3000)).toBe(true);
  });
});

describe("hasRoleAccess", () => {
  it("returns true when user has one matching role", () => {
    expect(hasRoleAccess(["TEACHER"], ["ADMIN", "TEACHER"])).toBe(true);
  });

  it("returns false when user has no matching roles", () => {
    expect(hasRoleAccess(["STUDENT"], ["ADMIN", "TEACHER"])).toBe(false);
  });

  it("returns false for empty user roles", () => {
    expect(hasRoleAccess([], ["ADMIN"])).toBe(false);
  });

  it("returns false for empty allowed roles", () => {
    expect(hasRoleAccess(["ADMIN"], [])).toBe(false);
  });

  it("returns true when user has ADMIN and ADMIN is allowed", () => {
    expect(hasRoleAccess(["ADMIN"], ["ADMIN"])).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- --testPathPattern="convex/lib/__tests__/rbac.spec.ts"
```

Expected: `FAIL` — `Cannot find module '../rbac'`

- [ ] **Step 3: Create convex/lib/rbac.ts**

```ts
import { ConvexError } from "convex/values";
import type { Id } from "../_generated/dataModel";
import type { QueryCtx, MutationCtx } from "../_generated/server";

export function isPermissionActive(
  activeFrom: number | undefined,
  activeTo: number | undefined,
  now: number
): boolean {
  if (activeFrom !== undefined && now < activeFrom) return false;
  if (activeTo !== undefined && now > activeTo) return false;
  return true;
}

export function hasRoleAccess(userRoles: string[], allowedRoles: string[]): boolean {
  return userRoles.some((r) => allowedRoles.includes(r));
}

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
    .withIndex("by_resource_action", (q) =>
      q.eq("resource", resource).eq("action", action)
    )
    .unique();

  if (!rule) throw new ConvexError({ code: "PERMISSION_NOT_DEFINED" });

  if (!hasRoleAccess(user.roles, rule.roles as string[]))
    throw new ConvexError({ code: "FORBIDDEN" });

  if (!isPermissionActive(rule.activeFrom, rule.activeTo, Date.now()))
    throw new ConvexError({ code: "PERMISSION_EXPIRED_OR_NOT_YET_ACTIVE" });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test -- --testPathPattern="convex/lib/__tests__/rbac.spec.ts"
```

Expected: `PASS` — 11 tests passing.

- [ ] **Step 5: Commit**

```bash
git add convex/lib/rbac.ts convex/lib/__tests__/rbac.spec.ts
git commit -m "feat(rbac): add requirePermission helper and pure unit tests"
```

---

## Task 3: Create convex/permissions/mutations.ts

**Files:**
- Create: `convex/permissions/mutations.ts`

- [ ] **Step 1: Create the file**

```ts
import { mutation, internalMutation } from "../_generated/server";
import { v, ConvexError } from "convex/values";
import { requirePermission } from "../lib/rbac";
import { roleValidator } from "../lib/validators";

const SEED_DATA = [
  { resource: "home", action: "navigate", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
  { resource: "journals", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "journals", action: "read", roles: ["ADMIN", "TEACHER"] },
  { resource: "journals", action: "write", roles: ["ADMIN", "TEACHER"] },
  { resource: "planning", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "protocol", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "reports", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "rup", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "schedule", action: "navigate", roles: ["ADMIN", "TEACHER"] },
  { resource: "analytics", action: "navigate", roles: ["ADMIN"] },
  { resource: "analytics", action: "read", roles: ["ADMIN"] },
  { resource: "workload", action: "navigate", roles: ["ADMIN"] },
  { resource: "timetable", action: "navigate", roles: ["ADMIN"] },
  { resource: "cabinet-management", action: "navigate", roles: ["ADMIN"] },
  { resource: "specialty-catalog", action: "navigate", roles: ["ADMIN"] },
  { resource: "discipline-catalog", action: "navigate", roles: ["ADMIN"] },
  { resource: "student-card", action: "navigate", roles: ["ADMIN"] },
  { resource: "teacher-card", action: "navigate", roles: ["ADMIN"] },
  { resource: "marks", action: "read", roles: ["ADMIN", "TEACHER"] },
  { resource: "marks", action: "write", roles: ["ADMIN", "TEACHER"] },
  { resource: "users", action: "write", roles: ["ADMIN"] },
  { resource: "substitutions", action: "write", roles: ["ADMIN"] },
  { resource: "settings", action: "navigate", roles: ["ADMIN", "TEACHER", "STUDENT", "PARENT"] },
] as const;

export const seedPermissions = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("permissions").first();
    if (existing) return { skipped: true };

    for (const entry of SEED_DATA) {
      await ctx.db.insert("permissions", {
        resource: entry.resource,
        action: entry.action,
        roles: [...entry.roles],
      });
    }

    return { seeded: SEED_DATA.length };
  },
});

export const createPermission = mutation({
  args: {
    changedBy: v.id("users"),
    resource: v.string(),
    action: v.union(v.literal("navigate"), v.literal("read"), v.literal("write")),
    roles: v.array(roleValidator),
    description: v.optional(v.string()),
    activeFrom: v.optional(v.number()),
    activeTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.changedBy, "users", "write");

    const { changedBy, ...data } = args;
    const permissionId = await ctx.db.insert("permissions", data);

    await ctx.db.insert("permissionHistory", {
      permissionId,
      resource: args.resource,
      action: args.action,
      changedBy,
      changedAt: Date.now(),
      previousRoles: [],
      newRoles: args.roles,
      newActiveFrom: args.activeFrom,
      newActiveTo: args.activeTo,
      changeType: "created",
    });

    return permissionId;
  },
});

export const updatePermission = mutation({
  args: {
    changedBy: v.id("users"),
    permissionId: v.id("permissions"),
    roles: v.optional(v.array(roleValidator)),
    description: v.optional(v.string()),
    activeFrom: v.optional(v.number()),
    activeTo: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.changedBy, "users", "write");

    const existing = await ctx.db.get(args.permissionId);
    if (!existing) throw new ConvexError({ code: "NOT_FOUND" });

    const patch: Record<string, unknown> = {};
    if (args.roles !== undefined) patch.roles = args.roles;
    if (args.description !== undefined) patch.description = args.description;
    if (args.activeFrom !== undefined) patch.activeFrom = args.activeFrom;
    if (args.activeTo !== undefined) patch.activeTo = args.activeTo;

    await ctx.db.patch(args.permissionId, patch);

    await ctx.db.insert("permissionHistory", {
      permissionId: args.permissionId,
      resource: existing.resource,
      action: existing.action,
      changedBy: args.changedBy,
      changedAt: Date.now(),
      previousRoles: existing.roles,
      newRoles: args.roles ?? existing.roles,
      previousActiveFrom: existing.activeFrom,
      previousActiveTo: existing.activeTo,
      newActiveFrom: args.activeFrom ?? existing.activeFrom,
      newActiveTo: args.activeTo ?? existing.activeTo,
      changeType: "updated",
    });
  },
});

export const deletePermission = mutation({
  args: {
    changedBy: v.id("users"),
    permissionId: v.id("permissions"),
  },
  handler: async (ctx, args) => {
    await requirePermission(ctx, args.changedBy, "users", "write");

    const existing = await ctx.db.get(args.permissionId);
    if (!existing) throw new ConvexError({ code: "NOT_FOUND" });

    await ctx.db.delete(args.permissionId);

    await ctx.db.insert("permissionHistory", {
      permissionId: args.permissionId,
      resource: existing.resource,
      action: existing.action,
      changedBy: args.changedBy,
      changedAt: Date.now(),
      previousRoles: existing.roles,
      newRoles: [],
      previousActiveFrom: existing.activeFrom,
      previousActiveTo: existing.activeTo,
      changeType: "deleted",
    });
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run tsc
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/permissions/mutations.ts
git commit -m "feat(rbac): add permissions CRUD mutations with history tracking"
```

---

## Task 4: Create convex/permissions/queries.ts

**Files:**
- Create: `convex/permissions/queries.ts`

- [ ] **Step 1: Create the file**

```ts
import { query } from "../_generated/server";
import { v } from "convex/values";
import { isPermissionActive, hasRoleAccess } from "../lib/rbac";

export const getMyPermissions = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const user = await ctx.db.get(userId);
    if (!user) return [];

    const now = Date.now();
    const all = await ctx.db.query("permissions").collect();

    return all
      .filter(
        (p) =>
          p.action === "navigate" &&
          hasRoleAccess(user.roles, p.roles as string[]) &&
          isPermissionActive(p.activeFrom, p.activeTo, now)
      )
      .map((p) => p.resource);
  },
});

export const getPermissionHistory = query({
  args: { permissionId: v.id("permissions") },
  handler: async (ctx, { permissionId }) => {
    return await ctx.db
      .query("permissionHistory")
      .withIndex("by_permission", (q) => q.eq("permissionId", permissionId))
      .order("desc")
      .collect();
  },
});

export const getAllPermissions = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("permissions").collect();
  },
});
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run tsc
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add convex/permissions/queries.ts
git commit -m "feat(rbac): add permissions queries (getMyPermissions, getPermissionHistory)"
```

---

## Task 5: Deploy to Convex and run seed

- [ ] **Step 1: Deploy schema + new functions to Convex**

```bash
npx convex dev --once
```

Expected: schema deploys with `permissions` and `permissionHistory` tables created, all new functions registered.

- [ ] **Step 2: Run the seed mutation**

```bash
npx convex run permissions/mutations:seedPermissions
```

Expected output:
```json
{ "seeded": 23 }
```

If you see `{ "skipped": true }`, the table was already seeded — that's fine.

- [ ] **Step 3: Verify in Convex dashboard**

Open the Convex dashboard → Data → `permissions` table. Confirm 23 rows exist with the expected resource/action/roles combinations.

---

## Task 6: Add requirePermission to marks/mutations.ts

**Files:**
- Modify: `convex/marks/mutations.ts`

The `updateMark` and `batchUpdateMarks` mutations both accept an optional `userId`. We add a permission check when `userId` is provided (callers in `marksStore.ts` always pass `userId` from the authenticated user store).

- [ ] **Step 1: Add import**

At the top of `convex/marks/mutations.ts`, add:

```ts
import { requirePermission } from "../lib/rbac";
```

- [ ] **Step 2: Add guard to updateMark**

Inside the `updateMark` handler, immediately after destructuring `userId`, add:

```ts
    if (userId) {
      await requirePermission(ctx, userId, "marks", "write");
    }
```

The handler opening should now look like:

```ts
  handler: async (ctx, args) => {
    const { userId, ...markData } = args;

    if (userId) {
      await requirePermission(ctx, userId, "marks", "write");
    }

    // Find existing mark
    const existingMark = await ctx.db
```

- [ ] **Step 3: Add guard to batchUpdateMarks**

Find the `batchUpdateMarks` mutation handler. After extracting `userId` from `args`, add:

```ts
    if (args.userId) {
      await requirePermission(ctx, args.userId, "marks", "write");
    }
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run tsc
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add convex/marks/mutations.ts
git commit -m "feat(rbac): enforce marks:write permission in updateMark and batchUpdateMarks"
```

---

## Task 7: Replace requireAdmin with requirePermission in substitutions/mutations.ts

**Files:**
- Modify: `convex/substitutions/mutations.ts`

- [ ] **Step 1: Add import**

At the top of `convex/substitutions/mutations.ts`, add:

```ts
import { requirePermission } from "../lib/rbac";
```

- [ ] **Step 2: Delete the local requireAdmin function**

Find and remove these lines (lines 11–16):

```ts
async function requireAdmin(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || !user.roles.includes("ADMIN")) {
    throw new Error(m.backend_admin_only());
  }
  return user;
}
```

- [ ] **Step 3: Replace all requireAdmin call sites**

Search the file for `await requireAdmin(ctx, ` and replace each with:

```ts
await requirePermission(ctx, args.userId, "substitutions", "write");
```

There are 2 call sites (in `acceptSubstitution` and `rejectSubstitution` mutations). Verify the `args.userId` field name matches each mutation's args — if a mutation uses a different parameter name for the admin user ID, use that name instead.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run tsc
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add convex/substitutions/mutations.ts
git commit -m "feat(rbac): replace requireAdmin with requirePermission in substitutions"
```

---

## Task 8: Add requirePermission to users/mutations.ts

**Files:**
- Modify: `convex/users/mutations.ts`

- [ ] **Step 1: Add import**

At the top of `convex/users/mutations.ts`, add:

```ts
import { requirePermission } from "../lib/rbac";
```

- [ ] **Step 2: Add guard to write mutations**

Find the mutations that modify user data (e.g., `updateUser`, `deleteUser`, `updateUserRole`, `updateProfilePicture`). For each one that accepts a `userId` representing the acting admin (not the target user), add at the start of the handler:

```ts
await requirePermission(ctx, args.userId, "users", "write");
```

For `updateProfilePicture` specifically — users update their own avatar, so the `userId` IS the acting user. Add the guard using `args.userId` as the caller.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npm run tsc
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add convex/users/mutations.ts
git commit -m "feat(rbac): enforce users:write permission in user mutations"
```

---

## Task 9: Replace requireAdmin with requirePermission in makeupRequests/mutations.ts

**Files:**
- Modify: `convex/makeupRequests/mutations.ts`

- [ ] **Step 1: Add import**

At the top of `convex/makeupRequests/mutations.ts`, add:

```ts
import { requirePermission } from "../lib/rbac";
```

- [ ] **Step 2: Delete the local requireAdmin function**

Find and remove these lines:

```ts
async function requireAdmin(ctx: MutationCtx, userId: Id<"users">) {
  const user = await ctx.db.get(userId);
  if (!user || !user.roles.includes("ADMIN")) {
    throw new Error(m.backend_admin_only());
  }
}
```

- [ ] **Step 3: Replace all requireAdmin call sites**

Search for `await requireAdmin(ctx, ` in this file and replace each with:

```ts
await requirePermission(ctx, args.userId, "marks", "write");
```

Makeup hour requests are mark-adjacent operations, so they use the `marks:write` resource.

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npm run tsc
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add convex/makeupRequests/mutations.ts
git commit -m "feat(rbac): replace requireAdmin with requirePermission in makeupRequests"
```

---

## Task 10: Deploy Phase 1 backend enforcement

- [ ] **Step 1: Deploy all backend changes**

```bash
npx convex dev --once
```

Expected: all mutations deploy successfully.

- [ ] **Step 2: Smoke test via Convex dashboard**

In the Convex dashboard → Functions, find `marks/mutations:updateMark`. Run it with a `userId` of a STUDENT user ID. Expected: throws `ConvexError { code: "FORBIDDEN" }`. Run it with a TEACHER user ID. Expected: proceeds normally (or fails for a different reason like invalid journalId — not a permissions error).

---

## Task 11: Rewrite src/composables/useRBAC.ts

**Files:**
- Rewrite: `src/composables/useRBAC.ts`

The current file uses hardcoded `roles: Role[]` arrays on nav items. We replace it with a Convex subscription that fetches the user's navigable resources from the `permissions` table.

- [ ] **Step 1: Replace the file entirely**

```ts
import { ref, computed, watch } from "vue";
import { useUserStore } from "../stores/userStore";
import { convex } from "../lib/convexClient";
import { api } from "@convex/_generated/api";
import {
  nav_home,
  nav_specialty_catalog,
  nav_discipline_catalog,
  nav_schedule,
  nav_protocol,
  nav_journals,
  nav_rup,
  nav_analytics,
  nav_reports,
  nav_education_schedule,
  nav_student_card,
  nav_teacher_card,
  nav_profile,
  nav_settings,
  nav_logout,
  nav_ktp,
  nav_testing,
  nav_courses,
  nav_timetable,
  nav_workload,
  nav_cabinet_management,
} from "@/paraglide/messages";
import { useLocaleStore } from "@/stores/localeStore";

export interface NavigationItem {
  id: string;
  resource: string;
  label: string;
  icon: string;
  route: string;
}

const ALL_NAV_ITEMS: Omit<NavigationItem, "label">[] = [
  { id: "home", resource: "home", icon: "home", route: "/home" },
  { id: "planning", resource: "planning", icon: "calendar-days", route: "/planning" },
  { id: "journals", resource: "journals", icon: "book", route: "/journals/" },
  { id: "ktp", resource: "journals", icon: "layout-grid", route: "/journals/" },
  { id: "reports", resource: "reports", icon: "file-text", route: "/reports/" },
  { id: "testing", resource: "journals", icon: "layout", route: "/testing" },
  { id: "courses", resource: "journals", icon: "graduation-cap", route: "/home" },
  { id: "protocol", resource: "protocol", icon: "layout", route: "/protocol" },
  { id: "analytics", resource: "analytics", icon: "pie-chart", route: "/analytics/" },
  { id: "rup", resource: "rup", icon: "file-text", route: "/rup/" },
  { id: "schedule", resource: "schedule", icon: "calendar", route: "/education-schedule/" },
  { id: "timetable", resource: "timetable", icon: "clock", route: "/home" },
  { id: "workload", resource: "workload", icon: "layout-grid", route: "/workload-management" },
  { id: "cabinet-management", resource: "cabinet-management", icon: "door-open", route: "/cabinet-management/" },
  { id: "specialty-catalog", resource: "specialty-catalog", icon: "book-open", route: "/specialty-catalog/" },
  { id: "student-card", resource: "student-card", icon: "users", route: "/student-card/" },
  { id: "discipline-catalog", resource: "discipline-catalog", icon: "book", route: "/discipline-catalog/" },
  { id: "teacher-card", resource: "teacher-card", icon: "user-check", route: "/teacher-card/" },
  { id: "settings", resource: "settings", icon: "settings", route: "/settings/" },
];

export function useRBAC() {
  const userStore = useUserStore();
  const localeStore = useLocaleStore();

  const myPermissions = ref<string[]>([]);

  watch(
    () => userStore.currentUser?._id,
    (userId, _prev, onCleanup) => {
      if (!userId) {
        myPermissions.value = [];
        return;
      }

      const unsubscribe = convex.onUpdate(
        api.permissions.queries.getMyPermissions,
        { userId },
        (data) => {
          myPermissions.value = data ?? [];
        }
      );

      onCleanup(unsubscribe);
    },
    { immediate: true }
  );

  const canNavigate = (resource: string): boolean =>
    myPermissions.value.includes(resource);

  const getNavigationItems = computed<NavigationItem[]>(() => {
    void localeStore.locale;

    const labels: Record<string, () => string> = {
      home: nav_home,
      planning: nav_schedule,
      journals: nav_journals,
      ktp: nav_ktp,
      reports: nav_reports,
      testing: nav_testing,
      courses: nav_courses,
      protocol: nav_protocol,
      analytics: nav_analytics,
      rup: nav_rup,
      schedule: nav_education_schedule,
      timetable: nav_timetable,
      workload: nav_workload,
      "cabinet-management": nav_cabinet_management,
      "specialty-catalog": nav_specialty_catalog,
      "student-card": nav_student_card,
      "discipline-catalog": nav_discipline_catalog,
      "teacher-card": nav_teacher_card,
      settings: nav_settings,
    };

    return ALL_NAV_ITEMS
      .filter((item) => canNavigate(item.resource))
      .map((item) => ({ ...item, label: labels[item.id]?.() ?? item.id }));
  });

  const getProfileMenuItems = computed(() => [] as NavigationItem[]);

  return {
    canNavigate,
    getNavigationItems,
    getProfileMenuItems,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npm run tsc
```

Expected: no errors. If `Sidebar.vue` or `MobileFooter.vue` import `AccessControl` or `checkAccess`, update those files to remove those imports (they are no longer exported).

- [ ] **Step 3: Commit**

```bash
git add src/composables/useRBAC.ts
git commit -m "feat(rbac): rewrite useRBAC to use live Convex permissions query"
```

---

## Task 12: Update useRouteGuard.ts and routes.ts

**Files:**
- Modify: `src/composables/useRouteGuard.ts`
- Modify: `src/js/routes.ts`

- [ ] **Step 1: Rewrite useRouteGuard.ts**

Replace the entire file:

```ts
import { useRBAC } from "./useRBAC";
import { f7 } from "framework7-vue";

export interface RouteGuard {
  resource: string;
  redirect?: string;
}

export function useRouteGuard() {
  const { canNavigate } = useRBAC();

  const guardRoute = (guard: RouteGuard): boolean => {
    if (canNavigate(guard.resource)) return true;

    const redirectPath = guard.redirect ?? "/home";
    f7.views.main.router.navigate(redirectPath);
    return false;
  };

  return { guardRoute };
}
```

- [ ] **Step 2: Update createAuthGuard in routes.ts**

Replace the `createAuthGuard` function signature and role-check logic. Replace the old function with:

```ts
function createAuthGuard(resource?: string) {
  return (ctx: Router.RouteCallbackCtx) => {
    const userStore = useUserStore();
    const hasToken = localStorage.getItem("auth_token");

    console.log("[Routes] Auth guard check:", {
      path: ctx.to.url,
      isAuthenticated: userStore.isAuthenticated,
      hasToken: !!hasToken,
      resource,
    });

    const checkResource = async () => {
      if (!resource) return true;
      const userId = userStore.currentUser?._id;
      if (!userId) return false;
      const permissions = await convex.query(
        api.permissions.queries.getMyPermissions,
        { userId }
      );
      return permissions.includes(resource);
    };

    if (!userStore.isAuthenticated && hasToken) {
      console.log("[Routes] Waiting for user store initialization...");
      userStore.initialize().then(async () => {
        if (!userStore.isAuthenticated) {
          const redirectUrl = `/login?redirect=${encodeURIComponent(ctx.to.url)}`;
          ctx.router.navigate(redirectUrl, { reloadCurrent: true, clearPreviousHistory: true });
          ctx.reject();
          return;
        }

        const hasAccess = await checkResource();
        if (!hasAccess) {
          console.log("[Routes] Insufficient permissions, redirecting to home");
          ctx.router.navigate("/home", { reloadCurrent: true });
          ctx.reject();
          return;
        }

        ctx.resolve();
      });
      return;
    }

    if (!userStore.isAuthenticated) {
      const redirectUrl = `/login?redirect=${encodeURIComponent(ctx.to.url)}`;
      ctx.router.navigate(redirectUrl, { reloadCurrent: true, clearPreviousHistory: true });
      ctx.reject();
      return;
    }

    checkResource().then((hasAccess) => {
      if (!hasAccess) {
        console.log("[Routes] Insufficient permissions, redirecting to home");
        ctx.router.navigate("/home", { reloadCurrent: true });
        ctx.reject();
        return;
      }
      ctx.resolve();
    });
  };
}
```

Add the following imports at the top of `routes.ts`:

```ts
import { convex } from "../lib/convexClient";
import { api } from "@convex/_generated/api";
```

Remove the `Role` import and the `RouteConfig` type's `roles?: Role[]` field (replace with `resource?: string`).

- [ ] **Step 3: Update all route definitions**

Replace every `createAuthGuard([...roles])` call with `createAuthGuard("resource")`. Reference table:

| Old call | New call |
|---|---|
| `createAuthGuard([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT])` on `/home` | `createAuthGuard()` |
| `createAuthGuard([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT])` on `/notifications` | `createAuthGuard()` |
| `createAuthGuard([Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT])` on `/planning` | `createAuthGuard("planning")` |
| `createAuthGuard([Role.ADMIN, Role.TEACHER])` on `/protocol` | `createAuthGuard("protocol")` |
| `createAuthGuard([Role.ADMIN, Role.TEACHER])` on `/rup` | `createAuthGuard("rup")` |
| `createAuthGuard([Role.ADMIN, Role.TEACHER])` on `/specialty-catalog` | `createAuthGuard("specialty-catalog")` |
| `createAuthGuard([Role.ADMIN, Role.TEACHER])` on `/student-card` | `createAuthGuard("student-card")` |
| `createAuthGuard([Role.ADMIN, Role.TEACHER])` on `/teacher-card` | `createAuthGuard("teacher-card")` |
| `createAuthGuard([Role.ADMIN])` on `/analytics` | `createAuthGuard("analytics")` |
| `createAuthGuard([Role.ADMIN])` on `/reports` | `createAuthGuard("reports")` |
| `createAuthGuard([Role.ADMIN])` on `/workload-management` | `createAuthGuard("workload")` |
| `createAuthGuard([Role.ADMIN])` on `/cabinet-management` | `createAuthGuard("cabinet-management")` |
| `createAuthGuard([...all roles])` on `/profile` | `createAuthGuard()` |

Also remove all `options: { roles: [...] }` fields from route objects — they are no longer used.

- [ ] **Step 4: Remove Role import from routes.ts**

Delete the `import { Role } from "../types/user";` line from `routes.ts`.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npm run tsc
```

Expected: no errors. Fix any remaining uses of `AccessControl` interface or `checkAccess` in other files if the compiler flags them.

- [ ] **Step 6: Commit**

```bash
git add src/composables/useRouteGuard.ts src/js/routes.ts
git commit -m "feat(rbac): update route guards to use resource-based permissions"
```

---

## Task 13: Delete backend/ and clean stale references

**Files:**
- Delete: `backend/` directory
- Modify: `package.json`
- Modify: `src/components/JournalTab.vue`
- Modify: `src/components/FloatingJournalRow.vue`
- Modify: `src/stores/marksStore.ts`
- Modify: `src/lib/auth.ts`

- [ ] **Step 1: Delete the backend directory**

```bash
rm -rf backend/
```

- [ ] **Step 2: Remove backend workspace from package.json**

In `package.json`, find and remove any `"workspaces"` entry that includes `"backend"` or `"./backend"`. If `workspaces` becomes empty, remove the key entirely.

- [ ] **Step 3: Remove stale tRPC comments from JournalTab.vue**

Open `src/components/JournalTab.vue`. Find and delete these 4 comment lines (they appear near marks update calls):

- Line ~1733: `// Pending updates map for optimistic UI (no longer needed with direct tRPC)`
- Line ~1932: `// No need to flush - updates are immediate with tRPC`
- Line ~3081: `// No need to flush - updates are immediate with tRPC`
- Line ~3096: `// No need to flush - updates are immediate with tRPC`

- [ ] **Step 4: Remove stale tRPC comments from FloatingJournalRow.vue**

Open `src/components/FloatingJournalRow.vue`. Find and delete:

- Line ~383: `// No need to flush - updates are immediate with tRPC`
- Line ~437: `// No need to flush - updates are immediate with tRPC`

- [ ] **Step 5: Remove stale tRPC comment from marksStore.ts**

Open `src/stores/marksStore.ts`. Find and delete:

- Line ~439: `// Update a specific mark for a student - now uses tRPC directly`

- [ ] **Step 6: Remove unused getAuthHeaders from src/lib/auth.ts**

Open `src/lib/auth.ts`. Delete the entire `getAuthHeaders` function (it is already marked as "currently unused" in the file comment). Keep `isAuthenticated` and `getAuthToken` if they are used elsewhere.

- [ ] **Step 7: Verify nothing imported from backend/**

```bash
grep -r "from.*backend\|require.*backend" src/ convex/ --include="*.ts" --include="*.vue"
```

Expected: no results.

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npm run tsc
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: delete tRPC backend directory and remove stale references"
```

---

## Task 14: Final verification

- [ ] **Step 1: Run all unit tests**

```bash
npm test
```

Expected: all tests pass, including the new rbac.spec.ts.

- [ ] **Step 2: Start the dev server and verify nav**

```bash
npm run dev
```

Log in as a TEACHER user. Verify:
- Nav shows journals, planning, protocol, reports, rup, schedule, settings
- Nav does NOT show analytics, workload, cabinet-management, specialty-catalog, student-card, teacher-card

Log in as an ADMIN user. Verify all nav items appear.

- [ ] **Step 3: Verify route guard blocks unauthorized access**

While logged in as a TEACHER, navigate directly to `/analytics` in the browser. Expected: redirected to `/home`.

- [ ] **Step 4: Verify permission enforcement on backend**

In the Convex dashboard, run `marks/mutations:updateMark` with a `userId` of a STUDENT user. Expected: `ConvexError { code: "FORBIDDEN" }`.

- [ ] **Step 5: Commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: final RBAC verification fixes" # only if changes were needed
```
