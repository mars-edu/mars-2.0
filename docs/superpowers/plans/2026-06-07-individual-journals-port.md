# Individual Journals Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port concept-v2 individual-journals logic into mars-2.0: persist wizard step-5 drafts as separate calendar events, enforce exact hour budgets, add in-journal config editing with full edit lock, and sync control marks for the «Общая» grading trajectory.

**Architecture:** Each individual-journal draft becomes its own `calendarEvents` row (`isIndividualJournal: true`, new `sourceGroupEventId` linking to the main group event). Creation is one atomic Convex mutation. The existing merge mechanism (`mergedJournalIds`/`parentIndividualJournalId`) stays untouched; wizard children are distinguished by `sourceGroupEventId`. Marks sync for «Общая» is client-side in marksStore, mirroring the existing merge sync, restricted to control marks matched by `controlId`.

**Tech Stack:** Vue 3 + Framework7 + Pinia, Convex backend, jest (`__tests__/*.spec.ts`, ts-jest), paraglide i18n (`messages/frontend/{ru,en,kk}.json`).

**Spec:** `docs/superpowers/specs/2026-06-07-individual-journals-port-design.md`

**Note on e2e:** Playwright automation for this flow needs seeded RUP-with-individual-hours fixtures that don't exist yet. This plan ends with a manual QA script (Task 12); e2e automation is a follow-up.

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `convex/schema.ts`, `convex/schema.post-migration.ts` | Modify | Add `sourceGroupEventId`, `gradingType` to `calendarEvents` |
| `convex/calendarEvents/lib.ts` | Create | Pure validation of individual-journal payloads (unit-testable) |
| `convex/calendarEvents/__tests__/lib.spec.ts` | Create | Tests for validation lib |
| `convex/calendarEvents/mutations.ts` | Modify | `createWithIndividualJournals`, `updateIndividualJournalsConfig` |
| `convex/journals/queries.ts` | Modify | `hasMarksInIndividualJournals` |
| `src/stores/calendarStore.ts` | Modify | New fields on `CalendarEvent`, `addEventWithIndividualJournals` |
| `src/stores/journalStore.ts` | Modify | Pass `sourceGroupEventId` through; guard `deleteJournal` |
| `src/components/Calendar/scheduleHours.ts` | Create | Pure hour math + budget resolution |
| `src/components/Calendar/__tests__/scheduleHours.spec.ts` | Create | Tests for hour math |
| `src/components/Calendar/useEventFormDerived.ts` | Modify | Reuse helper, export `weekCount` |
| `src/components/Calendar/IndividualJournalsEditor.vue` | Create | Extracted step-5 editor (shared wizard/popup) |
| `src/components/Calendar/AddEventWizard.vue` | Modify | Render editor, exact-match validation, budget badge |
| `src/components/Calendar/AddEventButton.vue` | Modify | Submit drafts through new store method |
| `src/components/IndividualJournalsConfigPopup.vue` | Create | In-journal config editor with edit lock |
| `src/pages/JournalDetails.vue` | Modify | Entry button + children card grid |
| `src/pages/journals.vue` | Modify | Route wizard-children edit to config popup |
| `src/stores/marksStore.ts` | Modify | `syncToMainJournal` for «Общая» |
| `messages/frontend/{ru,en,kk}.json` | Modify | New keys + existing gap fixes |

---

### Task 1: Schema fields + frontend type plumbing

**Files:**
- Modify: `convex/schema.ts` (calendarEvents table, after line 487 `parentIndividualJournalId`)
- Modify: `convex/schema.post-migration.ts` (same table, same spot)
- Modify: `src/stores/calendarStore.ts` (interface + 4 mapping sites)
- Modify: `src/stores/journalStore.ts` (Journal interface + `individualJournals` getter)

- [ ] **Step 1: Add fields to both schema files**

In `convex/schema.ts` inside `calendarEvents: defineTable({...})`, directly after `parentIndividualJournalId: v.optional(v.string()),`:

```ts
    sourceGroupEventId: v.optional(v.string()), // wizard-child → main group event link
    gradingType: v.optional(
      v.union(v.literal("combined"), v.literal("separate"))
    ), // set on the main event when it has individual journals
```

Apply the identical edit to `convex/schema.post-migration.ts` (same table definition — find `parentIndividualJournalId` inside `calendarEvents`).

- [ ] **Step 2: Extend `CalendarEvent` interface in calendarStore**

In `src/stores/calendarStore.ts` after line 44 (`parentIndividualJournalId?: string;`):

```ts
  sourceGroupEventId?: string;
  gradingType?: "combined" | "separate";
```

- [ ] **Step 3: Map the new fields at all 4 mapping sites in calendarStore**

In each of `fetchEventsWithRoleAccess` (~line 103), `addEvent` (~line 217), `updateEvent` (~line 325), `loadFromBackend` (~line 384), after the `parentIndividualJournalId` mapping line, add:

```ts
          sourceGroupEventId: event.sourceGroupEventId,
          gradingType: event.gradingType,
```

(In `addEvent`/`updateEvent` the variable is `created`/`updated` instead of `event` — match the local name.)

- [ ] **Step 4: Pass through in journalStore**

In `src/stores/journalStore.ts`, find the `Journal` interface (lines ~21-24 where `isIndividualJournal?`, `mergedJournalIds?` live) and add:

```ts
  sourceGroupEventId?: string;
```

In the `individualJournals` computed (line ~267, after `journal.customTitle = actualEvent.customTitle;`):

```ts
        journal.sourceGroupEventId = actualEvent.sourceGroupEventId;
```

No filtering changes needed: `journalsByCourse`/`mixedGroupJournals` already skip unmerged individual journals (lines 147-150, 205-208), and `individualJournals` already includes them (lines 243-247) — wizard children land in the «Индивидуальные» tab automatically.

- [ ] **Step 5: Typecheck and deploy schema**

Run: `npx vue-tsc --noEmit -p tsconfig.app.json`
Expected: no NEW errors (compare against `git stash; npx vue-tsc --noEmit -p tsconfig.app.json; git stash pop` baseline if unsure).

Run: `npx convex dev --once`
Expected: "Convex functions ready" / schema accepted without errors.

- [ ] **Step 6: Commit**

```bash
git add convex/schema.ts convex/schema.post-migration.ts src/stores/calendarStore.ts src/stores/journalStore.ts
git commit -m "feat(individual-journals): add sourceGroupEventId and gradingType schema fields"
```

---

### Task 2: Backend validation lib (TDD)

**Files:**
- Create: `convex/calendarEvents/lib.ts`
- Test: `convex/calendarEvents/__tests__/lib.spec.ts`

- [ ] **Step 1: Write the failing tests**

Create `convex/calendarEvents/__tests__/lib.spec.ts`:

```ts
import { validateIndividualJournals } from "../lib";

const slot = (startId = "s1", endId = "s2") => ({ weekId: 1, startId, endId });
const journal = (over: Partial<{ studentIds: string[]; weeklySchedules: any[] }> = {}) => ({
  studentIds: ["st1"],
  weeklySchedules: [slot()],
  ...over,
});

describe("validateIndividualJournals", () => {
  it("accepts a valid payload", () => {
    expect(validateIndividualJournals([journal()], "combined")).toBeNull();
  });

  it("rejects empty journal list", () => {
    expect(validateIndividualJournals([], "combined")).toMatch(/журнал/i);
  });

  it("rejects missing gradingType", () => {
    expect(validateIndividualJournals([journal()], undefined)).toMatch(/оцен/i);
  });

  it("rejects a journal without students", () => {
    expect(validateIndividualJournals([journal({ studentIds: [] })], "separate")).toMatch(/студент/i);
  });

  it("rejects a journal without schedules", () => {
    expect(validateIndividualJournals([journal({ weeklySchedules: [] })], "separate")).toMatch(/расписан/i);
  });

  it("rejects an incomplete time slot", () => {
    expect(
      validateIndividualJournals([journal({ weeklySchedules: [slot("s1", "")] })], "separate")
    ).toMatch(/время/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest convex/calendarEvents/__tests__/lib.spec.ts`
Expected: FAIL — `Cannot find module '../lib'`.

- [ ] **Step 3: Implement the lib**

Create `convex/calendarEvents/lib.ts`:

```ts
export interface IndividualJournalPayload {
  studentIds: string[];
  weeklySchedules: Array<{
    weekId: number;
    startTime?: string;
    endTime?: string;
    startId?: string;
    endId?: string;
  }>;
}

/**
 * Validate individual-journal payloads for createWithIndividualJournals /
 * updateIndividualJournalsConfig. Returns a human-readable error or null.
 * Exact-hours validation is intentionally client-side (the backend has no
 * lesson-time schedule math) — this checks structural shape only.
 */
export function validateIndividualJournals(
  journals: IndividualJournalPayload[],
  gradingType: "combined" | "separate" | undefined
): string | null {
  if (journals.length === 0) {
    return "Нужен хотя бы один индивидуальный журнал";
  }
  if (gradingType !== "combined" && gradingType !== "separate") {
    return "Не выбран тип оценивания";
  }
  for (const j of journals) {
    if (j.studentIds.length === 0) {
      return "В каждом журнале должен быть хотя бы один студент";
    }
    if (j.weeklySchedules.length === 0) {
      return "В каждом журнале должно быть расписание";
    }
    for (const s of j.weeklySchedules) {
      if (!s.startId || !s.endId) {
        return "У каждого слота должно быть время начала и конца";
      }
    }
  }
  return null;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest convex/calendarEvents/__tests__/lib.spec.ts`
Expected: 6 passed.

- [ ] **Step 5: Commit**

```bash
git add convex/calendarEvents/lib.ts convex/calendarEvents/__tests__/lib.spec.ts
git commit -m "feat(individual-journals): add payload validation lib"
```

---

### Task 3: `createWithIndividualJournals` mutation

**Files:**
- Modify: `convex/calendarEvents/mutations.ts`

- [ ] **Step 1: Add the mutation**

Append to `convex/calendarEvents/mutations.ts` (it already imports `mutation`, `v`, `createTimestamps`, and defines `weeklyScheduleValidator`/`journalSettingsValidator` at the top):

```ts
import { validateIndividualJournals } from "./lib";
```

(add to existing imports at the top), then at the bottom:

```ts
/**
 * Atomically create a main group event plus its individual sub-journals.
 * Each draft becomes its own calendarEvent flagged isIndividualJournal with
 * sourceGroupEventId pointing back to the main event.
 */
export const createWithIndividualJournals = mutation({
  args: {
    rupEntryId: v.string(),
    ktpId: v.optional(v.string()),
    teacherId: v.optional(v.string()),
    startDate: v.string(),
    startTime: v.optional(v.string()),
    endDate: v.string(),
    endTime: v.optional(v.string()),
    participants: v.array(v.string()),
    color: v.optional(v.string()),
    semester: v.string(),
    useCustomPeriod: v.boolean(),
    weeklySchedules: v.optional(v.array(weeklyScheduleValidator)),
    gradingType: v.union(v.literal("combined"), v.literal("separate")),
    individualJournals: v.array(
      v.object({
        studentIds: v.array(v.string()),
        weeklySchedules: v.array(weeklyScheduleValidator),
      })
    ),
  },
  handler: async (ctx, args) => {
    const { gradingType, individualJournals, ...mainFields } = args;

    const validationError = validateIndividualJournals(
      individualJournals,
      gradingType
    );
    if (validationError) {
      throw new Error(validationError);
    }

    const timestamps = createTimestamps();

    const mainId = await ctx.db.insert("calendarEvents", {
      ...mainFields,
      gradingType,
      ...timestamps,
    });

    const childIds: string[] = [];
    for (let i = 0; i < individualJournals.length; i++) {
      const j = individualJournals[i];
      const childId = await ctx.db.insert("calendarEvents", {
        rupEntryId: mainFields.rupEntryId,
        teacherId: mainFields.teacherId,
        startDate: mainFields.startDate,
        endDate: mainFields.endDate,
        participants: j.studentIds,
        color: mainFields.color,
        semester: mainFields.semester,
        useCustomPeriod: mainFields.useCustomPeriod,
        weeklySchedules: j.weeklySchedules,
        isIndividualJournal: true,
        sourceGroupEventId: mainId,
        customTitle: `Индивидуальный журнал #${i + 1}`,
        ...timestamps,
      });
      childIds.push(childId);
    }

    return { mainId, childIds };
  },
});
```

- [ ] **Step 2: Verify Convex accepts it**

Run: `npx convex dev --once`
Expected: functions ready, no type errors.

- [ ] **Step 3: Commit**

```bash
git add convex/calendarEvents/mutations.ts
git commit -m "feat(individual-journals): atomic createWithIndividualJournals mutation"
```

---

### Task 4: Edit mutation with full lock + marks query

**Files:**
- Modify: `convex/calendarEvents/mutations.ts`
- Modify: `convex/journals/queries.ts`

- [ ] **Step 1: Add `updateIndividualJournalsConfig` mutation**

Append to `convex/calendarEvents/mutations.ts`:

```ts
/**
 * Replace the individual-journal configuration of a main group event.
 * FULL LOCK: if any mark exists in any existing child journal, throws
 * INDIVIDUAL_JOURNALS_LOCKED — config editing is forbidden once grading
 * has started (concept-v2 semantics).
 */
export const updateIndividualJournalsConfig = mutation({
  args: {
    mainEventId: v.id("calendarEvents"),
    gradingType: v.union(v.literal("combined"), v.literal("separate")),
    individualJournals: v.array(
      v.object({
        eventId: v.optional(v.string()), // existing child event id; absent = create new
        studentIds: v.array(v.string()),
        weeklySchedules: v.array(weeklyScheduleValidator),
      })
    ),
  },
  handler: async (ctx, args) => {
    const validationError = validateIndividualJournals(
      args.individualJournals,
      args.gradingType
    );
    if (validationError) {
      throw new Error(validationError);
    }

    const mainEvent = await ctx.db.get(args.mainEventId);
    if (!mainEvent) {
      throw new Error("Main event not found");
    }

    // Collect existing children
    const allEvents = await ctx.db.query("calendarEvents").collect();
    const children = allEvents.filter(
      (e) => e.sourceGroupEventId === args.mainEventId
    );

    // FULL LOCK check: any mark in any child journal forbids editing
    for (const child of children) {
      const journal = await ctx.db
        .query("journals")
        .withIndex("by_calendarEvent", (q) => q.eq("calendarEventId", child._id))
        .unique();
      if (!journal) continue;
      const anyMark = await ctx.db
        .query("marks")
        .withIndex("by_journal", (q) => q.eq("journalId", journal._id))
        .first();
      if (anyMark) {
        throw new Error("INDIVIDUAL_JOURNALS_LOCKED");
      }
    }

    await ctx.db.patch(args.mainEventId, {
      gradingType: args.gradingType,
      ...updateTimestamp(),
    });

    const keptEventIds = new Set(
      args.individualJournals.map((j) => j.eventId).filter(Boolean)
    );

    // Delete removed children (and their empty journals)
    for (const child of children) {
      if (keptEventIds.has(child._id)) continue;
      const journal = await ctx.db
        .query("journals")
        .withIndex("by_calendarEvent", (q) => q.eq("calendarEventId", child._id))
        .unique();
      if (journal) {
        const students = await ctx.db
          .query("journalStudents")
          .withIndex("by_journal", (q) => q.eq("journalId", journal._id))
          .collect();
        for (const s of students) await ctx.db.delete(s._id);
        await ctx.db.delete(journal._id);
      }
      await ctx.db.delete(child._id);
    }

    // Upsert kept/new children
    const childIds: string[] = [];
    let counter = 0;
    for (const j of args.individualJournals) {
      counter += 1;
      if (j.eventId) {
        await ctx.db.patch(j.eventId as any, {
          participants: j.studentIds,
          weeklySchedules: j.weeklySchedules,
          ...updateTimestamp(),
        });
        childIds.push(j.eventId);
      } else {
        const timestamps = createTimestamps();
        const childId = await ctx.db.insert("calendarEvents", {
          rupEntryId: mainEvent.rupEntryId,
          teacherId: mainEvent.teacherId,
          startDate: mainEvent.startDate,
          endDate: mainEvent.endDate,
          participants: j.studentIds,
          color: mainEvent.color,
          semester: mainEvent.semester,
          useCustomPeriod: mainEvent.useCustomPeriod,
          weeklySchedules: j.weeklySchedules,
          isIndividualJournal: true,
          sourceGroupEventId: args.mainEventId,
          customTitle: `Индивидуальный журнал #${counter}`,
          ...timestamps,
        });
        childIds.push(childId);
      }
    }

    return { mainId: args.mainEventId, childIds };
  },
});
```

- [ ] **Step 2: Add `hasMarksInIndividualJournals` query**

Append to `convex/journals/queries.ts`:

```ts
/**
 * True if any mark exists in any wizard-child individual journal of the
 * given main group event. Used as the edit-lock pre-check.
 */
export const hasMarksInIndividualJournals = query({
  args: { mainEventId: v.string() },
  handler: async (ctx, args) => {
    const allEvents = await ctx.db.query("calendarEvents").collect();
    const children = allEvents.filter(
      (e) => e.sourceGroupEventId === args.mainEventId
    );
    for (const child of children) {
      const journal = await ctx.db
        .query("journals")
        .withIndex("by_calendarEvent", (q) => q.eq("calendarEventId", child._id))
        .unique();
      if (!journal) continue;
      const anyMark = await ctx.db
        .query("marks")
        .withIndex("by_journal", (q) => q.eq("journalId", journal._id))
        .first();
      if (anyMark) return true;
    }
    return false;
  },
});
```

- [ ] **Step 3: Verify Convex accepts both**

Run: `npx convex dev --once`
Expected: functions ready, no errors.

- [ ] **Step 4: Commit**

```bash
git add convex/calendarEvents/mutations.ts convex/journals/queries.ts
git commit -m "feat(individual-journals): config update mutation with full edit lock"
```

---

### Task 5: Hour math helper (TDD)

**Files:**
- Create: `src/components/Calendar/scheduleHours.ts`
- Test: `src/components/Calendar/__tests__/scheduleHours.spec.ts`
- Modify: `src/components/Calendar/useEventFormDerived.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/components/Calendar/__tests__/scheduleHours.spec.ts`:

```ts
import {
  computeWeeklySlotHours,
  computeScheduleHours,
  resolveIndividualBudget,
} from "../scheduleHours";

const scheduleIds = ["p1", "p2", "p3", "p4", "p5"];

describe("computeWeeklySlotHours", () => {
  it("counts inclusive lesson-period span per slot", () => {
    // p1..p2 = 2 hours, p3..p3 = 1 hour
    const slots = [
      { startId: "p1", endId: "p2" },
      { startId: "p3", endId: "p3" },
    ];
    expect(computeWeeklySlotHours(slots, scheduleIds)).toBe(3);
  });

  it("skips incomplete and inverted slots", () => {
    const slots = [
      { startId: "p1", endId: "" },
      { startId: "", endId: "p2" },
      { startId: "p4", endId: "p2" }, // inverted
    ];
    expect(computeWeeklySlotHours(slots, scheduleIds)).toBe(0);
  });

  it("skips slots with unknown ids", () => {
    expect(computeWeeklySlotHours([{ startId: "x", endId: "p2" }], scheduleIds)).toBe(0);
  });
});

describe("computeScheduleHours", () => {
  it("multiplies weekly hours by week count", () => {
    const slots = [{ startId: "p1", endId: "p2" }];
    expect(computeScheduleHours(slots, scheduleIds, 18)).toBe(36);
  });

  it("clamps negative week counts to 0", () => {
    const slots = [{ startId: "p1", endId: "p2" }];
    expect(computeScheduleHours(slots, scheduleIds, -1)).toBe(0);
  });
});

describe("resolveIndividualBudget", () => {
  const entry = {
    individualHours: "10",
    individualAdditionalHours: "20",
    distributionEntries: [
      { semesterId: "sem1", academicYearId: "y1", individualHours: "6" },
      { semesterId: "2", academicYearId: "y1", individualHours: "8" },
    ],
  };

  it("prefers the semester-matched distribution entry (by semester id)", () => {
    expect(
      resolveIndividualBudget(entry as any, { semesterId: "sem1", semesterNumber: "1", academicYearId: "y1" })
    ).toBe(6);
  });

  it("matches by semester number when ids differ", () => {
    expect(
      resolveIndividualBudget(entry as any, { semesterId: "semX", semesterNumber: "2", academicYearId: "y1" })
    ).toBe(8);
  });

  it("falls back to additional-individual hours, then individualHours", () => {
    const noDist = { ...entry, distributionEntries: [] };
    expect(
      resolveIndividualBudget(noDist as any, { semesterId: "s", semesterNumber: "1", academicYearId: "y1" })
    ).toBe(20);
    const onlyMain = { ...noDist, individualAdditionalHours: "" };
    expect(
      resolveIndividualBudget(onlyMain as any, { semesterId: "s", semesterNumber: "1", academicYearId: "y1" })
    ).toBe(10);
  });

  it("returns 0 for a null entry", () => {
    expect(resolveIndividualBudget(null, { semesterId: "s", semesterNumber: "1", academicYearId: "y1" })).toBe(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest src/components/Calendar/__tests__/scheduleHours.spec.ts`
Expected: FAIL — `Cannot find module '../scheduleHours'`.

- [ ] **Step 3: Implement the helper**

Create `src/components/Calendar/scheduleHours.ts`:

```ts
/**
 * Pure hour math for event schedules and individual-journal budgets.
 * Extracted from useEventFormDerived.selectedHours so the wizard's
 * per-journal hour totals use the same units (hours per week × weeks)
 * as the «План» badge — fixing the old slot-count-vs-semester-total
 * mismatch.
 */

export interface ScheduleSlotLike {
  startId?: string;
  endId?: string;
}

export function computeWeeklySlotHours(
  slots: ScheduleSlotLike[],
  scheduleIds: string[]
): number {
  let hoursPerWeek = 0;
  for (const slot of slots) {
    if (!slot.startId || !slot.endId) continue;
    const startIndex = scheduleIds.indexOf(slot.startId);
    const endIndex = scheduleIds.indexOf(slot.endId);
    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      hoursPerWeek += endIndex - startIndex + 1;
    }
  }
  return hoursPerWeek;
}

export function computeScheduleHours(
  slots: ScheduleSlotLike[],
  scheduleIds: string[],
  weekCount: number
): number {
  if (weekCount <= 0) return 0;
  return computeWeeklySlotHours(slots, scheduleIds) * weekCount;
}

interface RupEntryLike {
  individualHours?: string;
  individualAdditionalHours?: string;
  distributionEntries?: Array<{
    semesterId?: string;
    academicYearId?: string;
    individualHours?: string;
  }>;
}

interface SemesterContext {
  semesterId: string;
  semesterNumber: string;
  academicYearId: string;
}

const num = (v: string | undefined | null): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Individual-hours budget for one semester. Same matching rules as
 * useEventFormDerived.semesterPlannedHours; falls back to the RUP entry's
 * top-level fields (individualAdditionalHours wins over individualHours,
 * mirroring RupEntryViewPopover's display convention).
 */
export function resolveIndividualBudget(
  entry: RupEntryLike | null | undefined,
  semester: SemesterContext
): number {
  if (!entry) return 0;

  const matched = (entry.distributionEntries || []).find((d) => {
    const entrySemesterId = String(d.semesterId ?? "");
    const matchesSemester =
      entrySemesterId === semester.semesterId ||
      entrySemesterId === semester.semesterNumber;
    if (!d.academicYearId || !semester.academicYearId) return matchesSemester;
    return d.academicYearId === semester.academicYearId && matchesSemester;
  });

  if (matched && num(matched.individualHours) > 0) {
    return num(matched.individualHours);
  }
  return num(entry.individualAdditionalHours) || num(entry.individualHours);
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx jest src/components/Calendar/__tests__/scheduleHours.spec.ts`
Expected: all passed.

- [ ] **Step 5: Rewire `useEventFormDerived` to the helper and export `weekCount`**

In `src/components/Calendar/useEventFormDerived.ts`:

Add import:

```ts
import { computeWeeklySlotHours } from "./scheduleHours";
```

Add a `weekCount` computed above `selectedHours` and rewrite `selectedHours` (replace lines 118-144):

```ts
  const weekCount = computed(() => {
    const startUi = effectiveStartDate.value;
    const endUi = effectiveEndDate.value;
    if (!startUi || !endUi) return 0;

    const start = dayjs(startUi, DATE_UI_FORMAT, true);
    const end = dayjs(endUi, DATE_UI_FORMAT, true);
    if (!start.isValid() || !end.isValid()) return 0;

    const daysDiff = end.diff(start, "day") + 1;
    return daysDiff > 0 ? Math.ceil(daysDiff / 7) : 0;
  });

  const selectedHours = computed(() => {
    if (weekCount.value <= 0) return "0";
    const scheduleIds = educationScheduleStore.getActiveYearSchedules.map(
      (s) => s.id
    );
    const hoursPerWeek = computeWeeklySlotHours(
      args.selectedWeekDays.value,
      scheduleIds
    );
    return String(hoursPerWeek * weekCount.value);
  });
```

Add `weekCount` to the returned object (alongside `selectedHours`).

- [ ] **Step 6: Run full unit suite + typecheck**

Run: `npx jest && npx vue-tsc --noEmit -p tsconfig.app.json`
Expected: all tests pass, no new type errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Calendar/scheduleHours.ts src/components/Calendar/__tests__/scheduleHours.spec.ts src/components/Calendar/useEventFormDerived.ts
git commit -m "feat(individual-journals): shared hour math + budget resolution helpers"
```

---

### Task 6: Exact-match validation + budget badge in the wizard

**Files:**
- Modify: `src/components/Calendar/AddEventButton.vue` (pass `weekCount`)
- Modify: `src/components/Calendar/AddEventWizard.vue`

- [ ] **Step 1: Pass `weekCount` into the wizard**

In `src/components/Calendar/AddEventButton.vue`: destructure `weekCount` from the `useEventFormDerived(...)` call (line ~113-131), and add to the `<AddEventWizard>` bindings (template, after `:selected-hours="selectedHours"`):

```html
          :week-count="weekCount"
```

- [ ] **Step 2: Accept the prop in the wizard**

In `src/components/Calendar/AddEventWizard.vue` props (after `selectedHours: string;` line ~686):

```ts
  weekCount: number;
```

Note: `src/components/Calendar/EditJournalPopup.vue` also mounts AddEventWizard in edit mode. Edit mode never shows step 5, but the prop is required — destructure `weekCount` from its own `useEventFormDerived(...)` call and bind `:week-count="weekCount"` there too (same two edits as Step 1, in EditJournalPopup.vue).

- [ ] **Step 3: Rewrite `totalIndividualHours` and add `individualBudget`**

In `AddEventWizard.vue`, add imports:

```ts
import { computeScheduleHours, resolveIndividualBudget } from "./scheduleHours";
```

Replace the `totalIndividualHours` computed (lines 1286-1292):

```ts
const totalIndividualHours = computed(() => {
  const scheduleIds = getActiveYearSchedules.value.map((s) => s.id);
  let total = 0;
  for (const j of individualJournalsModel.value) {
    total += computeScheduleHours(j.daySlots, scheduleIds, props.weekCount);
  }
  return total;
});

// Exact individual-hours budget for the active semester (concept-v2 rule:
// the budget must be fully and exactly distributed across the journals).
const individualBudget = computed(() => {
  const entry = rupEntryStore.getRupEntryById(rupEntryIdModel.value);
  const semester = academicYearSemesterStore.getAcademicYearSemesterById(
    props.semesterId
  );
  if (!semester) return 0;
  return resolveIndividualBudget(entry, {
    semesterId: String(semester.id ?? ""),
    semesterNumber: String(semester.semesterNumber ?? ""),
    academicYearId: semester.academicYearId,
  });
});

const isIndividualHoursMatching = computed(
  () => totalIndividualHours.value === individualBudget.value
);
```

- [ ] **Step 4: Enforce exact match in `isStep5Valid`**

Replace the `isStep5Valid` computed (lines 1132-1142):

```ts
const isStep5Valid = computed(() => {
  if (!useIndividualJournalsModel.value) return true;
  if (!gradingTypeModel.value) return false;
  if (individualJournalsModel.value.length === 0) return false;
  if (!isIndividualHoursMatching.value) return false;
  return individualJournalsModel.value.every(
    (j) =>
      j.studentIds.length > 0 &&
      j.daySlots.length > 0 &&
      j.daySlots.every((s) => !!s.startId && !!s.endId)
  );
});
```

- [ ] **Step 5: Budget badge UI**

In the template, replace the «Инд.» span (lines 424-426):

```html
              <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Инд.:
                <span :class="isIndividualHoursMatching ? 'text-green-600' : 'text-destructive'">
                  {{ totalIndividualHours }} / {{ individualBudget }} ч
                </span>
              </span>
```

- [ ] **Step 6: Typecheck and eyeball**

Run: `npx vue-tsc --noEmit -p tsconfig.app.json`
Expected: no new errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/Calendar/AddEventWizard.vue src/components/Calendar/AddEventButton.vue src/components/Calendar/EditJournalPopup.vue
git commit -m "feat(individual-journals): exact hour-budget validation in wizard step 5"
```

---

### Task 7: Persist wizard drafts (store method + submit wiring)

**Files:**
- Modify: `src/stores/calendarStore.ts`
- Modify: `src/components/Calendar/AddEventButton.vue`

- [ ] **Step 1: Add `addEventWithIndividualJournals` to calendarStore**

In `src/stores/calendarStore.ts`, after the `addEvent` function (line ~236):

```ts
    async function addEventWithIndividualJournals(
      eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">,
      gradingType: "combined" | "separate",
      individualJournals: Array<{
        studentIds: string[];
        weeklySchedules: WeeklySchedule[];
      }>,
      preGeneratedId?: string
    ) {
      loading.value = true;
      try {
        // Same KTP bootstrap as addEvent
        const ktpStore = useKtpStore();
        const academicYearSemesterStore = useAcademicYearSemesterStore();
        const semester = academicYearSemesterStore.academicYearSemesters.find(
          (s: any) => s.id === eventData.semester
        );

        let ktpId = eventData.ktpId;
        if (semester && semester.academicYearId && !ktpId) {
          const eventId = preGeneratedId || crypto.randomUUID();
          const ktp = await ktpStore.ensureKtpForRupEntry(
            eventData.rupEntryId,
            semester.academicYearId,
            eventData.semester,
            eventId
          );
          ktpId = ktp.id;
        }

        const result = await convex.mutation(
          api.calendarEvents.mutations.createWithIndividualJournals,
          {
            rupEntryId: eventData.rupEntryId,
            ktpId,
            teacherId: eventData.teacherId,
            startDate: eventData.startDate,
            startTime: eventData.startTime,
            endDate: eventData.endDate,
            endTime: eventData.endTime,
            participants: eventData.participants,
            color: eventData.color,
            semester: eventData.semester,
            useCustomPeriod: eventData.useCustomPeriod,
            weeklySchedules: eventData.weeklySchedules,
            gradingType,
            individualJournals,
          }
        );

        await fetchEventsWithRoleAccess();
        error.value = null;
        return events.value.find((e) => e.id === result.mainId) ?? null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add event";
        throw err;
      } finally {
        loading.value = false;
      }
    }
```

Add `addEventWithIndividualJournals,` to the store's return object (next to `addEvent`).

- [ ] **Step 2: Wire `handleAddEvent` in AddEventButton**

In `src/components/Calendar/AddEventButton.vue`, replace the single `addEvent` call (lines 177-184):

```ts
    let newEvent: CalendarEvent | null | undefined;
    if (useIndividualJournals.value && individualJournals.value.length > 0) {
      if (gradingType.value !== "combined" && gradingType.value !== "separate") {
        formError.value = "Не выбран тип оценивания.";
        return;
      }
      newEvent = await calendarStore.addEventWithIndividualJournals(
        eventData,
        gradingType.value,
        individualJournals.value.map((j) => ({
          studentIds: j.studentIds,
          weeklySchedules: j.daySlots.map(({ weekId, startId, endId }) => ({
            weekId,
            startId,
            endId,
          })),
        })),
        tempEventId.value
      );
    } else {
      newEvent = await calendarStore.addEvent(eventData, tempEventId.value);
    }

    if (newEvent) {
      emit("event-added", newEvent);
      closeAddEventPopoverForced();
    } else {
      throw new Error("Failed to create event");
    }
```

- [ ] **Step 3: Typecheck**

Run: `npx vue-tsc --noEmit -p tsconfig.app.json`
Expected: no new errors.

- [ ] **Step 4: Commit**

```bash
git add src/stores/calendarStore.ts src/components/Calendar/AddEventButton.vue
git commit -m "feat(individual-journals): persist wizard step-5 drafts as child events"
```

---

### Task 8: Extract `IndividualJournalsEditor` component

Pure mechanical move — behavior must not change. The editor is needed standalone for the in-journal popup (Task 9).

**Files:**
- Create: `src/components/Calendar/IndividualJournalsEditor.vue`
- Modify: `src/components/Calendar/AddEventWizard.vue`

- [ ] **Step 1: Create the component**

Create `src/components/Calendar/IndividualJournalsEditor.vue`. **Template:** move the entire step-5 inner block from `AddEventWizard.vue` — everything inside `<section v-if="currentStep === 5">` (the `<div class="rounded-xl border border-input bg-card p-3 space-y-3">` block, current lines 383-605) — as the component root.

**Script:** move these from AddEventWizard verbatim, adapting only props/models:

- functions: `addJournal`, `removeJournal`, `toggleJournalStudent`, `toggleJournalDay`, `updateJournalSlotTime`, `addJournalSlot`, `removeJournalSlot`, `availableStudentsForJournal`, `groupedJournalSlots` (lines 1146-1284)
- state: `openStudentSelectorId` (line 1144)
- computeds: `individualHoursAvailable` (lines 785-798), `useIndividualJournalsModel` (800-806), `gradingTypeModel` (808-811), `individualJournalsModel` (813-816), `totalIndividualHours`, `individualBudget`, `isIndividualHoursMatching` (from Task 6)

Component interface:

```ts
<script setup lang="ts">
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import IconX from "~icons/lucide/x";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconChevronUp from "~icons/lucide/chevron-up";
import Select from "@/components/ui/Select.vue";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useStudentStore } from "@/stores/studentStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { computeScheduleHours, resolveIndividualBudget } from "./scheduleHours";
import type { IndividualJournalDraft } from "./useAddEventWizard";
import type { WeekDaySchedule } from "./useEventFormDerived";

const props = defineProps<{
  useIndividualJournals: boolean;
  gradingType: "combined" | "separate" | "";
  individualJournals: IndividualJournalDraft[];
  rupEntryId: string;
  semesterId: string;
  weekCount: number;
  studentPool: string[]; // selectable students (wizard: step-3 participants)
  semesterPlannedHours: string;
  weekDays: Array<{ weekId: number; name: string; abbreviation: string }>;
  startTimeOptions: Array<{ value: string; label: string }>;
  endTimeOptions: Array<{ value: string; label: string }>;
  getEndTimeOptionsForStart: (startId: string) => Array<{ value: string; label: string }>;
  hideToggle?: boolean; // popup mode: toggle is implicit, hide the switch row
}>();

const emit = defineEmits<{
  (e: "update:useIndividualJournals", v: boolean): void;
  (e: "update:gradingType", v: "combined" | "separate" | ""): void;
  (e: "update:individualJournals", v: IndividualJournalDraft[]): void;
}>();

// ... moved models/computeds/functions, with:
//   participantsModel.value  -> props.studentPool
//   props.semesterId         -> props.semesterId (unchanged name)
//   props.weekCount          -> props.weekCount

defineExpose({ isIndividualHoursMatching, individualBudget, totalIndividualHours });
</script>
```

In the moved template replace `individualJournalsModel` / `useIndividualJournalsModel` / `gradingTypeModel` references — they keep the same names (the models are moved too), so the template needs **no** identifier changes except: wrap the toggle row in `v-if="!hideToggle"`.

- [ ] **Step 2: Use it in the wizard**

In `AddEventWizard.vue`, replace the step-5 inner block (lines 383-605) with:

```html
        <IndividualJournalsEditor
          ref="individualEditorRef"
          v-model:useIndividualJournals="useIndividualJournalsModel"
          v-model:gradingType="gradingTypeModel"
          v-model:individualJournals="individualJournalsModel"
          :rup-entry-id="rupEntryIdModel"
          :semester-id="props.semesterId"
          :week-count="props.weekCount"
          :student-pool="participantsModel"
          :semester-planned-hours="semesterPlannedHours"
          :week-days="weekDays"
          :start-time-options="startTimeOptions"
          :end-time-options="endTimeOptions"
          :get-end-time-options-for-start="getEndTimeOptionsForStart"
        />
```

Keep the thin v-model relays (`useIndividualJournalsModel`, `gradingTypeModel`, `individualJournalsModel`) in the wizard — they bridge to the parent's props/emits. Delete the moved functions/state/computeds from the wizard, add:

```ts
import IndividualJournalsEditor from "./IndividualJournalsEditor.vue";

const individualEditorRef = ref<InstanceType<typeof IndividualJournalsEditor> | null>(null);
```

and rewrite `isStep5Valid` to read from the editor:

```ts
const isStep5Valid = computed(() => {
  if (!props.useIndividualJournals) return true;
  if (!props.gradingType) return false;
  if (props.individualJournals.length === 0) return false;
  if (!(individualEditorRef.value?.isIndividualHoursMatching ?? false)) return false;
  return props.individualJournals.every(
    (j) =>
      j.studentIds.length > 0 &&
      j.daySlots.length > 0 &&
      j.daySlots.every((s) => !!s.startId && !!s.endId)
  );
});
```

Note: `useIndividualJournalsModel` getter in the wizard previously AND-ed `individualHoursAvailable`; that guard moved into the editor. The wizard relay becomes plain get/emit.

- [ ] **Step 3: Verify no behavior change**

Run: `npx jest && npx vue-tsc --noEmit -p tsconfig.app.json`
Expected: pass / no new errors.

Run the app (`npm run dev`), open Создать wizard, walk to step 5: toggle gating, journal cards, slot editing, hour badge all behave as before extraction.

- [ ] **Step 4: Commit**

```bash
git add src/components/Calendar/IndividualJournalsEditor.vue src/components/Calendar/AddEventWizard.vue
git commit -m "refactor(individual-journals): extract shared IndividualJournalsEditor"
```

---

### Task 9: In-journal config popup + JournalDetails entry

**Files:**
- Create: `src/components/IndividualJournalsConfigPopup.vue`
- Modify: `src/pages/JournalDetails.vue`

- [ ] **Step 1: Create the popup**

Create `src/components/IndividualJournalsConfigPopup.vue`:

```vue
<template>
  <f7-popup
    id="individual-journals-config-popup"
    :opened="isOpen"
    @popup:closed="isOpen = false"
    class="individual-journals-config-popup"
  >
    <div class="flex flex-col h-full bg-background text-foreground">
      <div class="flex items-center justify-between p-4 border-b border-border">
        <div class="text-lg font-bold">Индивидуальные журналы</div>
        <button class="text-muted-foreground hover:text-foreground" @click="isOpen = false">
          <IconX class="text-xl" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <IndividualJournalsEditor
          ref="editorRef"
          v-model:useIndividualJournals="useIndividualJournals"
          v-model:gradingType="gradingType"
          v-model:individualJournals="drafts"
          :rup-entry-id="mainEvent?.rupEntryId ?? ''"
          :semester-id="mainEvent?.semester ?? ''"
          :week-count="weekCount"
          :student-pool="mainEvent?.participants ?? []"
          :semester-planned-hours="'0'"
          :week-days="weekDays"
          :start-time-options="startTimeOptions"
          :end-time-options="endTimeOptions"
          :get-end-time-options-for-start="getEndTimeOptionsForStart"
          hide-toggle
        />
      </div>

      <div class="p-4 border-t border-border">
        <button
          class="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50"
          :disabled="!canSave || isSaving"
          @click="handleSave"
        >
          Сохранить
        </button>
      </div>
    </div>
  </f7-popup>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { f7 } from "framework7-vue";
import dayjs from "dayjs";
import IconX from "~icons/lucide/x";
import IndividualJournalsEditor from "@/components/Calendar/IndividualJournalsEditor.vue";
import { useCalendarStore } from "@/stores/calendarStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import type { IndividualJournalDraft } from "@/components/Calendar/useAddEventWizard";
import { WEEK_DAYS } from "@/constants/calendar"; // if absent, reuse the weekDays const from AddEventWizard — see note below

const calendarStore = useCalendarStore();
const educationScheduleStore = useEducationScheduleStore();

const isOpen = ref(false);
const isSaving = ref(false);
const mainEventId = ref<string>("");
const useIndividualJournals = ref(true);
const gradingType = ref<"combined" | "separate" | "">("");
const drafts = ref<IndividualJournalDraft[]>([]);
const editorRef = ref<InstanceType<typeof IndividualJournalsEditor> | null>(null);

const mainEvent = computed(() => calendarStore.getEventById(mainEventId.value));

const weekCount = computed(() => {
  if (!mainEvent.value) return 0;
  const start = dayjs(mainEvent.value.startDate, DATE_STORAGE_FORMAT);
  const end = dayjs(mainEvent.value.endDate, DATE_STORAGE_FORMAT);
  if (!start.isValid() || !end.isValid()) return 0;
  const daysDiff = end.diff(start, "day") + 1;
  return daysDiff > 0 ? Math.ceil(daysDiff / 7) : 0;
});

// Time options identical to AddEventWizard's
const startTimeOptions = computed(() =>
  educationScheduleStore.getActiveYearSchedules.map((s: any) => ({
    value: s.id,
    label: s.startTime,
  }))
);
const endTimeOptions = computed(() =>
  educationScheduleStore.getActiveYearSchedules.map((s: any) => ({
    value: s.id,
    label: s.endTime,
  }))
);
function getEndTimeOptionsForStart(startId: string) {
  const idx = startTimeOptions.value.findIndex((o) => o.value === startId);
  return idx === -1 ? endTimeOptions.value : endTimeOptions.value.slice(idx);
}

const canSave = computed(
  () =>
    !!gradingType.value &&
    drafts.value.length > 0 &&
    (editorRef.value?.isIndividualHoursMatching ?? false) &&
    drafts.value.every(
      (j) =>
        j.studentIds.length > 0 &&
        j.daySlots.length > 0 &&
        j.daySlots.every((s) => !!s.startId && !!s.endId)
    )
);

function childrenOf(eventId: string) {
  return calendarStore.events.filter((e) => e.sourceGroupEventId === eventId);
}

async function open(eventId: string) {
  mainEventId.value = eventId;

  // FULL LOCK pre-check (server re-validates on save)
  const locked = await convex.query(
    api.journals.queries.hasMarksInIndividualJournals,
    { mainEventId: eventId }
  );
  if (locked) {
    f7.dialog.alert(
      "В индивидуальных журналах уже выставлены оценки — редактирование запрещено",
      "Редактирование невозможно"
    );
    return;
  }

  gradingType.value = (mainEvent.value?.gradingType as any) ?? "";
  drafts.value = childrenOf(eventId).map((child) => ({
    id: child.id, // existing child event id doubles as draft id
    studentIds: [...child.participants],
    daySlots: (child.weeklySchedules ?? []).map((ws) => ({
      weekId: ws.weekId,
      russianWeekDay:
        WEEK_DAYS.find((d) => d.weekId === ws.weekId)?.name ?? "",
      startId: ws.startId ?? "",
      endId: ws.endId ?? "",
    })),
  }));
  isOpen.value = true;
}

async function handleSave() {
  if (!canSave.value) return;
  isSaving.value = true;
  try {
    const existingIds = new Set(childrenOf(mainEventId.value).map((c) => c.id));
    await convex.mutation(
      api.calendarEvents.mutations.updateIndividualJournalsConfig,
      {
        mainEventId: mainEventId.value as any,
        gradingType: gradingType.value as "combined" | "separate",
        individualJournals: drafts.value.map((j) => ({
          eventId: existingIds.has(j.id) ? j.id : undefined,
          studentIds: j.studentIds,
          weeklySchedules: j.daySlots.map(({ weekId, startId, endId }) => ({
            weekId,
            startId,
            endId,
          })),
        })),
      }
    );
    await calendarStore.fetchEventsWithRoleAccess();
    isOpen.value = false;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("INDIVIDUAL_JOURNALS_LOCKED")) {
      f7.dialog.alert(
        "В индивидуальных журналах уже выставлены оценки — редактирование запрещено",
        "Редактирование невозможно"
      );
    } else {
      f7.dialog.alert(message, "Ошибка");
    }
  } finally {
    isSaving.value = false;
  }
}

defineExpose({ open });
</script>
```

`WEEK_DAYS` note: AddEventWizard defines a local `weekDays` array of `{ weekId, name, abbreviation }`. If `src/constants/calendar.ts` has no such export, move the wizard's array there as `export const WEEK_DAYS = [...]`, import it in both AddEventWizard (replacing the local const) and this popup, and pass it as the `weekDays` prop.

- [ ] **Step 2: Entry button + children grid in JournalDetails**

In `src/pages/JournalDetails.vue` template, after the `<!-- Sub-journal card grid (merged/joined journal) -->` block (after line 92), add:

```html
          <!-- Individual journals of this group event (wizard children) -->
          <div
            v-if="!isMergedJournal && individualChildJournals.length > 0"
            class="p-4 bg-muted/50 rounded-2xl border border-border/50"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-bold">Индивидуальные журналы</div>
              <button
                class="text-sm text-primary font-medium hover:underline"
                @click="openIndividualConfig"
              >
                Настроить
              </button>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                v-for="child in individualChildJournals"
                :key="child.id"
                class="p-4 rounded-2xl border-2 bg-card border-border hover:border-primary/50 hover:shadow-md text-left"
                @click="navigateToJournal(child.id)"
              >
                <div class="text-base font-bold truncate">
                  {{ child.customTitle || "Индивидуальный журнал" }}
                </div>
                <div class="text-[11px] font-bold text-muted-foreground mt-1">
                  Студентов: {{ child.participants.length }}
                </div>
              </button>
            </div>
          </div>
```

In the script, add:

```ts
import IndividualJournalsConfigPopup from "@/components/IndividualJournalsConfigPopup.vue";

const individualConfigRef = ref<InstanceType<typeof IndividualJournalsConfigPopup> | null>(null);

const individualChildJournals = computed(() =>
  calendarStore.events.filter((e) => e.sourceGroupEventId === journalId.value)
);

function openIndividualConfig() {
  individualConfigRef.value?.open(journalId.value);
}

function navigateToJournal(id: string) {
  f7.views.main.router.navigate(`/journals/${id}/`);
}
```

(`journalId` is the page's existing route-param ref; `calendarStore` is already imported on this page — verify and reuse existing instances.) Mount the popup at the end of the template, next to the page's other popups:

```html
    <IndividualJournalsConfigPopup ref="individualConfigRef" />
```

- [ ] **Step 3: Typecheck + run**

Run: `npx vue-tsc --noEmit -p tsconfig.app.json` — no new errors.
Run app: open a group journal that has children → grid renders; «Настроить» opens popup with prefilled drafts; saving with mismatched hours is blocked.

- [ ] **Step 4: Commit**

```bash
git add src/components/IndividualJournalsConfigPopup.vue src/pages/JournalDetails.vue src/constants/calendar.ts src/components/Calendar/AddEventWizard.vue
git commit -m "feat(individual-journals): in-journal config popup with full edit lock"
```

---

### Task 10: journals.vue routing + delete guard

**Files:**
- Modify: `src/pages/journals.vue`
- Modify: `src/stores/journalStore.ts`

- [ ] **Step 1: Route wizard-children edits to the config popup**

In `src/pages/journals.vue`, replace `onEditJournal` (lines 1414-1423):

```ts
function onEditJournal(journalId: string) {
  const journal = journalStore.getJournalById(journalId);
  if (!journal) return;

  if (journal.sourceGroupEventId) {
    // Wizard-child individual journal: config lives on the main event
    individualConfigRef.value?.open(journal.sourceGroupEventId);
  } else if (journal.isIndividualJournal) {
    onEditIndividualJournal(journalId);
  } else {
    openEditJournalPopup(journalId);
  }
}
```

Add next to `individualJournalPopupRef` (line ~1511):

```ts
import IndividualJournalsConfigPopup from "@/components/IndividualJournalsConfigPopup.vue";

const individualConfigRef = ref<InstanceType<typeof IndividualJournalsConfigPopup> | null>(null);
```

and mount `<IndividualJournalsConfigPopup ref="individualConfigRef" />` in the template next to `<IndividualJournalPopup ... />`.

- [ ] **Step 2: Guard standalone deletion in journalStore**

In `src/stores/journalStore.ts`, find `deleteJournal` (used by journals.vue line 1356) and add at its top:

```ts
      const event = calendarStore.getEventById(journalId);
      if (event?.sourceGroupEventId) {
        throw new Error(
          "Индивидуальный журнал удаляется через настройку индивидуальных журналов основного журнала"
        );
      }
```

(The page's existing catch shows the error via `f7.dialog.alert` — no UI change needed.)

- [ ] **Step 3: Typecheck + commit**

Run: `npx vue-tsc --noEmit -p tsconfig.app.json` — no new errors.

```bash
git add src/pages/journals.vue src/stores/journalStore.ts
git commit -m "feat(individual-journals): route child edits to config popup, guard deletes"
```

---

### Task 11: «Общая» control-mark sync to main journal

**Files:**
- Modify: `src/stores/marksStore.ts`

- [ ] **Step 1: Add `syncToMainJournal` helper**

In `src/stores/marksStore.ts`, after the `syncToParentJournals` function (ends line ~712), add:

```ts
    // «Общая» trajectory: sync CONTROL marks from a wizard-child individual
    // journal up to its main group journal. Only control marks sync — date
    // columns differ between the child and main grids, but control columns
    // are shared per discipline-semester and matched by controlId.
    const syncToMainJournal = async (
      childJournalId: string,
      studentId: string,
      valueIndex: number,
      value: string | null,
      mark: Mark
    ): Promise<void> => {
      try {
        if (mark.controlType !== "intermediate" && mark.controlType !== "final") {
          return; // control marks only
        }

        const { useCalendarStore } = await import("./calendarStore");
        const calendarStore = useCalendarStore();

        const childEvent = calendarStore.getEventById(childJournalId);
        if (!childEvent?.isIndividualJournal || !childEvent.sourceGroupEventId) {
          return; // not a wizard-child individual journal
        }

        const mainEvent = calendarStore.getEventById(childEvent.sourceGroupEventId);
        if (!mainEvent || mainEvent.gradingType !== "combined") {
          return; // «Раздельная» or unknown: no sync
        }
        if (!mainEvent.participants?.includes(studentId)) {
          return;
        }

        const mainJournal = journalMarks.value[mainEvent.id];
        if (!mainJournal) {
          console.warn("[marksStore] Main journal not loaded, skipping control sync");
          return;
        }
        const mainStudentMark = mainJournal.studentMarks.find(
          (sm) => sm.studentId === studentId
        );
        if (!mainStudentMark) return;

        // Locate the SAME control column in the main grid by controlId/type —
        // column indexes differ between grids, never reuse the child's index.
        const mainMarkIndex = mainStudentMark.marks.findIndex(
          (m) =>
            m.controlType === mark.controlType &&
            (m.controlId ?? "") === (mark.controlId ?? "") &&
            (m.scheduledControlId ?? "") === (mark.scheduledControlId ?? "")
        );
        if (mainMarkIndex === -1) {
          console.warn("[marksStore] Matching control column not found in main journal");
          return;
        }

        const mainMark = mainStudentMark.marks[mainMarkIndex];
        if (valueIndex < 0 || valueIndex >= mainMark.values.length) return;
        mainMark.values[valueIndex] = value;
        mainJournal.lastUpdated = new Date().toISOString();

        const backendMainJournalId = await ensureBackendJournalId(mainEvent.id);
        if (!backendMainJournalId) {
          console.warn("[marksStore] Main journal not initialized in backend, skipping");
          return;
        }
        const userStore = useUserStore();
        const rawUserId = userStore.currentUser?.id;
        const userId = rawUserId ? (rawUserId as Id<"users">) : undefined;
        await convex.mutation(api.marks.mutations.updateMark, {
          journalId: backendMainJournalId as any,
          studentId,
          columnIndex: mainMarkIndex,
          rowIndex: valueIndex,
          value: value || undefined,
          columnType: mainMark.type,
          columnDate: mainMark.isoDate,
          columnLabel: mainMark.label,
          controlType: mainMark.controlType,
          controlId: mainMark.controlId,
          sessionId: mainMark.sessionId,
          scheduledControlId: mainMark.scheduledControlId,
          userId,
        });
        console.log("[marksStore] Synced control mark to main journal");
      } catch (err) {
        console.error("[marksStore] Error syncing control mark to main journal:", err);
      }
    };
```

- [ ] **Step 2: Call it after the existing parent sync**

In `updateStudentMark`, after line 598 (`await syncToParentJournals(...)`):

```ts
          await syncToMainJournal(journalId, studentId, valueIndex, value, mark);
```

- [ ] **Step 3: Typecheck + commit**

Run: `npx vue-tsc --noEmit -p tsconfig.app.json` — no new errors.

```bash
git add src/stores/marksStore.ts
git commit -m "feat(individual-journals): sync control marks to main journal for combined grading"
```

---

### Task 12: i18n keys + existing gap fixes

**Files:**
- Modify: `messages/frontend/ru.json`, `messages/frontend/en.json`, `messages/frontend/kk.json`

- [ ] **Step 1: Fix pre-existing gaps**

en.json and kk.json are missing keys ru.json has (around their line 314, next to `journal_merge_ineligible_tooltip`). Add to **en.json**:

```json
  "journal_merge": "Merge journals",
  "journal_split": "Split journals",
  "journal_merge_confirm_title": "Merge journals",
  "journal_merge_confirm_message": "Do you really want to merge the selected journals ({count}) into one individual journal? All students will be collected in the new journal.",
  "journal_split_confirm_title": "Split journal",
  "journal_split_confirm_message": "Do you really want to split this individual journal? All original journals will be restored.",
```

Add to **kk.json**:

```json
  "journal_merge": "Журналдарды біріктіру",
  "journal_split": "Журналдарды ажырату",
  "journal_merge_confirm_title": "Журналдарды біріктіру",
  "journal_merge_confirm_message": "Таңдалған журналдарды ({count}) бір жеке журналға біріктіргіңіз келе ме? Барлық студенттер жаңа журналға жиналады.",
  "journal_split_confirm_title": "Журналды ажырату",
  "journal_split_confirm_message": "Осы жеке журналды ажыратқыңыз келе ме? Барлық бастапқы журналдар қалпына келтіріледі.",
```

Add `journal_merge_min_select` (referenced at `journals.vue:1283`, missing in all three):

- ru.json: `"journal_merge_min_select": "Выберите минимум два журнала для объединения",`
- en.json: `"journal_merge_min_select": "Select at least two journals to merge",`
- kk.json: `"journal_merge_min_select": "Біріктіру үшін кемінде екі журнал таңдаңыз",`

- [ ] **Step 2: Recompile paraglide and verify**

Run: `npm run dev` (paraglide compiles on dev/build) or the project's paraglide compile script if present (`grep paraglide package.json` for the exact script).
Expected: no missing-key warnings for the keys above.

(New feature UI strings stay hardcoded Russian inside the editor/popup, consistent with AddEventWizard's existing step-5 strings.)

- [ ] **Step 3: Commit**

```bash
git add messages/frontend/ru.json messages/frontend/en.json messages/frontend/kk.json
git commit -m "fix(i18n): add missing journal merge/split keys in en and kk"
```

---

### Task 13: Verification

- [ ] **Step 1: Full unit suite + typecheck**

Run: `npx jest && npx vue-tsc --noEmit -p tsconfig.app.json && npx convex dev --once`
Expected: all tests pass; no type errors; Convex functions deploy.

- [ ] **Step 2: Manual QA script (dev app, `npm run dev`)**

1. **RUP budget**: open RUP page → edit an entry → set «Индивидуальные (дополнительно)» = 4, distribute to semesters → save.
2. **Wizard gating**: Создать → pick that discipline → steps 1-4 → step 5: toggle ENABLED. Pick a discipline without individual hours → toggle disabled with helper text.
3. **Exact match**: enable toggle → add journal, students, ПН slot. Badge `Инд.: X / 4 ч` red until scheduled hours = 4 exactly; «Создать» disabled until green.
4. **Persistence**: Создать → journals page → «Индивидуальные» filter shows «Индивидуальный журнал #1»; course tabs do NOT show it; main journal appears normally.
5. **Children grid**: open main journal → «Индивидуальные журналы» section lists children; click navigates to child journal grid.
6. **Edit config**: «Настроить» → popup prefilled → move a student between journals → save → children updated.
7. **Full lock**: put any mark in a child journal → «Настроить» again → «Редактирование невозможно» dialog.
8. **Delete guard**: journals page selection mode → try deleting a child → error toast about deleting via main journal config.
9. **Общая sync**: main event gradingType combined → put an РК (control) mark in child → open main journal → same student's matching control column shows the mark. «Раздельная»: no sync.
10. **Merge mechanism untouched**: merge two plain journals via the old popup → still works; split works.

- [ ] **Step 3: Final commit if fixes were needed; otherwise done**

---

## Self-Review Results

- **Spec coverage:** schema (T1), atomic create (T3), edit lock mutation + query (T4), wizard persistence (T7), hour fix + exact match (T5-T6), shared editor (T8), in-journal popup + JournalDetails (T9), filters/routing/delete guard (T10), control-mark sync (T11), i18n (T12), testing (T2, T5, T13). E2e deferred — documented deviation (needs fixtures).
- **Type consistency:** `IndividualJournalPayload` (lib) ↔ mutation args ↔ store method param shape match (`studentIds` + `weeklySchedules`). Draft↔payload mapping defined twice (AddEventButton, popup) with the same `{weekId, startId, endId}` projection.
- **Placeholder scan:** none found.
