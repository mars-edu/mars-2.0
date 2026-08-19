# P5 — RUP Language-Variant Schema Migration Plan

**Goal:** collapse the N-duplicate-rows model of `rupEntries` (one row per teaching
language, sharing a `groupId`, each with its own full copy of every hour field and its
own `distributionEntries`) into **one row per discipline** with embedded translations:

```ts
variants: { language: string; moduleIndex: string; moduleName: string; learningOutcome: string }[]
```

Status: **analysis / plan only — nothing here has been implemented.**
Prod: `festive-cormorant-785`, ~42 `rupEntries`, ~63 `distributionEntries`, 141 `ktps`,
78 `journals`, 83 `calendarEvents`, 824 `marks`.

---

## 0. Verified facts & corrections to the task brief

Everything below was verified against the code on `dev` (2026-08). Where the brief and
the code disagree, the code wins:

1. **P1 confirmed.** `saveRupEntryGroup` (`convex/rupEntries/mutations.ts:537-767`) is the
   atomic group upsert: server-generated `groupId`, upsert variants (patch when `id`
   present / insert when absent), `removedVariantIds` deletion guarded by `scanRefs`
   (`mutations.ts:14-49`), wholesale delete-then-insert of `distributionEntries` per
   variant (`mutations.ts:738-763`), and server-side hour validation
   (`mutations.ts:521-524`, `606-630`). **Correction:** the validated hour-field set
   excludes `field3Value` (it is shared but not hours-validated; the brief listed it as
   an hour field).
2. **Since P1, every popup save writes identical shared fields + identical distribution
   sets to all variants of a group** — the shared payload is copied to each variant id
   (`mutations.ts:661-678`, `738-763`). New divergence can only enter via the *legacy*
   mutations (`create`, `update`, `updateWithDistributions`, `addDistribution`,
   `updateDistribution`) or direct API calls.
3. **Most legacy store write-paths are dead code.** In `src/stores/rupEntryStore.ts`:
   `addRupEntries` (l.310), `addRupEntryMultiLanguage` (l.529), `createEmptyRupEntry`
   (l.214) and `updateRupEntry` (l.365) have **no callers anywhere in `src/`** (verified
   by grep). Live write-paths are only: `saveRupEntryGroup` (popup submit,
   `RupEntryPopup.vue:411`), `deleteRupEntry` / `deleteRupEntryGroup`
   (`RupEntryTable.vue:326/338`, `RupEntryPopup.vue:488`), `duplicateRupEntry`
   (`src/pages/rup.vue:320`) and `updateRupEntryOrder` (reorder,
   `RupEntryTable.vue:210`). This meaningfully shrinks the blast radius.
4. **`createMultiLanguage`** (`mutations.ts:430`) is `@deprecated`, create-only, and has
   **zero callers** outside `_generated`. It can be deleted in Phase 0.
5. **Journal "group language" does NOT come from the RUP variant.**
   `journalStore.getJournalGroupLanguage` (`src/stores/journalStore.ts:37-46`) derives it
   from the *students'* languages. The variant-id→language signal matters in fewer
   places than feared, but it is not zero — see §2.4.
6. **`rupHours.spec.ts` has 38 `expect` calls** (brief said 15 assertions); all of them
   test pure math in `src/lib/rupHours.ts` and are untouched by this migration.
7. `docs/` is empty (`7792e4f chore: clear docs folder`); code comments still reference
   `docs/migration-playbook.md`. "Pattern A" knowledge now lives only in the headers of
   `convex/migrations/educationTechnologyBackfill.ts` and `convex/migrations/workloads.ts`.
8. All external FK columns to `rupEntries` are **plain `v.string()`**, except
   `distributionEntries.rupEntryId` which is `v.id("rupEntries")`
   (`convex/schema/rup.ts:40`). String FKs mean deleted variant ids do not violate
   schema validation — they just dangle silently. That is exactly why the backfill must
   repoint *before* deleting.

---

## 1. Full inventory of the group model (as of `dev` today)

### 1.1 Schema

| Site | What |
|---|---|
| `convex/schema/rup.ts:8-34` | `rupEntries` table: `language` (optional), `groupId` (optional), per-row copies of all hour fields, `.index("by_groupId", ["groupId"])` |
| `convex/schema/rup.ts:39-56` | `distributionEntries.rupEntryId: v.id("rupEntries")` — per-variant children |
| `convex/schema/rup.ts:83-116` | `scheduledIntermediateControls.rupEntryId` / `scheduledFinalControls.rupEntryId` (optional string, indexed `by_rupEntryId`) |
| `convex/schema/calendar.ts:10,55` | `calendarEvents.rupEntryId: v.string()`, index `by_rupEntryId` |
| `convex/schema/calendar.ts:66,72,76` | `ktps.rupEntryId: v.string()`, index `by_rupEntryId`; **`ktps.languages: v.optional(v.array(v.string()))`** — KTP already carries its own language set |
| `convex/schema/journals.ts:11` | `journals.disciplineId: v.string()` — **no index** (all lookups scan+filter) |
| `convex/schema/workloadItem.ts:30,71` | `workloads.items[].subjectId: v.string()` ("Convex ID of the rupEntry"), `items[].language: v.optional(v.string())` — workload items store their **own** language |

### 1.2 Convex functions

| Site | Role |
|---|---|
| `convex/rupEntries/mutations.ts:14-49` `scanRefs` | reference-check across calendarEvents / ktps / scheduled*Controls / journals (journals via unindexed filter, l.36-39) |
| `mutations.ts:63-94` `create` | legacy single-row insert (accepts `language`, `groupId`) — still used by `duplicateRupEntry` |
| `mutations.ts:99-137` `update` | legacy single-row patch — **no live callers** |
| `mutations.ts:150-176` `remove` | single-variant delete, blocked by refs, cascades distributions |
| `mutations.ts:184-218` `removeGroup` | atomic whole-group delete, refs aggregated across variants |
| `mutations.ts:223-231` `reorder` | per-row positions (variants are individually orderable rows today) |
| `mutations.ts:236-305` `addDistribution` / `updateDistribution` / `removeDistribution` | per-variant distribution CRUD (divergence bypass) |
| `mutations.ts:310-418` `updateWithDistributions` | legacy single-variant full sync — **no live callers** |
| `mutations.ts:430-515` `createMultiLanguage` | deprecated, **no callers** |
| `mutations.ts:537-767` `saveRupEntryGroup` | **the P1 seam** — atomic group upsert; the natural place to switch to single-row writes |
| `convex/rupEntries/queries.ts:7-29` `list` | all rows + joined distributions (the store's single reactive source) |
| `queries.ts:34-50` `getById`, `queries.ts:55-124` `getByAcademicYear[AndSpecialty]`, `queries.ts:129-153` `getByGroupId` | per-row reads |
| `convex/workloads/mutations.ts:155-172` | journal generation writes `calendarEvents.rupEntryId = g.subjectId` and `journals.disciplineId = g.subjectId` |
| `convex/workloads/lib.ts:77-97` | student narrowing by workload-item language (not the rup row's) |
| `convex/tests/queries.ts:24-25`, `convex/makeupRequests/mutations.ts:26-27`, `convex/substitutions/mutations.ts:21-23,128`, `convex/substitutions/queries.ts:201-202`, `convex/livekit/tools.ts:219-225` | resolve `journal.disciplineId` / `event.rupEntryId` → `ctx.db.get` on `rupEntries` (read `moduleName` etc.) |
| `convex/scheduledControls/{queries,mutations}.ts` (q:48-65, m:15-232) | read/write `rupEntryId` on scheduled controls |
| `convex/ktps/{mutations,queries}.ts` (m:11,35; q:62-66) | KTP ↔ rupEntryId |
| `convex/calendarEvents/{mutations,queries}.ts` (m:30,69,145,188,308; q:131,278-282) | events ↔ rupEntryId |

### 1.3 Pinia store — `src/stores/rupEntryStore.ts`

| Line | What |
|---|---|
| 22-74 | reactive `list` query → maps `language` (l.40), `groupId` (l.41), hour fields, distributions |
| 76-83 | `getRupEntryById` (Map) — the id-resolution hub used by ~25 components |
| 116-119 | `getGroupedVariants(groupId)` — client-side group assembly |
| 195-212 | `rupEntryOptions` — one option **per variant row** (this is why DisciplineSelect shows N options per discipline) |
| 434-527 | `duplicateRupEntry` — deliberately drops `groupId` (l.487) |
| 594-605 | `saveRupEntryGroup` wrapper |
| 607-633 | `deleteRupEntryGroup` / `deleteRupEntry` + `rethrowRupDeleteError` (l.580-588) |
| 310-363, 529-574, 214-246, 365-413 | dead legacy API (see §0.3) |

### 1.4 Popup + composables (write UI)

| Site | What |
|---|---|
| `src/composables/useLanguageVariants.ts` (whole file, 117 l.) | client mirror of the variants concept: `selectedLanguages`/`activeLanguageTab`/`languageTexts`/`editVariantIds`; `loadFromVariants` (l.62-81), `buildSaveVariants` (l.84-96), `buildRemovedVariantIds` (l.99-103). **Its state shape is already exactly the target `variants[]` model** — post-migration only `editVariantIds` (per-language row ids) loses meaning. |
| `src/components/RupEntryPopup.vue:275-278` | edit prefill: `getGroupedVariants(val.groupId)` → `loadFromVariants(variants, val.language)` (P4: clicked variant drives active tab) |
| `RupEntryPopup.vue:309,332,349` | fallback single-variant prefill via `editVariantIds = { [lang]: val.id }` |
| `RupEntryPopup.vue:238-246` | `copyFromSource` reads all variants of the source group |
| `RupEntryPopup.vue:407-430` | submit → `buildSaveVariants` + `buildRemovedVariantIds` → `saveRupEntryGroup` (groupId passed only in edit mode, l.412) |
| `RupEntryPopup.vue:460-461,488` | delete: group-aware confirm |
| `src/components/RupLanguageTabs.vue`, `RupHourFields.vue`, `RupDistributionTable.vue`, `RupSpecialtyPicker.vue`, `RupIntegrationPanel.vue` | P3 children; hour fields + distributions are already single-instance in the form (shared across tabs) |
| `src/composables/useRupEntryForm.ts` | shared hour-field form state (single instance, language-agnostic) |
| `src/validators/rup.ts` | zod `rupEntrySchema` — text fields validated per-variant, hours once |

### 1.5 Read UI (table / view / catalog / pickers)

| Site | What |
|---|---|
| `src/components/RupEntryTable.vue:5,32-40` | **one table row per variant**, per-row language badge |
| `RupEntryTable.vue:308-360` | delete dialog offers «Только этот язык» vs «Все варианты» (`getGroupedVariants` l.311, `deleteRupEntryGroup` l.338) |
| `src/components/RupEntryViewPopover.vue:315-316` | variants listing in the view popover |
| `src/pages/DisciplineCatalog.vue:84,118-125` | catalog row shows `item.language` badge — one row per variant |
| `src/components/DisciplineSelect.vue:98-140` | discipline picker (used by `AddKtpItemForm.vue`, `Calendar/EventForm.vue`, `Calendar/AddEventWizard.vue`, `Calendar/CalendarToolbar.vue`): one option per variant row with `language` badge (l.135) — **picking a variant is how users pick the teaching language of an event/KTP today** |
| `src/pages/WorkloadManagement.vue:109,125-127,866,906-914,942,986-988` | subject list = variant rows; `rowLangs` default `[rup.language \|\| "ru"]`; chosen language stored on the workload item |
| `src/lib/workloadHours.ts:91-114` | `seedWorkloadItemsFromRup`: `language: opts.language \|\| rup.language \|\| "ru"` |
| `src/components/Workload/WorkloadJournalWizard.vue:383,401` | `defaultLang: item.language ?? rup?.language ?? "ru"` |

### 1.6 Consumers resolving a rupEntry by id (all keep working if ids are repointed)

`getRupEntryById` call sites (25+): `src/pages/JournalDetails.vue:649,912,1066`,
`src/pages/WorkloadManagement.vue:109`, `src/components/KtpDetailPopup.vue:93`,
`AnalyticsTranscriptView.vue:257`, `IndividualJournalsConfigPopup.vue:139,166`,
`JournalTab.vue:320,368`, `AddKtpItemForm.vue:238,337`,
`journal/useJournalColumns.ts:62,138`, `Workload/WorkloadJournalWizard.vue:383`,
`Calendar/useEventFormDerived.ts:92,97`, `Calendar/IndividualJournalsEditor.vue:269`,
`Calendar/EventForm.vue:445`, `Calendar/AddEventWizard.vue:765,771,910`,
`Calendar/StudentSelectionPopup.vue:264,465,471`, `Calendar/CalendarToolbar.vue:56`,
`src/stores/calendarStore.ts:101`, `src/stores/marksStore.ts:76,536`,
`src/stores/journalStore.ts:447`, `src/composables/useKtpPlannedHours.ts:33`,
`useKtpDetail.ts:52,61`, `useJournalMarkTemplate.ts:127,189`,
`src/stores/rupStore.ts:59-61`.

### 1.7 Exporters / reports

| Site | What |
|---|---|
| `src/utils/journalExport.ts:131,178-184` | journal Excel export: `rupEntries.find(c => c.id === journal.disciplineId)` → moduleName/hours/distribution |
| `src/services/teacher-workload-calculator.ts:29-35,184-205,330-413` | Form-2 / monthly distribution: `rupEntryItems.find(c => c.id === event.rupEntryId)`, `plannedHours = parseFloat(rupEntry.totalHours)` |
| `src/pages/reports.vue:573-600` | feeds the whole `rupEntries` array into the calculators |
| `src/lib/excel/*.types.ts` | consume already-resolved `disciplineTitle` strings — unaffected |

### 1.8 Tests

- `src/lib/__tests__/rupHours.spec.ts` (38 expects) — pure hour math, **unaffected**.
- `src/lib/__tests__/rupRefs.spec.ts` (14 expects) — delete-blocked message formatting, unaffected in Phases 0-2, message wording may change in Phase 3.
- `src/lib/__tests__/workloadHours.spec.ts` — `seedWorkloadItemsFromRup` uses `rup.language`; needs a variant-aware fixture in Phase 3.
- `tests/e2e/disciplines.spec.ts`, `catalogs.spec.ts`, `ktp.spec.ts`, `planning-journal-flow.spec.ts`, `workload.spec.ts`, `page-refresh.spec.ts` — exercise the RUP table / discipline pickers; the N-rows-per-discipline rendering assumption breaks in Phase 3.
- No convex-test suite for `rupEntries` mutations exists today (only `convex/workloads/__tests__/lib.spec.ts`).

---

## 2. Blast-radius assessment (the crux)

Collapsing N rows → 1 makes **N−1 rupEntry ids disappear**. Every table below can hold
such an id. All FKs except `distributionEntries.rupEntryId` are strings, so nothing
would *fail validation* — dangling refs would silently break journals, KTP hour math,
event titles, workload subject resolution. The backfill must repoint **before** deleting.

| Table | FK | Index for lookup | Repoint action | Post-repoint dedup concern |
|---|---|---|---|---|
| `distributionEntries` | `rupEntryId: v.id` | `by_rupEntry` | **Do not repoint — delete.** Non-survivor variants' distribution sets are dropped; the survivor keeps its own set (after the divergence audit proves the sets are equivalent, or the operator resolves). Repointing instead of deleting would double the survivor's semester rows. | Must verify survivor's set ≡ each dropped set (per-semester hours/controls), else data loss. |
| `calendarEvents` | `rupEntryId: string` | `by_rupEntryId` | `ctx.db.patch(e._id, { rupEntryId: survivorId })` | None — events are per-group-of-students; two events pointing at the same discipline is normal. |
| `ktps` | `rupEntryId: string` | `by_rupEntryId` | patch to survivor | ⚠️ Possible logical duplicates: a "KZ KTP" and a "RU KTP" for the same discipline both now point at one entry. `ktps.languages` already distinguishes them; UI lists KTPs per rupEntryId (`convex/ktps/queries.ts:62-66`) so both will show. Acceptable, but flag in the audit report. |
| `journals` | `disciplineId: string` | **none** (scan) | full scan of `journals` (78 rows — fine), patch matches | Same logical-duplicate note as ktps; journal identity also carries `groupName`/students, so no collision. |
| `scheduledIntermediateControls` | `rupEntryId?: string` | `by_rupEntryId` | patch to survivor | Two variants may each have a scheduled control for the same semester → after repoint the discipline has 2 scheduled controls. Audit must report; propose keep-both (they render as a list) unless identical `(controlId, semesterId, dates)` → then delete the duplicate. |
| `scheduledFinalControls` | `rupEntryId?: string` | `by_rupEntryId` | same as above | same |
| `workloads.items[].subjectId` | string inside array | none (scan `workloads`) | for each workload doc: `items.map(it => remap[it.subjectId] ?? it.subjectId)`, patch `items` if changed. Also the derived `_ind` child rows (`id.endsWith("_ind")`, `WorkloadManagement.vue:867`) carry the same `subjectId` — the map handles them identically. | ⚠️ A teacher may legitimately hold two workload items for the same discipline in different languages (item `language` differs). After remap both items share one `subjectId`; the UI guard `isAlreadyAdded` (`WorkloadManagement.vue:871-873`) will then block re-adding but existing rows stay — OK, but the audit must count `workloads` where two items collapse onto one `subjectId`. |
| `marks`, `journalStudents`, `markHistory` | via `journalId` only | — | **untouched** (no direct rupEntry FK) | — |
| `substitutions`, `makeupRequests`, `tests` | via `journalId`/`calendarEventId` | — | untouched (they resolve `disciplineId` at read time) | — |

Client-side, `localStorage`-persisted Pinia state (`persist: true` on `rupEntryStore`)
may cache stale variant ids briefly; the store is fully rebuilt from the reactive `list`
query, so no action needed beyond a normal deploy.

**Survivor selection** must be deterministic. Proposed rule (see open question Q3):

1. If exactly one variant in the group holds external references → it survives
   (zero repointing).
2. Else prefer the variant whose `language` matches the **configured default
   study language** — `studyLanguages` where `isDefault === true` (commit
   `47e430b` made this a real setting; prod currently seeds `ru` as default).
   The migration must read it from the table, **not** hardcode `"ru"`:
   ```ts
   const defaultLang = await ctx.db
     .query("studyLanguages")
     .withIndex("by_isDefault", (q) => q.eq("isDefault", true))
     .first();
   const defaultCode = defaultLang?.code ?? "ru"; // last-resort only
   ```
   Owner decision (2026-08): survivor language comes from Settings, so an
   institution that teaches primarily in `kk` gets the right survivor without
   a code change.
3. Else the oldest `_creationTime` (the original row).

Entries **without** `groupId` (singletons) are also migrated: they become
`variants: [{ language: language || defaultCode, moduleIndex, moduleName, learningOutcome }]`
with no repointing needed.

> Note: the `|| "ru"` fallbacks this doc cites at `useLanguageVariants.ts:37`,
> `workloadHours.ts:114`, `WorkloadManagement.vue:907` were partly de-hardcoded
> in `47e430b` (popup + variants composable now resolve the default from the
> store). `workloadHours.ts` / `WorkloadManagement.vue` still carry literals —
> fold those into the workload array migration rather than this one.

### 2.4 The language-signal loss (semantic blast radius)

Today the *variant id itself* encodes teaching language in three flows:

- **DisciplineSelect** (`:135`): users pick "Химия (KZ)" vs "Химия (RU)" when creating a
  calendar event / KTP. `calendarEvents` has **no language column** — the language of a
  lesson group is recoverable only through the variant id (or the students).
- **Workload wizard defaults** (`workloadHours.ts:114`, `WorkloadJournalWizard.vue:401`)
  — mitigated: workload items store their own `language`.
- **KTP** — mitigated: `ktps.languages` exists.

After collapse, one entry = one option; the event-creation flow loses the language
choice unless we (a) add `language: v.optional(v.string())` to `calendarEvents` and a
selector to the wizard, or (b) accept that student composition defines language (as
`getJournalGroupLanguage` already does for journals). **This is open question Q1 — do
not start Phase 3 without an answer.**

---

## 3. Merge-conflict policy (diverged groups)

### 3.1 What can diverge

Within one `groupId`: any of the 11 shared scalar fields (`totalHours`, `groupHours`,
`theoreticalHours`, `labPracticalHours`, `srsHours`, `srspHours`, `individualHours`,
`individualAdditionalHours`, `trainingPracticeHours`, `field3Value`, `totalCredits`),
plus `specialtyIds`, `baseClass`, `academicYearId` (should never differ, but nothing
enforces it for legacy rows), plus the **distribution sets** (per-semester hours,
control flags).

### 3.2 Proposed policy — audit first, abort on divergence, explicit override

Given 42 prod rows, I recommend **not inventing an automatic business rule**:

1. **Pre-flight audit** (§3.3, dry-run, read-only) prints every diverged group with a
   field-by-field diff and the reference counts per variant.
2. **Default behavior of the collapse: throw** (`ConvexError DIVERGED_GROUP`) on any
   divergence. Because the collapse runs in one transaction (§4), a throw is a no-op.
3. The operator fixes diverged groups **through the existing UI**: opening the group in
   `RupEntryPopup` and pressing save runs `saveRupEntryGroup`, which rewrites all
   variants with one shared payload — i.e. the app already contains a manual
   reconciliation tool. Re-run the collapse after.
4. Escape hatch for bulk damage: `{ force: "newest" }` argument — on divergence take
   each shared field from the variant with the max `updatedAt` (row-level, not
   per-field, to avoid Frankenstein rows), and that variant's distribution set.

Why not auto-"newest `updatedAt`" by default: `updatedAt` is an app-written string that
legacy mutations also touch (e.g. `reorder` does NOT update it, but position-shift
`update` calls in `duplicateRupEntry` l.455-476 DO) — recency is a weak proxy for
correctness. Why not "most-referenced row's values": reference count measures usage of
the *id*, not trustworthiness of the *hours*. With this dataset size, human eyes are
cheaper and safer than any heuristic. (Open question Q2 — confirm.)

Distribution-set divergence uses the same policy: audit → abort → manual resave (which
already rewrites every variant's set identically) → re-run.

### 3.3 Pre-flight audit query (Phase 2 code, read-only)

```ts
// convex/migrations/rupVariantsCollapse.ts
export const auditGroups = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("rupEntries").collect();
    const groups = new Map<string, typeof all>();
    for (const r of all) {
      const key = r.groupId ?? `__solo__${r._id}`;
      (groups.get(key) ?? groups.set(key, []).get(key)!).push(r);
    }
    const SHARED = ["totalCredits","totalHours","groupHours","theoreticalHours",
      "labPracticalHours","field3Value","srspHours","srsHours",
      "trainingPracticeHours","individualHours","individualAdditionalHours",
      "academicYearId","position"] as const;
    const report = [];
    for (const [gid, rows] of groups) {
      if (rows.length < 2) continue;
      const diverged: Record<string, string[]> = {};
      for (const f of SHARED) {
        const vals = [...new Set(rows.map(r => JSON.stringify((r as any)[f] ?? "")))];
        if (vals.length > 1) diverged[f] = vals;
      }
      const specs = [...new Set(rows.map(r => JSON.stringify([...r.specialtyIds].sort())))];
      if (specs.length > 1) diverged.specialtyIds = specs;
      // distribution fingerprints: sorted (semesterId, hours, controls) tuples
      const fingerprints = await Promise.all(rows.map(async (r) => {
        const ds = await ctx.db.query("distributionEntries")
          .withIndex("by_rupEntry", q => q.eq("rupEntryId", r._id)).collect();
        return JSON.stringify(ds.map(d => [d.semesterId, d.hours, d.srsHours ?? "",
          d.srspHours ?? "", d.individualHours ?? "", d.intermediateControlId ?? "",
          d.finalControlId ?? "", !!d.examEnabled, !!d.creditEnabled,
          !!d.controlLessonEnabled]).sort());
      }));
      if (new Set(fingerprints).size > 1) diverged.distributionEntries = fingerprints;
      // reference counts per variant (reuse scanRefs)
      const refs: Record<string, Record<string, number>> = {};
      for (const r of rows) refs[`${r.language}:${r._id}`] = await scanRefs(ctx, r._id);
      report.push({
        groupId: gid,
        name: rows[0].moduleName,
        languages: rows.map(r => r.language),
        diverged: Object.keys(diverged).length ? diverged : undefined,
        refs,
      });
    }
    return {
      groupCount: report.length,
      divergedCount: report.filter(g => g.diverged).length,
      groups: report,
    };
  },
});
```

Run: `npx convex run migrations/rupVariantsCollapse:auditGroups --prod` — the operator
sees the full damage report *before* anything is written. (`scanRefs` must be exported
from `convex/rupEntries/mutations.ts` or duplicated into the migration file.)

---

## 4. Target model & phase plan (expand-contract, each phase shippable)

### Target schema (end state, Phase 4)

```ts
rupEntries: defineTable({
  specialtyIds: v.array(v.string()),
  academicYearId: v.string(),
  baseClass: v.optional(v.array(v.number())),
  variants: v.array(v.object({          // ≥1 enforced in mutations
    language: v.string(),
    moduleIndex: v.string(),
    moduleName: v.string(),
    learningOutcome: v.string(),
  })),
  totalCredits: v.string(), totalHours: v.string(), /* …all 11 hour fields, single copy… */
  position: v.number(),
  createdAt: v.string(), updatedAt: v.string(),
})
  .index("by_academicYear", ["academicYearId"])
  .index("by_position", ["academicYearId", "position"])
  // by_groupId, language, groupId, top-level moduleIndex/moduleName/learningOutcome: REMOVED
```

Fate of top-level `moduleIndex/moduleName/learningOutcome` is open question Q4 —
keeping them as a synced primary-language projection would cut the Phase-3 frontend
diff by ~70% (every consumer reads `item.moduleName` today) at the cost of controlled
denormalization inside one row (harmless: single-writer via `saveRupEntryGroup`).
**Recommended: keep them as projections in Phase 2-3, decide removal in Phase 4.**

### Phase 0 — boundary hardening (shippable now, valuable even if P5 stops here)

- Delete dead code: `createMultiLanguage` (mutation), store's `addRupEntries`,
  `addRupEntryMultiLanguage`, `createEmptyRupEntry`, `updateRupEntry`; then delete the
  now-orphaned `update` and `updateWithDistributions` mutations (verify `_generated`
  regen + typecheck).
- Restrict `addDistribution`/`updateDistribution`/`removeDistribution` (their only live
  callers are `addRupEntry`/`duplicateRupEntry` store paths) or fold duplication into a
  server-side `duplicateEntry` mutation so no client path can write one variant's
  hours/distributions independently.
- Result: `saveRupEntryGroup` becomes the **only** way shared fields are written →
  the divergence bug class is closed at the boundary regardless of the schema.

### Phase 1 — expand (schema widen + dual-write; no reads change)

1. Schema: add `variants: v.optional(v.array(v.object({...})))` to `rupEntries`
   (`convex/schema/rup.ts`). Nothing else changes. Deploy is safe (optional field).
2. `saveRupEntryGroup`: after upserting rows, also write the **full variants array onto
   every row of the group** (each row knows all its siblings). Old readers ignore it;
   the backfill can later trust it as a cross-check but does not depend on it.
3. Ship. Zero behavior change; rollback = revert commit.

### Phase 2 — backfill (the collapse), prod-run only

**Deliberate deviation from the `@convex-dev/migrations` precedent:** `migrations.define`
is built for per-row patching of one table. This migration deletes rows and repoints
five other tables — doing that inside a paginated `migrateOne` over the same table it
deletes from is fragile. At 42+63+141+78+83 rows the whole collapse fits comfortably in
**one Convex transaction**, which buys atomicity for free: any anomaly → throw → no-op.
So: a plain `internalMutation`, kept in `convex/migrations/` with the same runbook-header
convention.

```ts
// convex/migrations/rupVariantsCollapse.ts (sketch)
export const collapseAll = internalMutation({
  args: { dryRun: v.optional(v.boolean()), force: v.optional(v.literal("newest")) },
  handler: async (ctx, { dryRun, force }) => {
    const all = await ctx.db.query("rupEntries").collect();
    const groups = groupBy(all, r => r.groupId ?? `__solo__${r._id}`);
    const remap = new Map<string, string>();      // deadId -> survivorId
    const log: unknown[] = [];

    for (const rows of groups.values()) {
      // 0. audit inline; on divergence: throw unless force === "newest"
      const winner = pickWinner(rows, force);      // §3.2 rule; throws DIVERGED_GROUP
      const survivor = await pickSurvivor(ctx, rows); // §2 rule 1→2→3
      // 1. build variants[] from ALL rows' text fields
      const variants = rows.map(r => ({
        language: r.language || "ru",
        moduleIndex: r.moduleIndex, moduleName: r.moduleName,
        learningOutcome: r.learningOutcome,
      }));
      // 2. patch survivor: variants + winner's shared fields
      //    (+ keep top-level text fields = primary-language projection, Q4)
      if (!dryRun) await ctx.db.patch(survivor._id, { variants, ...winnerShared(winner) });
      // 3. if winner !== survivor: replace survivor's distributions with winner's set
      // 4. for each non-survivor: record remap, delete its distributionEntries, delete row
      for (const r of rows) if (r._id !== survivor._id) {
        remap.set(r._id, survivor._id);
        if (!dryRun) { /* delete r's distributions; ctx.db.delete(r._id) */ }
      }
      log.push({ groupId: rows[0].groupId, survivor: survivor._id,
                 dropped: rows.filter(r => r._id !== survivor._id).map(r => r._id) });
    }

    // 5. repoint (indexes: by_rupEntryId on events/ktps/scheduled*; journals scan)
    let repointed = { calendarEvents: 0, ktps: 0, journals: 0, sic: 0, sfc: 0, workloads: 0 };
    for (const [dead, alive] of remap) {
      for (const t of ["calendarEvents", "ktps",
                       "scheduledIntermediateControls", "scheduledFinalControls"] as const) {
        const refs = await ctx.db.query(t)
          .withIndex("by_rupEntryId", q => q.eq("rupEntryId", dead)).collect();
        for (const doc of refs) if (!dryRun) await ctx.db.patch(doc._id, { rupEntryId: alive });
      }
    }
    const journals = await ctx.db.query("journals").collect();
    for (const j of journals) {
      const alive = remap.get(j.disciplineId);
      if (alive && !dryRun) await ctx.db.patch(j._id, { disciplineId: alive });
    }
    const workloads = await ctx.db.query("workloads").collect();
    for (const w of workloads) {
      const items = w.items.map(it =>
        remap.has(it.subjectId) ? { ...it, subjectId: remap.get(it.subjectId)! } : it);
      if (items.some((it, i) => it !== w.items[i]) && !dryRun)
        await ctx.db.patch(w._id, { items });
    }
    // 6. post-conditions INSIDE the transaction: re-scan for any remaining dead id;
    //    throw if found (=> whole run rolls back). Return { log, repointed, remap }.
  },
});
```

Idempotent: a second run finds no multi-row groups (all `groupId`s unique or gone) and
no remap entries → no-op. `dryRun: true` returns the full log + counts without writing
(mirror of the migrations-component convention).

Also in Phase 2 (same PR, behind the still-optional schema): singleton rows get their
one-element `variants` via the same mutation (rule in §2, last paragraph).

### Phase 3 — read/write path switch (frontend + convex)

Backend:
- `saveRupEntryGroup` v2: upsert **one row** (`id` instead of `groupId` as the group
  key), `variants` written as the array, distributions written once. Keep accepting the
  old payload shape during the transition or bump the client atomically (single deploy
  ships both — Convex deploys client+server together here, so a hard switch is fine).
- `remove`/`removeGroup` merge into one `remove` (a group *is* a row now);
  «Только этот язык» in `RupEntryTable.vue:308-346` becomes "remove variant" =
  `saveRupEntryGroup` with that variant omitted.
- `reorder` unchanged (fewer rows, same mechanics). Renumber `position` per context in
  Phase 2 (collapsed rows leave gaps — harmless, sort is relative, but renumbering is
  one loop).
- Delete `getByGroupId`; `list`/`getById`/`getByAcademicYear*` unchanged shapes plus
  `variants`.

Frontend (the bulk of the work):
- `rupEntryStore`: map `variants`; keep exposing top-level text fields (projection per
  Q4) so the 25+ `getRupEntryById` consumers and both exporters need **zero changes**;
  `getGroupedVariants` reduces to `entry.variants`; `rupEntryOptions` emits one option
  per entry (fixes today's N-duplicate options in `DisciplineSelect`).
- `useLanguageVariants`: `editVariantIds` disappears; `loadFromVariants` takes
  `entry.variants` directly; `buildSaveVariants` drops per-language `id`.
- `RupEntryPopup` prefill (l.275-349) simplifies (no group assembly); submit passes
  `id` instead of `groupId`.
- `RupEntryTable` / `DisciplineCatalog`: one row per discipline, badge list of all
  variant languages.
- `DisciplineSelect` / `AddEventWizard`: per Q1 decision (language selector on the
  event vs. nothing).
- `WorkloadManagement`: `rowLangs` default becomes `entry.variants.map(v=>v.language)`.

### Phase 4 — contract (schema narrow)

- `variants` → required; drop `language`, `groupId`, index `by_groupId`; per Q4 either
  drop top-level text fields or keep them documented as a projection.
- Delete transitional code, delete the migration's force path.

Each phase is an independent PR; Phases 0/1 are riskless, Phase 2 is a prod operation,
Phase 3 is the big diff, Phase 4 is cleanup.

---

## 5. Prod runbook (modelled on `educationTechnologyBackfill.ts`)

```
─── PROD RUNBOOK (Phase 2) ───
 0. Freeze RUP editing (organizationally — tell the two admins; there is no
    feature-flag infra) and pick a low-traffic window.
 1. npx convex export --prod --path backup-pre-p5.zip
    ← THE rollback story for Phase 2. Verify the zip exists and is non-trivial.
 2. npx convex deploy            (Phase-1 schema widen must already be live)
 3. npx convex run migrations/rupVariantsCollapse:auditGroups --prod
    → expect { divergedCount: 0 }. If > 0: open each named group in the RUP UI,
      re-save (saveRupEntryGroup rewrites all variants identically), re-audit.
      Only if bulk damage: plan a `force:"newest"` run and record the diff.
 4. npx convex run migrations/rupVariantsCollapse:collapseAll '{"dryRun":true}' --prod
    → inspect: groups collapsed, survivor per group, repoint counts per table.
      Sanity: dropped-ids count == (rupEntries before) − (groups + singletons).
 5. npx convex run migrations/rupVariantsCollapse:collapseAll --prod
    (single transaction; any thrown post-condition = nothing written)
 6. Verify:
    - npx convex data rupEntries --prod --limit 100
        → every row has variants[]; no two rows share a groupId.
    - npx convex run migrations/rupVariantsCollapse:auditGroups --prod
        → { groupCount with >1 rows: 0 }.
    - npx convex run migrations/rupVariantsCollapse:findDanglingRefs --prod
        (small internalQuery: scan calendarEvents/ktps/journals/scheduled*/
         workloads.items for rupEntry ids not present in rupEntries → must be [];
         note: this also flags any PRE-EXISTING dangling refs — triage those
         separately, do not blame the migration without checking the pre-run audit)
    - Spot-check in the app: open a journal, a KTP, the calendar, a workload,
      the Form-2 report — titles and hours resolve.
 7. Ship Phase 3 (read-path). Until then the UI still renders one row per…
    — NO: after collapse the old UI renders ONE row per discipline already
    (fewer rows, language badge = survivor's language). Cosmetically degraded
    but functionally correct; keep the Phase-2→Phase-3 gap short (same day if
    possible, Phase 3 pre-merged and ready).
 8. Later, separate PR: Phase 4 narrow (`variants` required, drop
    language/groupId/by_groupId). npx convex deploy.

─── ROLLBACK ───
 Phase 1: revert the PR, deploy. (Optional field, no data written that old code reads.)
 Phase 2, before step 5: nothing to roll back (audit + dryRun are read-only).
 Phase 2, after step 5: npx convex import --prod --replace backup-pre-p5.zip
   (full-database restore — acceptable only inside the freeze window before new
   user writes; this is why step 0 matters). After the freeze window, restoring
   means losing user writes → instead write a compensating expand script from the
   returned remap/log (the mutation returns it; save the JSON output of step 5).
 Phase 3: pure code, revert the PR (works against collapsed data only if the
   store keeps the projection fields — another reason for Q4 = keep).
 Phase 4: revert PR + re-widen schema.
```

---

## 6. Test plan

**Unaffected:** `rupHours.spec.ts` (38 expects, pure math), `rupRefs.spec.ts` wording
until Phase 3.

**New — before Phase 2 (characterization, `convex-test`, new
`convex/rupEntries/__tests__/`):**
1. `saveRupEntryGroup` today: create 2-language group → 2 rows, identical shared
   fields, identical distribution sets; edit → patched; removedVariantIds blocked by
   refs. (Pins the P1 contract the migration relies on.)
2. `collapseAll` unit tests: (a) clean 2-lang group → 1 row, variants[2], siblings'
   distributions gone, survivor's kept; (b) refs on the non-survivor → repointed across
   all five tables incl. `workloads.items[].subjectId` and `_ind` rows; (c) diverged
   hours → throws, nothing written; (d) `force:"newest"` → winner's row values;
   (e) idempotency: second run is a no-op; (f) singleton without groupId → gets
   one-element `variants`; (g) survivor-selection rule incl. the "only one variant has
   refs" branch; (h) dangling pre-existing ref → reported, not fabricated.
3. `auditGroups`: divergence detection per field + distribution fingerprints.

**Phase 3:** update `useLanguageVariants` behavior (add a spec — it has none today),
`workloadHours.spec.ts` fixtures (`rup.language` → `variants`), e2e
`disciplines.spec.ts` / `catalogs.spec.ts` / `ktp.spec.ts` / `workload.spec.ts` /
`planning-journal-flow.spec.ts` for the one-row-per-discipline rendering and the Q1
language-picker decision.

---

## 7. Cost/benefit verdict

**What the migration actually buys, given P1 already landed:**
- P1 closed the divergence bug class *at the popup boundary*. Phase 0 alone (delete the
  dead legacy write paths) closes it at the API boundary too, for ~1 day of work.
- What the collapse buys beyond that: structural impossibility of divergence (no
  invariant to enforce), one option per discipline in `DisciplineSelect` (today's N
  near-duplicate options are a real UX wart), ~2× fewer rupEntries/distribution rows,
  no `getGroupedVariants` reassembly, a model that matches how every other part of the
  system already thinks (one discipline = one id).
- What it costs: the backfill (§4 Phase 2, modest: ~2-3 days incl. tests, thanks to the
  one-transaction design and tiny data), the Phase-3 frontend diff (the real cost:
  ~3-5 days across popup/table/catalog/pickers/workload page + e2e updates), and one
  genuine semantic decision (Q1) that no amount of engineering removes.
- What does NOT scale down with row count: the repointing logic and its test matrix —
  but it also never gets *easier* than now. At 42 entries / 78 journals the audit is
  eyeballable and the whole collapse fits in one atomic transaction; at 10× the data,
  Phase 2 becomes a batched, multi-transaction, freeze-window migration.

**Recommendation: do it — but as "Phase 0 now, Phases 1-4 as a scheduled 1.5-2-week
effort gated on Q1-Q4", not as an opportunistic refactor.**
- Ship **Phase 0 immediately** regardless of the rest: it is small, deletes ~500 lines
  of dead/bypass code, and delivers most of the *bug-prevention* value on its own.
- Proceed with Phases 1-4 **only after Q1 (event language) has an answer**, because it
  changes the Phase-3 UI scope. If the answer is "students define language, drop the
  per-variant pick", Phase 3 shrinks; if "events need a language field", add half a day
  plus its own tiny widen.
- If the team cannot schedule the 1.5-2 weeks this quarter, Phase 0 + Phase 1
  (dual-write `variants`) is a safe stopping point that loses nothing and keeps the
  door open — but do not let the gap grow past the point where prod data outgrows the
  one-transaction backfill (~thousands of refs).

The "don't do it, just enforce consistency" alternative is real and cheap (it is
Phase 0), but it leaves the N-row model's ongoing taxes: duplicate picker options,
`getGroupedVariants` sprinkled through the UI, per-variant distribution copies that
every future feature must remember to keep in sync, and a migration that only gets more
expensive with data growth. Since prod is small *now* and the write path is already
funneled through one mutation, this is close to the cheapest moment this migration will
ever have.

---

## 8. Open questions (answers required before Phase 2/3)

- **Q1 (blocks Phase 3 scope).** After collapse, how should the teaching language of a
  calendar event / lesson group be expressed? Today it is implied by which variant row
  the user picks in `DisciplineSelect` (`calendarEvents` has no language column;
  journals derive language from students, `journalStore.ts:37-46`; workload items and
  KTPs carry their own language fields). Options: (a) rely on student composition and
  drop the pick; (b) add `calendarEvents.language` + a selector in the event wizard;
  (c) something else the college's process requires?
- **Q2 (blocks Phase 2 run).** Merge policy for diverged hour fields: is
  "audit → abort → operator fixes each group manually via the existing popup → re-run"
  acceptable operationally (recommended, §3.2), or do you want the automated
  `force:"newest"` (row-level newest-`updatedAt` wins) as the default?
- **Q3 — ✅ RESOLVED (2026-08).** Survivor rule: "most-referenced wins → else the
  language configured as default in Settings → else oldest `_creationTime`". The
  middle step reads `studyLanguages` where `isDefault === true` (see §2.3) rather
  than hardcoding `"ru"` — commit `47e430b` turned study languages into a real
  persisted setting with a default flag. Still open only if you want a different
  **tiebreak** than "most-referenced".
- **Q4 (shapes Phases 2-4).** Keep top-level `moduleIndex`/`moduleName`/
  `learningOutcome` as a synced primary-language projection (recommended — cuts the
  frontend diff by ~70% and keeps Phase-3 revertability), or purge them and route all
  display through a locale-aware resolver?
- **Q5 (minor UX confirm).** Post-collapse the RUP table and Discipline catalog show
  ONE row per discipline (with a badge list of its languages), and «Только этот язык»
  delete becomes "remove this language variant" inside the edit popup. Confirm this is
  the intended UX, since between Phase 2 and Phase 3 the old UI will briefly show one
  row with only the survivor's language badge.
