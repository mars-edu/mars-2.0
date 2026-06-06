# Individual Journals: Port concept-v2 Logic to mars-2.0

**Date:** 2026-06-07
**Status:** Approved design, pending implementation plan

## Problem

mars-2.0 has two disjoint individual-journal mechanisms:

1. **Merge-based (live):** `IndividualJournalPopup.vue` bundles existing journals into a parent event with `isIndividualJournal: true` + `mergedJournalIds[]`; children get `parentIndividualJournalId`. Marks sync client-side via `marksStore.syncToParentJournals`.
2. **Wizard step 5 (dead-end UI):** `AddEventWizard.vue` collects individual-journal drafts (students, day slots, gradingType) gated on RUP individual hours, but `AddEventButton.handleAddEvent` (`src/components/Calendar/AddEventButton.vue:161-175`) drops the drafts — they never reach Convex.

concept-v2 has a complete, persisted flow (ScheduleModal step 5 + in-journal modal) with strict hour budgeting, edit locks, and grading trajectories. This design ports that logic into mars-2.0's architecture.

## Decisions (settled with user)

| Question | Decision |
|---|---|
| Scope | Full port: wizard persistence, hour rules, in-journal creation/edit, grading trajectories |
| Data model | Separate calendarEvents per sub-journal (not embedded array) |
| Merge mechanism | Keep both; distinguish by `mergedJournalIds` (merge-parent) vs `sourceGroupEventId` (wizard-child) |
| Hour validation | Exact match: Σ sub-journal hours === semester individual-hours budget; Создать blocked otherwise |
| Edit lock | Full lock (concept-v2): any mark in any sub-journal forbids config editing |
| Orchestration | Backend-orchestrated creation (atomic Convex mutation); marks sync stays client-side |
| Общая mark sync | Control marks only (РК/intermediate/final); date-lesson marks stay in sub-journal |

## 1. Schema

`convex/schema.ts` and `convex/schema.post-migration.ts` (keep in sync), `calendarEvents` table:

```ts
sourceGroupEventId: v.optional(v.string()),  // child → main group event link
gradingType: v.optional(v.union(v.literal('combined'), v.literal('separate'))),  // stored on main event
```

- No new tables. Children reuse existing `isIndividualJournal: true` (schema.ts:485).
- Merge-parent: has `mergedJournalIds`. Wizard-child: has `sourceGroupEventId`. Never both.
- No new index: calendarStore holds all events client-side; backend lookups filter by field (existing pattern).

## 2. Backend (Convex)

### `calendarEvents.createWithIndividualJournals` (new mutation)

- Args: main-event fields (same as `create`) + `gradingType` + `individualJournals: [{ studentIds: string[], weeklySchedules: WeeklySchedule[] }]`.
- Atomic (Convex mutation = transaction): inserts main event, then each child with:
  - `rupEntryId`, teacher, semester, academic year copied from main
  - `participants = studentIds`, own `weeklySchedules`
  - `isIndividualJournal: true`, `sourceGroupEventId: mainId`
  - `customTitle: "Индивидуальный журнал #N"`
- Server-side shape validation: each child ≥1 student, ≥1 complete slot (startId+endId), gradingType set when children present.
- Exact-hours check stays client-side (server lacks lesson-time schedule math). Known trust boundary, consistent with the rest of the backend.
- Returns `{ mainId, childIds }`.

### `calendarEvents.updateIndividualJournalsConfig` (new mutation)

- Args: `mainEventId`, full child-config list (upsert by id; missing ids = delete).
- **Server-side full lock:** for each existing child → journal via `by_calendarEvent` → if ANY mark exists, throw `"INDIVIDUAL_JOURNALS_LOCKED"`. Client maps to refusal dialog.
- Deleted children cascade via existing journal removal (deletes journalStudents + marks, `convex/journals/mutations.ts:63-91`) plus the child event itself.

### `journals.hasMarksInIndividualJournals(mainEventId)` (new query)

Popup pre-check before opening the editor (UX). Server lock re-checks on save regardless.

## 3. Frontend: create path

- `AddEventButton.handleAddEvent`: if `useIndividualJournals && individualJournals.length > 0` → `calendarStore.addEventWithIndividualJournals(eventData, gradingType, drafts)`; else existing `addEvent`. Drafts no longer dropped.
- `calendarStore.addEventWithIndividualJournals` (new): maps draft `daySlots` (`WeekDaySchedule { weekId, russianWeekDay, startId, endId }`) → `weeklySchedules` payload, resolving `startTime`/`endTime` from slot ids with the same helper the main event uses; calls `createWithIndividualJournals`; inserts returned main + children into local `events`.

## 4. Hour math + exact-match validation

- Extract shared helper `computeScheduleHours(daySlots, weekCount, scheduleIndex)` from `useEventFormDerived.selectedHours` logic (`src/components/Calendar/useEventFormDerived.ts:118-144`).
- **Fixes existing unit bug:** current `totalIndividualHours` (`AddEventWizard.vue:1286-1292`) counts weekly slots; План badge shows semester totals. Per-journal hours must be weekly slot hours × weeks.
- Budget: matched `distributionEntry.individualHours` for active semester/year (same matching as `semesterPlannedHours`, `useEventFormDerived.ts:95-116`); fallback `rupEntry.individualHours + individualAdditionalHours` (mirrors the toggle gate `AddEventWizard.vue:785-798`).
- `isStep5Valid` extended: existing checks AND `totalIndividualHours === individualBudget`.
- Badge becomes `Инд.: X / Y ч`, green on exact match, red otherwise; Создать blocked until exact.

## 5. Shared editor + in-journal path

- Extract step-5 template (`AddEventWizard.vue:382-606`) + logic (draft CRUD, student exclusivity, slot management; `:1132-1292`) into `IndividualJournalsEditor.vue` + `useIndividualJournalsEditor.ts`.
  - Props: student pool, rupEntryId (budget), v-models for drafts/gradingType.
  - Wizard keeps using it inside step 5 — no behavior change.
- New `IndividualJournalsConfigPopup.vue`:
  - Entry point: `JournalDetails.vue` action menu item "Индивидуальные журналы", shown only for group journals (not `isIndividualJournal`, no `mergedJournalIds`).
  - On open: `hasMarksInIndividualJournals` → if true, refusal dialog "В индивидуальных журналах уже выставлены оценки — редактирование запрещено"; else load children from calendarStore by `sourceGroupEventId`, map back to drafts, edit, save via `updateIndividualJournalsConfig`.
- Wizard edit mode stays stripped (step 5 add-only, as now); editing goes through the popup.

## 6. Grading trajectories

- `gradingType` lives on the main event.
- **Раздельная (separate):** no sync; sub-journal marks stay in the sub-journal.
- **Общая (combined):** new `marksStore.syncToMainJournal` — after `updateStudentMark` on an event with `sourceGroupEventId` whose main event has `gradingType === 'combined'`, write the same mark to the main journal via `api.marks.mutations.updateMark`. Mirrors `syncToParentJournals` (`src/stores/marksStore.ts:597-712`), inverted direction.
- **Sync scope: control marks only** (`controlType` intermediate/final, РК columns) — control columns are shared per discipline-semester so they align. Date-lesson marks do not sync (sub-journal schedules differ from main; syncing by date would require column-merge rendering in the main grid — rejected for scope).

## 7. Rendering / filters / i18n

- `journalStore.individualJournals` getter (`isIndividualJournal && !mergedJournalIds`) catches wizard children automatically → "Индивидуальные" filter works as-is.
- `journalsByCourse` / `mixedGroupJournals`: also exclude events with `sourceGroupEventId` (children appear only under the individual filter, mirroring merge-children exclusion `journalStore.ts:142-150`).
- Main journal's `JournalDetails.vue`: new section "Индивидуальные журналы" listing child links (analogous to `mergedChildJournals`, `:546`, but via `sourceGroupEventId`).
- Child cards: marks editable normally in grid; config read-only; standalone delete blocked; card edit routes to the main event's config popup (mirrors `onEditIndividualJournal` routing, `journals.vue:1414-1423`).
- i18n: new keys in ru/en/kk (toggle, badges, refusal/confirm dialogs, popup title). Also fix existing gaps: `journal_merge_min_select` missing in all 3 locales; en/kk missing `journal_merge`, `journal_split`, and confirm keys.

## 8. Testing

- **Unit (jest):** `computeScheduleHours`, `isStep5Valid` exact-match, draft↔payload mapping.
- **Convex tests:** `createWithIndividualJournals` atomicity + shape validation; `updateIndividualJournalsConfig` lock throw; cascade delete of removed children.
- **Playwright e2e:** wizard full flow (RUP individual hours → toggle enabled → drafts → Создать → children appear under individual filter); edit-lock refusal; Общая control-mark sync.

## Out of scope

- Unifying merge mechanism with wizard path (kept separate deliberately).
- Per-journal KTP attachment (the "Прикрепить КТП/РУП" stub button stays a stub).
- Server-side exact-hours validation (requires lesson-time schedule math on backend).
- Date-lesson mark sync for Общая (control marks only).
