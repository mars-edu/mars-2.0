# KTP Metadata Port + Divergence Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add concept-v2 KTP plan metadata (color, languages, fully-loaded badge) to mars-2.0 and fix local/backend divergence bugs in the KTP layer.

**Architecture:** Two optional fields on the `ktps` Convex table flow through ktpStore into KtpPage cards and two popovers (create + edit). A new `reorderDetails` mutation and a `replace` flag on `bulkImportDetails` close the client/server divergence. Pure helpers (`toNullableNumber`, `parsePlannedHours`, `semesterIdsMatch`, `isKtpFullyLoaded`, `validateReorder`) carry the testable logic; a composable resolves planned hours from RUP `distributionEntries`.

**Tech Stack:** Vue 3 + Framework7, Pinia (`ktpStore`), Convex (`convex/ktps`), Jest (`npm test`), Playwright e2e.

**Spec:** `docs/superpowers/specs/2026-06-07-ktp-metadata-port-design.md`

---

### Task 1: Schema fields + create/update mutation args

**Files:**
- Modify: `convex/schema.ts:522-530` (ktps table)
- Modify: `convex/ktps/mutations.ts:8-24` (create), `convex/ktps/mutations.ts:29-53` (update)

- [ ] **Step 1: Add fields to ktps table**

In `convex/schema.ts`, replace:

```ts
  ktps: defineTable({
    rupEntryId: v.string(), // Reference to rupEntries
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
    eventId: v.optional(v.string()), // Reference to calendarEvents
    name: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
```

with:

```ts
  ktps: defineTable({
    rupEntryId: v.string(), // Reference to rupEntries
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
    eventId: v.optional(v.string()), // Reference to calendarEvents
    name: v.optional(v.string()),
    color: v.optional(v.string()), // hex, e.g. '#FACC15'
    languages: v.optional(v.array(v.string())), // subset of ['KZ','RU','EN']
    createdAt: v.number(),
    updatedAt: v.number(),
  })
```

- [ ] **Step 2: Add fields to create mutation args**

In `convex/ktps/mutations.ts`, in `create`, replace:

```ts
  args: {
    rupEntryId: v.string(),
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
    eventId: v.optional(v.string()),
    name: v.optional(v.string()),
  },
```

with:

```ts
  args: {
    rupEntryId: v.string(),
    academicYearId: v.string(),
    semesterId: v.id("academicYearSemesters"),
    eventId: v.optional(v.string()),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
  },
```

(The handler already spreads `...args` — no handler change needed.)

- [ ] **Step 3: Add fields to update mutation args**

In `convex/ktps/mutations.ts`, in `update`, replace:

```ts
  args: {
    id: v.id("ktps"),
    rupEntryId: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    semesterId: v.optional(v.id("academicYearSemesters")),
    eventId: v.optional(v.string()),
    name: v.optional(v.string()),
  },
```

with:

```ts
  args: {
    id: v.id("ktps"),
    rupEntryId: v.optional(v.string()),
    academicYearId: v.optional(v.string()),
    semesterId: v.optional(v.id("academicYearSemesters")),
    eventId: v.optional(v.string()),
    name: v.optional(v.string()),
    color: v.optional(v.string()),
    languages: v.optional(v.array(v.string())),
  },
```

(Handler already filters undefined and patches — no handler change.)

- [ ] **Step 4: Regenerate Convex types**

Run: `npx convex codegen`
Expected: completes without schema errors.

- [ ] **Step 5: Commit**

```bash
git add convex/schema.ts convex/ktps/mutations.ts convex/_generated
git commit -m "feat(ktp): add color and languages fields to ktps schema"
```

---

### Task 2: validateReorder pure helper (TDD)

**Files:**
- Create: `convex/ktps/lib.ts`
- Test: `convex/ktps/__tests__/lib.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `convex/ktps/__tests__/lib.spec.ts`:

```ts
import { validateReorder } from "../lib";

describe("validateReorder", () => {
  it("accepts an exact permutation", () => {
    expect(validateReorder(["a", "b", "c"], ["c", "a", "b"])).toBeNull();
  });

  it("rejects a list with wrong length", () => {
    expect(validateReorder(["a", "b"], ["a"])).toMatch(/length/i);
  });

  it("rejects unknown ids", () => {
    expect(validateReorder(["a", "b"], ["a", "x"])).toMatch(/unknown/i);
  });

  it("rejects duplicate ids", () => {
    expect(validateReorder(["a", "b"], ["a", "a"])).toMatch(/duplicate/i);
  });

  it("accepts empty lists", () => {
    expect(validateReorder([], [])).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- convex/ktps/__tests__/lib.spec.ts`
Expected: FAIL — `Cannot find module '../lib'`

- [ ] **Step 3: Write implementation**

Create `convex/ktps/lib.ts`:

```ts
/**
 * Validates that orderedIds is an exact permutation of existingIds.
 * Returns an error message or null when valid.
 */
export function validateReorder(
  existingIds: string[],
  orderedIds: string[]
): string | null {
  if (orderedIds.length !== existingIds.length) {
    return `Reorder list length ${orderedIds.length} does not match existing details count ${existingIds.length}`;
  }
  if (new Set(orderedIds).size !== orderedIds.length) {
    return "Duplicate ids in reorder list";
  }
  const existing = new Set(existingIds);
  for (const id of orderedIds) {
    if (!existing.has(id)) {
      return `Unknown detail id in reorder list: ${id}`;
    }
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- convex/ktps/__tests__/lib.spec.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add convex/ktps/lib.ts convex/ktps/__tests__/lib.spec.ts
git commit -m "feat(ktp): add validateReorder helper with tests"
```

---

### Task 3: reorderDetails mutation

**Files:**
- Modify: `convex/ktps/mutations.ts` (append after `removeDetail`, line ~147)

- [ ] **Step 1: Add the mutation**

In `convex/ktps/mutations.ts`, add to imports at the top:

```ts
import { validateReorder } from "./lib";
```

Append after the `removeDetail` mutation:

```ts
/**
 * Atomically reorder all details of a ktp.
 * orderedIds must be an exact permutation of the ktp's current detail ids.
 * Positions are rewritten 1..n in the given order.
 */
export const reorderDetails = mutation({
  args: {
    ktpId: v.id("ktps"),
    orderedIds: v.array(v.id("ktpDetails")),
  },
  handler: async (ctx, args) => {
    const details = await ctx.db
      .query("ktpDetails")
      .withIndex("by_ktpId", (q) => q.eq("ktpId", args.ktpId))
      .collect();

    const error = validateReorder(
      details.map((d) => d._id),
      args.orderedIds
    );
    if (error) {
      throw new Error(error);
    }

    for (let i = 0; i < args.orderedIds.length; i++) {
      await ctx.db.patch(args.orderedIds[i], {
        position: i + 1,
        ...updateTimestamp(),
      });
    }

    return { success: true, reordered: args.orderedIds.length };
  },
});
```

- [ ] **Step 2: Regenerate types and verify**

Run: `npx convex codegen && npm test -- convex/ktps/__tests__/lib.spec.ts`
Expected: codegen OK, tests PASS.

- [ ] **Step 3: Commit**

```bash
git add convex/ktps/mutations.ts convex/_generated
git commit -m "feat(ktp): add reorderDetails mutation for persistent topic ordering"
```

---

### Task 4: bulkImportDetails replace flag

**Files:**
- Modify: `convex/ktps/mutations.ts:175-208` (bulkImportDetails)

- [ ] **Step 1: Add replace arg and clearing logic**

In `bulkImportDetails`, add to `args` (after `ktpId`):

```ts
    replace: v.optional(v.boolean()),
```

Replace the handler:

```ts
  handler: async (ctx, args) => {
    if (args.replace) {
      const existing = await ctx.db
        .query("ktpDetails")
        .withIndex("by_ktpId", (q) => q.eq("ktpId", args.ktpId))
        .collect();
      for (const detail of existing) {
        await ctx.db.delete(detail._id);
      }
    }

    const timestamps = createTimestamps();
    const insertedIds = [];

    for (const detail of args.details) {
      const id = await ctx.db.insert("ktpDetails", {
        ktpId: args.ktpId,
        ...detail,
        ...timestamps,
      });
      insertedIds.push(id);
    }

    return { success: true, insertedIds };
  },
```

- [ ] **Step 2: Regenerate types**

Run: `npx convex codegen`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add convex/ktps/mutations.ts convex/_generated
git commit -m "feat(ktp): add replace flag to bulkImportDetails to prevent duplicate rows"
```

---

### Task 5: Client pure helpers (TDD)

**Files:**
- Create: `src/lib/ktpHelpers.ts`
- Test: `src/lib/__tests__/ktpHelpers.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/ktpHelpers.spec.ts`:

```ts
import {
  toNullableNumber,
  parsePlannedHours,
  semesterIdsMatch,
  isKtpFullyLoaded,
} from "../ktpHelpers";

describe("toNullableNumber", () => {
  it("returns null for empty string", () => expect(toNullableNumber("")).toBeNull());
  it("returns null for null/undefined", () => {
    expect(toNullableNumber(null)).toBeNull();
    expect(toNullableNumber(undefined)).toBeNull();
  });
  it("preserves zero", () => {
    expect(toNullableNumber(0)).toBe(0);
    expect(toNullableNumber("0")).toBe(0);
  });
  it("parses numeric strings", () => expect(toNullableNumber("5")).toBe(5));
  it("returns null for garbage", () => expect(toNullableNumber("abc")).toBeNull());
});

describe("parsePlannedHours", () => {
  it("parses positive string hours", () => expect(parsePlannedHours("90")).toBe(90));
  it("returns null for zero (no budget known)", () => expect(parsePlannedHours("0")).toBeNull());
  it("returns null for garbage", () => expect(parsePlannedHours("n/a")).toBeNull());
  it("returns null for null/undefined", () => {
    expect(parsePlannedHours(null)).toBeNull();
    expect(parsePlannedHours(undefined)).toBeNull();
  });
});

describe("semesterIdsMatch", () => {
  const resolve = (id: string) => (id === "ays_1" ? "1" : id === "ays_2" ? "2" : null);

  it("matches identical ids", () => {
    expect(semesterIdsMatch("ays_1", "ays_1", resolve)).toBe(true);
  });
  it("matches Convex id against semester number string", () => {
    expect(semesterIdsMatch("ays_1", "1", resolve)).toBe(true);
  });
  it("matches semester number string against Convex id", () => {
    expect(semesterIdsMatch("1", "ays_1", resolve)).toBe(true);
  });
  it("rejects different semesters", () => {
    expect(semesterIdsMatch("ays_1", "2", resolve)).toBe(false);
    expect(semesterIdsMatch("ays_1", "ays_2", resolve)).toBe(false);
  });
});

describe("isKtpFullyLoaded", () => {
  const d = (theme: string, totalHours: number | null) => ({ theme, totalHours });

  it("true when all themed and hours meet budget", () => {
    expect(isKtpFullyLoaded([d("Тема 1", 45), d("Тема 2", 45)], 90)).toBe(true);
  });
  it("false when budget unknown (null)", () => {
    expect(isKtpFullyLoaded([d("Тема 1", 90)], null)).toBe(false);
  });
  it("false when no details", () => {
    expect(isKtpFullyLoaded([], 90)).toBe(false);
  });
  it("false when a theme is empty or whitespace", () => {
    expect(isKtpFullyLoaded([d("Тема 1", 45), d("  ", 45)], 90)).toBe(false);
  });
  it("false when hours below budget", () => {
    expect(isKtpFullyLoaded([d("Тема 1", 40)], 90)).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/__tests__/ktpHelpers.spec.ts`
Expected: FAIL — `Cannot find module '../ktpHelpers'`

- [ ] **Step 3: Write implementation**

Create `src/lib/ktpHelpers.ts`:

```ts
/**
 * Coerce a form/input value into number|null.
 * Unlike `x ? Number(x) : null`, this preserves 0.
 */
export function toNullableNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a distributionEntry.hours string into a planned-hours budget.
 * Zero or unparseable hours mean "no budget known" -> null
 * (prevents the fully-loaded badge from being trivially true via sum >= 0).
 */
export function parsePlannedHours(
  hours: string | number | null | undefined
): number | null {
  if (hours === null || hours === undefined) return null;
  const n = Number(hours);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Match a distributionEntry semester id against a ktp semester id.
 * Handles the storage inconsistency where ktps may hold semester NUMBER
 * strings ("1"/"2") while distributionEntries hold academicYearSemesters
 * Convex ids (or vice versa). resolveSemesterNumber maps a Convex id to
 * its semesterNumber string, or null when unknown.
 */
export function semesterIdsMatch(
  distSemesterId: string,
  ktpSemesterId: string,
  resolveSemesterNumber: (id: string) => string | null
): boolean {
  if (distSemesterId === ktpSemesterId) return true;
  const distNum = resolveSemesterNumber(distSemesterId);
  if (distNum !== null && distNum === ktpSemesterId) return true;
  const ktpNum = resolveSemesterNumber(ktpSemesterId);
  return ktpNum !== null && ktpNum === distSemesterId;
}

export interface KtpDetailLike {
  theme: string;
  totalHours: number | null;
}

/**
 * concept-v2 "fully loaded" condition: details exist, every theme
 * non-empty (trimmed), and total hours meet the planned budget.
 */
export function isKtpFullyLoaded(
  details: KtpDetailLike[],
  plannedHours: number | null
): boolean {
  if (plannedHours === null) return false;
  if (details.length === 0) return false;
  if (!details.every((d) => d.theme && d.theme.trim() !== "")) return false;
  const total = details.reduce((sum, d) => sum + (d.totalHours || 0), 0);
  return total >= plannedHours;
}

/** concept-v2 EditKtpModal palette */
export const KTP_COLORS = [
  "#FACC15", "#60A5FA", "#F87171", "#4ADE80",
  "#A78BFA", "#FB923C", "#2DD4BF", "#F472B6",
];

export const KTP_LANGUAGES = ["KZ", "RU", "EN"];
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/__tests__/ktpHelpers.spec.ts`
Expected: PASS (17 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/ktpHelpers.ts src/lib/__tests__/ktpHelpers.spec.ts
git commit -m "feat(ktp): add pure helpers for coercion, planned hours, badge condition"
```

---

### Task 6: ktpStore — fields, updateKtp, persisted reorder, delete fixes

**Files:**
- Modify: `src/stores/ktpStore.ts`

- [ ] **Step 1: Extend Ktp interface**

In `src/stores/ktpStore.ts`, replace the `Ktp` interface (lines 8-17):

```ts
export interface Ktp {
  id: string;
  rupEntryId: string;
  academicYearId: string;
  semesterId: string;
  eventId?: string; // Back-reference to the calendar event (if KTP is event-specific)
  name?: string; // Optional custom name for the KTP
  color?: string; // hex, e.g. '#FACC15'
  languages?: string[]; // subset of ['KZ','RU','EN']
  createdAt: Date;
  updatedAt: Date;
}
```

- [ ] **Step 2: Pass new fields through createKtp and ensureKtpForRupEntry**

Replace `createKtp` (lines 78-110):

```ts
    async function createKtp(
      rupEntryId: string,
      academicYearId: string,
      semesterId: string,
      eventId?: string,
      name?: string,
      extra?: { color?: string; languages?: string[] }
    ): Promise<Ktp> {
      const id = await convex.mutation(api.ktps.mutations.create, {
        rupEntryId,
        academicYearId,
        semesterId,
        eventId,
        name,
        color: extra?.color,
        languages: extra?.languages,
      });
      const created = await convex.query(api.ktps.queries.getById, { id });
      if (created) {
        const mapped: Ktp = {
          id: created._id,
          rupEntryId: created.rupEntryId,
          academicYearId: created.academicYearId,
          semesterId: created.semesterId,
          eventId: created.eventId,
          name: created.name,
          color: created.color,
          languages: created.languages,
          createdAt: new Date(created.createdAt),
          updatedAt: new Date(created.updatedAt),
        };
        ktps.value.push(mapped);
        return mapped;
      }

      // Fallback if query fails
      throw new Error("Failed to create KTP");
    }
```

Replace `ensureKtpForRupEntry` (lines 112-124):

```ts
    async function ensureKtpForRupEntry(
      rupEntryId: string,
      academicYearId: string,
      semesterId: string,
      eventId?: string,
      name?: string,
      extra?: { color?: string; languages?: string[] }
    ): Promise<Ktp> {
      if (!semesterId) {
        throw new Error("semesterId is required to create a KTP");
      }
      const existing = findKtpByRupEntryId(rupEntryId, academicYearId, semesterId, eventId);
      return existing || await createKtp(rupEntryId, academicYearId, semesterId, eventId, name, extra);
    }
```

(Existing callers pass fewer args — optional param is backward compatible.)

- [ ] **Step 3: Add updateKtp action**

Add after `ensureKtpForRupEntry`:

```ts
    async function updateKtp(
      id: string,
      data: { name?: string; color?: string; languages?: string[] }
    ) {
      await convex.mutation(api.ktps.mutations.update, {
        id: id as any,
        ...data,
      });
      const index = ktps.value.findIndex((k) => k.id === id);
      if (index !== -1) {
        ktps.value[index] = { ...ktps.value[index], ...data };
      }
    }
```

- [ ] **Step 4: Hydrate new fields in loadFromBackend**

In `loadFromBackend` (lines 481-491), replace the ktp push:

```ts
          ktps.value.push({
            id: ktp._id,
            rupEntryId: ktp.rupEntryId,
            academicYearId: ktp.academicYearId,
            semesterId: ktp.semesterId,
            eventId: ktp.eventId,
            name: ktp.name,
            color: ktp.color,
            languages: ktp.languages,
            createdAt: new Date(ktp.createdAt),
            updatedAt: new Date(ktp.updatedAt),
          });
```

- [ ] **Step 5: Extract refreshDetailsFromBackend helper**

Add after `fetchDetailsForKtp` (around line 145). This is the existing re-query logic from `bulkImportKtpDetails`, extracted for reuse:

```ts
    /** Re-query one ktp from Convex and replace its local details. */
    async function refreshDetailsFromBackend(ktpId: string): Promise<number> {
      const updated = await convex.query(api.ktps.queries.getById, { id: ktpId as any });
      if (!updated || !updated.details) return 0;
      ktpDetails.value = ktpDetails.value.filter((d) => d.ktpId !== ktpId);
      const mappedDetails = updated.details.map((d: any) => ({
        id: d._id,
        ktpId: d.ktpId,
        position: d.position,
        theme: d.theme,
        totalHours: d.totalHours ?? null,
        srsp: d.srsp ?? null,
        srs: d.srs ?? null,
        theoretical: d.theoretical ?? null,
        practical: d.practical ?? null,
        individual: d.individual ?? null,
        homework: d.homework,
        notes: d.notes,
      }));
      ktpDetails.value.push(...mappedDetails);
      return mappedDetails.length;
    }
```

- [ ] **Step 6: Persist reorder to backend**

Replace `reorderKtpDetails` (lines 270-296) with an async version — optimistic local rewrite, then mutation, revert via refresh on failure:

```ts
    async function reorderKtpDetails(ktpId: string, reorderedIds: string[]) {
      try {
        error.value = null;

        const parentDetails = ktpDetails.value.filter((d) => d.ktpId === ktpId);
        const otherDetails = ktpDetails.value.filter((d) => d.ktpId !== ktpId);

        const validIds = new Set(parentDetails.map((d) => d.id));
        const filteredOrder = reorderedIds.filter((id) => validIds.has(id));
        if (filteredOrder.length !== parentDetails.length) {
          throw new Error("Reorder list does not match parent items");
        }

        const mapById = new Map(parentDetails.map((d) => [d.id, d] as const));
        const reorderedDetails = filteredOrder.map((id, index) => ({
          ...mapById.get(id)!,
          position: index + 1,
        }));

        // Optimistic local update
        ktpDetails.value = [...otherDetails, ...reorderedDetails];

        // Persist to backend; revert local state from backend on failure
        try {
          await convex.mutation(api.ktps.mutations.reorderDetails, {
            ktpId: ktpId as any,
            orderedIds: filteredOrder as any,
          });
        } catch (mutationErr) {
          await refreshDetailsFromBackend(ktpId);
          throw mutationErr;
        }

        return { success: true, reordered: reorderedDetails.length };
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to reorder items";
        return { success: false, error: error.value };
      }
    }
```

- [ ] **Step 7: Persist deleteKtpByRupEntryId to backend**

Replace `deleteKtpByRupEntryId` (lines 230-248):

```ts
    async function deleteKtpByRupEntryId(
      rupEntryId: string,
      academicYearId?: string,
      semesterId?: string
    ) {
      const ktp = findKtpByRupEntryId(rupEntryId, academicYearId, semesterId);
      if (!ktp) return { success: true, deleted: 0 };

      // Delete on backend first (cascades to details server-side)
      await convex.mutation(api.ktps.mutations.remove, {
        id: ktp.id as any,
      });

      const deletedDetails = ktpDetails.value.filter(
        (d) => d.ktpId === ktp.id
      ).length;
      ktpDetails.value = ktpDetails.value.filter((d) => d.ktpId !== ktp.id);
      ktps.value = ktps.value.filter((k) => k.id !== ktp.id);

      return { success: true, deleted: deletedDetails };
    }
```

(No callers outside the store exist today — `grep -rn "deleteKtpByRupEntryId" src/` should show only `ktpStore.ts`; verify and stop if other callers appear.)

- [ ] **Step 8: Scope deleteKtpDetail renumbering to the affected ktp**

Replace `deleteKtpDetail` (lines 212-221):

```ts
    async function deleteKtpDetail(id: string) {
      const target = ktpDetails.value.find((d) => d.id === id);
      await convex.mutation(api.ktps.mutations.removeDetail, {
        id: id as any,
      });

      ktpDetails.value = ktpDetails.value.filter((d) => d.id !== id);
      if (target) {
        // Renumber only the affected ktp's details, in position order
        ktpDetails.value
          .filter((d) => d.ktpId === target.ktpId)
          .sort((a, b) => a.position - b.position)
          .forEach((item, index) => {
            item.position = index + 1;
          });
      }
    }
```

- [ ] **Step 9: Pass replace flag in bulkImportKtpDetails and reuse refresh helper**

In `bulkImportKtpDetails` (lines 298-348), replace the mutation call and the reload block:

```ts
        await convex.mutation(api.ktps.mutations.bulkImportDetails, {
          ktpId: ktpId as any,
          details,
          replace: true,
        });

        // Reload the KTP with new details
        const imported = await refreshDetailsFromBackend(ktpId);
        return { success: true, imported };
```

(Delete the now-unused inline re-query/mapping block that followed the mutation call. Keep the surrounding try/catch unchanged.)

- [ ] **Step 10: Export new members**

In the store's return object, add `updateKtp` after `ensureKtpForRupEntry`, and `refreshDetailsFromBackend` after `fetchDetailsForKtp`.

- [ ] **Step 11: Run full test suite**

Run: `npm test`
Expected: PASS (all suites, including the new helper specs).

- [ ] **Step 12: Commit**

```bash
git add src/stores/ktpStore.ts
git commit -m "fix(ktp): persist reorder and rupEntry-scoped delete to backend, scope renumbering, replace-mode import"
```

---

### Task 7: useKtpPlannedHours composable

**Files:**
- Create: `src/composables/useKtpPlannedHours.ts`

- [ ] **Step 1: Create the composable**

Create `src/composables/useKtpPlannedHours.ts`. Lives outside ktpStore to avoid cross-store imports (see ktpStore.ts:466 comment):

```ts
import { useKtpStore } from "@/stores/ktpStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { parsePlannedHours, semesterIdsMatch } from "@/lib/ktpHelpers";

/**
 * Resolves the planned-hours budget for a KTP from its RUP
 * distributionEntry (matched by academicYearId + semester).
 * Returns null when the budget cannot be resolved — callers treat
 * null as "no budget known" (skip badge / skip hours warning).
 */
export function useKtpPlannedHours() {
  const ktpStore = useKtpStore();
  const rupEntryStore = useRupEntryStore();
  const academicYearSemesterStore = useAcademicYearSemesterStore();

  const resolveSemesterNumber = (id: string): string | null => {
    // Defensive against getter shape (fn vs computed-ref), mirrors
    // KtpDetailPopupBody's existing fallback pattern.
    const getter: any = (academicYearSemesterStore as any)
      .getAcademicYearSemesterById;
    const ays =
      typeof getter === "function"
        ? getter(id)
        : typeof getter?.value === "function"
          ? getter.value(id)
          : null;
    return ays ? String(ays.semesterNumber) : null;
  };

  function getPlannedHoursForKtp(ktpId: string): number | null {
    const ktp = ktpStore.findKtpById(ktpId);
    if (!ktp) return null;
    const rupEntry = rupEntryStore.getRupEntryById(ktp.rupEntryId);
    if (!rupEntry) return null;
    const dist = rupEntry.distributionEntries.find(
      (d: { academicYearId: string; semesterId: string }) =>
        d.academicYearId === ktp.academicYearId &&
        semesterIdsMatch(d.semesterId, ktp.semesterId, resolveSemesterNumber)
    );
    return dist ? parsePlannedHours(dist.hours) : null;
  }

  return { getPlannedHoursForKtp };
}
```

- [ ] **Step 2: Run tests (regression)**

Run: `npm test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/composables/useKtpPlannedHours.ts
git commit -m "feat(ktp): add useKtpPlannedHours composable resolving budget from RUP distribution"
```

---

### Task 8: KtpDetailFormPopover — zero-safe coercion

**Files:**
- Modify: `src/components/KtpDetailFormPopover.vue:285-327`

- [ ] **Step 1: Import helper**

Add to the script imports:

```ts
import { toNullableNumber } from "@/lib/ktpHelpers";
```

- [ ] **Step 2: Replace coercions in validationResult**

Replace (lines 285-295):

```ts
const validationResult = computed(() => {
  return formSchema.safeParse({
    ...formData,
    totalHours: toNullableNumber(formData.totalHours),
    srsp: toNullableNumber(formData.srsp),
    srs: toNullableNumber(formData.srs),
    theoretical: toNullableNumber(formData.theoretical),
    practical: toNullableNumber(formData.practical),
    individual: toNullableNumber(formData.individual),
  });
});
```

- [ ] **Step 3: Replace coercion in hoursWarning**

Replace line 302 (`const hours = formData.totalHours ? Number(formData.totalHours) : 0;`) with:

```ts
  const hours = toNullableNumber(formData.totalHours) ?? 0;
```

- [ ] **Step 4: Replace coercions in handleSave dataToSave**

Replace (lines 319-327):

```ts
  const dataToSave = {
    ...formData,
    totalHours: toNullableNumber(formData.totalHours),
    srsp: toNullableNumber(formData.srsp),
    srs: toNullableNumber(formData.srs),
    theoretical: toNullableNumber(formData.theoretical),
    practical: toNullableNumber(formData.practical),
    individual: toNullableNumber(formData.individual),
  };
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev:all`, open a KTP detail form, enter `0` in «Всего часов», save, reopen — value shows `0`, not `—`.

- [ ] **Step 6: Commit**

```bash
git add src/components/KtpDetailFormPopover.vue
git commit -m "fix(ktp): preserve zero hours in form coercion"
```

---

### Task 9: KtpDetailPopupBody — real semester budget, fixed remaining hours, awaited reorder

**Files:**
- Modify: `src/components/KtpDetailPopupBody.vue`

- [ ] **Step 1: Import composable**

Add to script imports:

```ts
import { useKtpPlannedHours } from "@/composables/useKtpPlannedHours";
```

Add after the store setup (near line 232):

```ts
const { getPlannedHoursForKtp } = useKtpPlannedHours();
```

- [ ] **Step 2: Replace semesterPlannedHours with the real budget**

Replace (lines 301-308):

```ts
// Planned-hours budget from the RUP distributionEntry (null = unknown)
const semesterPlannedHours = computed(() => {
  if (!props.ktpId) return null;
  return getPlannedHoursForKtp(props.ktpId);
});
```

- [ ] **Step 3: Update hour-counter template**

Replace the «на семестр» row value (template lines 17-22):

```html
          <div class="flex justify-between mb-2">
            <span class="text-foreground">Запланировано на семестр:</span>
            <span class="text-foreground font-medium"
              >{{ semesterPlannedHours ?? "—" }} часов</span
            >
          </div>
```

- [ ] **Step 4: Fix remainingHoursForForm double-count**

Replace (lines 503-514):

```ts
// Hours validation: remaining hours available for the form.
// Budget comes from the RUP distributionEntry; undefined disables the warning.
const remainingHoursForForm = computed(() => {
  const planned = semesterPlannedHours.value;
  if (planned === null) return undefined;
  const editId = editingDetail.value?.id;
  const usedByOthers = ktpDetails.value.reduce((sum, d) => {
    if (d.id === editId) return sum;
    return sum + (d.totalHours || 0);
  }, 0);
  return planned - usedByOthers;
});
```

- [ ] **Step 5: Await the now-async reorder in onDrop**

Replace `function onDrop() {` (line 552) with `async function onDrop() {` and line 584:

```ts
  const result = await ktpStore.reorderKtpDetails(props.ktpId, newOrder);
```

(The rest of `onDrop` is unchanged — `result.success` checks still work.)

- [ ] **Step 6: Run tests + manual check**

Run: `npm test`
Expected: PASS.
Manual: open a KTP with a RUP distribution — «на семестр» shows the distribution hours (or «—»); drag a row, reload page — order persists.

- [ ] **Step 7: Commit**

```bash
git add src/components/KtpDetailPopupBody.vue
git commit -m "fix(ktp): real semester budget in hour counter, correct remaining-hours, persisted reorder"
```

---

### Task 10: AddKtpItemForm — color + languages

**Files:**
- Modify: `src/components/AddKtpItemForm.vue`

- [ ] **Step 1: Add state to script**

After `const rupEntryId = ref("");` (line 113), add (`KTP_COLORS`/`KTP_LANGUAGES` come from `src/lib/ktpHelpers.ts`, created in Task 5):

```ts
import { KTP_COLORS, KTP_LANGUAGES } from "@/lib/ktpHelpers";

const selectedColor = ref(KTP_COLORS[0]);
const selectedLanguages = ref<string[]>([]);

const toggleLanguage = (lang: string) => {
  if (selectedLanguages.value.includes(lang)) {
    selectedLanguages.value = selectedLanguages.value.filter((l) => l !== lang);
  } else {
    selectedLanguages.value = [...selectedLanguages.value, lang];
  }
};
```

(Place the `import` with the other imports at the top of the script block.)

- [ ] **Step 2: Add template blocks**

After the selected-entry preview div (template line 70, before `</div>` closing the body), add:

```html
        <!-- Color -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Цвет
          </label>
          <div class="flex gap-2">
            <button
              v-for="color in KTP_COLORS"
              :key="color"
              type="button"
              class="w-8 h-8 rounded-lg transition-all"
              :class="selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'"
              :style="{ backgroundColor: color }"
              :data-testid="`ktp-color-${color.slice(1)}`"
              @click="selectedColor = color"
            />
          </div>
        </div>

        <!-- Languages -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Языки обучения
          </label>
          <div class="flex gap-2">
            <button
              v-for="lang in KTP_LANGUAGES"
              :key="lang"
              type="button"
              class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              :class="selectedLanguages.includes(lang)
                ? 'bg-primary text-primary-foreground scale-105'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'"
              :data-testid="`ktp-lang-${lang}`"
              @click="toggleLanguage(lang)"
            >
              {{ lang }}
            </button>
          </div>
        </div>
```

- [ ] **Step 3: Pass through on save and reset**

In `handleSave`, replace the `ensureKtpForRupEntry` call (lines 178-182):

```ts
    const ktp = await ktpStore.ensureKtpForRupEntry(
      rupEntryId.value,
      props.selectedAcademicYearId,
      props.selectedSemesterId,
      undefined,
      undefined,
      {
        color: selectedColor.value,
        languages: selectedLanguages.value.length
          ? selectedLanguages.value
          : undefined,
      }
    );
```

In `resetForm`, add:

```ts
  selectedColor.value = KTP_COLORS[0];
  selectedLanguages.value = [];
```

- [ ] **Step 4: Manual check**

Run app, КТП page → Создать: color row + language pills render; create succeeds with toast.

- [ ] **Step 5: Commit**

```bash
git add src/components/AddKtpItemForm.vue
git commit -m "feat(ktp): color and language selection in KTP creation form"
```

---

### Task 11: KtpEditPopover component

**Files:**
- Create: `src/components/KtpEditPopover.vue`

- [ ] **Step 1: Create component**

Create `src/components/KtpEditPopover.vue`:

```vue
<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="ktp-edit-popover"
    :opened="opened"
    @popover:closed="emit('update:opened', false)"
    style="width: 420px !important; max-width: calc(100vw - 32px) !important"
  >
    <div class="bg-card text-card-foreground rounded-2xl overflow-hidden flex flex-col">
      <PopoverHeader
        title="Редактировать КТП"
        subtitle="Цвет и языки обучения"
        :on-cancel="requestClose"
      />

      <div class="flex-1 overflow-y-auto px-8 pb-6 space-y-6">
        <!-- Color -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Цвет
          </label>
          <div class="flex gap-2">
            <button
              v-for="color in KTP_COLORS"
              :key="color"
              type="button"
              class="w-8 h-8 rounded-lg transition-all"
              :class="selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'"
              :style="{ backgroundColor: color }"
              @click="selectedColor = color"
            />
          </div>
        </div>

        <!-- Languages -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Языки обучения
          </label>
          <div class="flex gap-2">
            <button
              v-for="lang in KTP_LANGUAGES"
              :key="lang"
              type="button"
              class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              :class="selectedLanguages.includes(lang)
                ? 'bg-primary text-primary-foreground scale-105'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'"
              @click="toggleLanguage(lang)"
            >
              {{ lang }}
            </button>
          </div>
        </div>
      </div>

      <PopoverFooter
        save-text="Сохранить"
        :on-save="handleSave"
        :on-cancel="requestClose"
        :disabled="saving"
        :is-loading="saving"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { f7 } from "framework7-vue";
import { useKtpStore, type Ktp } from "@/stores/ktpStore";
import { KTP_COLORS, KTP_LANGUAGES } from "@/lib/ktpHelpers";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";

const props = defineProps<{
  opened: boolean;
  ktp: Ktp | null;
}>();

const emit = defineEmits(["update:opened"]);

const ktpStore = useKtpStore();
const selectedColor = ref(KTP_COLORS[0]);
const selectedLanguages = ref<string[]>([]);
const saving = ref(false);

watch(
  () => [props.opened, props.ktp] as const,
  ([opened, ktp]) => {
    if (opened && ktp) {
      selectedColor.value = ktp.color || KTP_COLORS[0];
      selectedLanguages.value = [...(ktp.languages || [])];
    }
  },
  { immediate: true }
);

const toggleLanguage = (lang: string) => {
  if (selectedLanguages.value.includes(lang)) {
    selectedLanguages.value = selectedLanguages.value.filter((l) => l !== lang);
  } else {
    selectedLanguages.value = [...selectedLanguages.value, lang];
  }
};

const handleSave = async () => {
  if (!props.ktp) return;
  saving.value = true;
  try {
    await ktpStore.updateKtp(props.ktp.id, {
      color: selectedColor.value,
      languages: selectedLanguages.value,
    });
    f7.toast
      .create({ text: "КТП обновлён", closeTimeout: 1500, cssClass: "color-green" })
      .open();
    emit("update:opened", false);
  } catch {
    f7.toast
      .create({ text: "Не удалось сохранить КТП", closeTimeout: 3000, cssClass: "color-red" })
      .open();
    // popover stays open
  } finally {
    saving.value = false;
  }
};
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/KtpEditPopover.vue
git commit -m "feat(ktp): add KtpEditPopover for editing color and languages"
```

---

### Task 12: KtpPage cards — tint, badges, action menu, paperclip

**Files:**
- Modify: `src/pages/KtpPage.vue`

- [ ] **Step 1: Script — imports, state, helpers**

Add imports:

```ts
import IconPaperclip from "~icons/lucide/paperclip";
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconEdit2 from "~icons/lucide/edit-2";
import IconTrash2 from "~icons/lucide/trash-2";
import KtpEditPopover from "@/components/KtpEditPopover.vue";
import { useKtpPlannedHours } from "@/composables/useKtpPlannedHours";
import { isKtpFullyLoaded } from "@/lib/ktpHelpers";
import type { Ktp } from "@/stores/ktpStore";
import { onUnmounted } from "vue";
```

(`ref`, `computed`, `watch`, `onMounted` already imported — extend the existing vue import instead of duplicating.)

Add state + handlers after `const selectedSemesterId = ref<string>("");` (line 252):

```ts
const { getPlannedHoursForKtp } = useKtpPlannedHours();

// Card action menu
const activeMenuKtpId = ref<string | null>(null);
const editingKtp = ref<Ktp | null>(null);
const isEditPopoverOpen = ref(false);

const closeMenus = () => {
  activeMenuKtpId.value = null;
};
window.addEventListener("click", closeMenus);
onUnmounted(() => window.removeEventListener("click", closeMenus));

const toggleCardMenu = (ktpId: string) => {
  activeMenuKtpId.value = activeMenuKtpId.value === ktpId ? null : ktpId;
};

const onEditKtp = (ktpId: string) => {
  activeMenuKtpId.value = null;
  editingKtp.value = ktpStore.findKtpById(ktpId) ?? null;
  if (editingKtp.value) isEditPopoverOpen.value = true;
};

const onDeleteKtp = (ktpId: string) => {
  activeMenuKtpId.value = null;
  const title = getModuleTitleForKtp.value(ktpId);
  f7.dialog.confirm(
    `Удалить КТП «${title}» со всеми темами? Это действие нельзя отменить.`,
    "Удаление КТП",
    async () => {
      const result = await ktpStore.deleteKtpById(ktpId);
      f7.toast
        .create({
          text: result.success
            ? `КТП удалён (тем: ${result.deleted})`
            : "Не удалось удалить КТП",
          closeTimeout: 2000,
          cssClass: result.success ? "color-green" : "color-red",
        })
        .open();
    }
  );
};

const isItemFullyLoaded = (item: any): boolean => {
  if (!item.ktpId) return false;
  const details = ktpStore.getDetailsByKtpId(item.ktpId);
  return isKtpFullyLoaded(details, getPlannedHoursForKtp(item.ktpId));
};

const getKtpColor = (item: any): string | undefined => {
  return item.ktpId ? ktpStore.findKtpById(item.ktpId)?.color : undefined;
};

const getKtpLanguages = (item: any): string[] => {
  return (item.ktpId && ktpStore.findKtpById(item.ktpId)?.languages) || [];
};
```

- [ ] **Step 2: Template — tint the card icon**

Replace the icon block (lines 79-83):

```html
                <div
                  class="flex-shrink-0 p-3 rounded-xl transition-transform group-hover:scale-110"
                  :class="getKtpColor(item) ? '' : 'bg-primary/10 text-primary'"
                  :style="getKtpColor(item)
                    ? { backgroundColor: getKtpColor(item) + '20', color: getKtpColor(item) }
                    : {}"
                >
                  <IconBookOpen class="w-6 h-6" />
                </div>
```

- [ ] **Step 3: Template — language badges next to the title**

Replace the title row (lines 87-93):

```html
                  <div class="flex items-center gap-2 mb-0.5">
                    <h3
                      class="font-semibold text-base truncate group-hover:text-primary transition-colors"
                    >
                      {{ item.moduleIndex }} — {{ item.moduleName }}
                    </h3>
                    <span
                      v-for="lang in getKtpLanguages(item)"
                      :key="lang"
                      class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0"
                    >
                      {{ lang }}
                    </span>
                  </div>
```

- [ ] **Step 4: Template — paperclip badge (fully loaded)**

Right after the card's opening `<div ... @click="selectItem(item)">` (line 76), add:

```html
              <div
                v-if="isItemFullyLoaded(item)"
                class="absolute -top-2.5 -right-2.5 bg-primary text-primary-foreground p-2 rounded-xl shadow-lg rotate-12 group-hover:rotate-0 transition-transform z-10"
                title="План полностью заполнен"
              >
                <IconPaperclip class="w-4 h-4" />
              </div>
```

- [ ] **Step 5: Template — ⋮ action menu before the chevron**

Before the `<IconChevronRight ...>` (line 140), add:

```html
                <!-- Action menu -->
                <div class="relative flex-shrink-0" @click.stop>
                  <button
                    class="p-2 rounded-xl text-muted-foreground/60 hover:text-primary hover:bg-primary/10 transition-colors"
                    :data-testid="`ktp-card-menu-${item.id}`"
                    @click="toggleCardMenu(item.ktpId)"
                  >
                    <IconMoreVertical class="w-5 h-5" />
                  </button>
                  <div
                    v-if="activeMenuKtpId === item.ktpId"
                    class="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl py-1 z-20 overflow-hidden"
                  >
                    <button
                      class="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-muted transition-colors"
                      @click="onEditKtp(item.ktpId)"
                    >
                      <IconEdit2 class="w-4 h-4 text-primary" />
                      Редактировать
                    </button>
                    <button
                      class="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                      @click="onDeleteKtp(item.ktpId)"
                    >
                      <IconTrash2 class="w-4 h-4" />
                      Удалить
                    </button>
                  </div>
                </div>
```

Also add `:style="{ zIndex: activeMenuKtpId === item.ktpId ? 30 : undefined }"` to the card root div (line 71-75) so the open menu overlays neighboring cards.

- [ ] **Step 6: Template — mount edit popover**

After `<AddKtpItemForm ... />` (line 165), add:

```html
    <KtpEditPopover
      v-model:opened="isEditPopoverOpen"
      :ktp="editingKtp"
    />
```

- [ ] **Step 7: Run tests + manual check**

Run: `npm test`
Expected: PASS.
Manual: cards show tint/badges for KTPs created with color+languages; ⋮ menu opens; Редактировать changes color live; Удалить removes card; paperclip appears only when budget met and all themes filled.

- [ ] **Step 8: Commit**

```bash
git add src/pages/KtpPage.vue
git commit -m "feat(ktp): card color tint, language badges, action menu, fully-loaded paperclip"
```

---

### Task 13: e2e coverage

**Files:**
- Modify: `tests/e2e/ktp.spec.ts`

- [ ] **Step 1: Add tests**

Append inside the existing `describe("KTP Page (Тематические планы)")` block, following the file's existing login-redirect early-return pattern (copy the guard from an existing test in this file):

```ts
  test("create popover shows color swatches and language toggles", async ({ page }) => {
    await page.goto("/ktp");
    if (page.url().includes("/login")) return;

    await page.getByRole("button", { name: "Создать" }).click();
    const popover = page.locator("#add-ktp-item-popover");
    await expect(popover).toBeVisible();

    await expect(popover.getByTestId("ktp-color-FACC15")).toBeVisible();
    await expect(popover.getByTestId("ktp-lang-KZ")).toBeVisible();
    await expect(popover.getByTestId("ktp-lang-RU")).toBeVisible();
    await expect(popover.getByTestId("ktp-lang-EN")).toBeVisible();

    // Language toggle is clickable and toggles selection styling
    await popover.getByTestId("ktp-lang-KZ").click();
    await expect(popover.getByTestId("ktp-lang-KZ")).toHaveClass(/bg-primary/);
  });

  test("card action menu opens with edit and delete entries", async ({ page }) => {
    await page.goto("/ktp");
    if (page.url().includes("/login")) return;

    const menuButtons = page.locator('[data-testid^="ktp-card-menu-"]');
    if ((await menuButtons.count()) === 0) return; // no cards in this environment

    await menuButtons.first().click();
    await expect(page.getByRole("button", { name: "Редактировать" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Удалить" })).toBeVisible();

    // Edit opens the edit popover
    await page.getByRole("button", { name: "Редактировать" }).click();
    await expect(page.locator("#ktp-edit-popover")).toBeVisible();
  });
```

- [ ] **Step 2: Run e2e (dev config)**

Run: `npm run test:e2e:dev -- tests/e2e/ktp.spec.ts`
Expected: PASS (or skip-by-early-return when unauthenticated, matching existing tests' behavior).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/ktp.spec.ts
git commit -m "test(ktp): e2e for create-form metadata fields and card action menu"
```

---

## Verification checklist (after all tasks)

- `npm test` — all unit suites pass.
- `npx convex codegen` — clean.
- Manual: create KTP with color+languages → card tinted with badges; enter 0 hours → stays 0; drag-reorder → survives reload; re-import same file → no duplicate rows; «на семестр» shows RUP distribution hours; paperclip badge only on complete plans; ⋮ menu edit/delete work.
