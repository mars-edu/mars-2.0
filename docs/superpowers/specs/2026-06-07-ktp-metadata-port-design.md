# KTP Metadata Port + Divergence Fixes — Design

**Date:** 2026-06-07
**Scope:** Port concept-v2 KTP plan-metadata UX (color, languages, fully-loaded badge) into mars-2.0, and fix the local/backend divergence bugs in the KTP layer.
**Out of scope:** blocking hour validation (stays advisory), auth on convex/ktps, reactive store rewrite, grade-exists delete guard.

## Background

concept-v2 (`/home/olge/SOFT/git/MARS/concept-v2`) KTP plans carry `color`, `languages[]`, and a "fully loaded" paperclip badge (all topics titled AND added hours ≥ planned hours). mars-2.0's `ktps` table has none of these, and its KTP layer has several places where client state diverges from Convex:

1. `ktpStore.reorderKtpDetails` reorders **locally only** — never persisted; reload reverts order.
2. `ktpStore.deleteKtpByRupEntryId` deletes **locally only** — backend rows resurrect on reload.
3. `ktpStore.deleteKtpDetail` renumbers positions across **all** ktps locally; backend positions never renumbered.
4. `bulkImportDetails` mutation **appends**; the store pretends replace semantics → duplicate server rows on re-import.
5. Numeric coercion `x ? Number(x) : null` turns an entered `0` into `null` (FormPopover + store).
6. `KtpDetailPopupBody` hour counter shows the same sum twice ("из КТП" and "на семестр" are identical), and `remainingHoursForForm` double-counts the edited row's hours.

"Planned hours" budget source (decided): **RUP `distributionEntries`** matched by `academicYearId` + semester. `distributionEntries.hours` is a string (`convex/schema.ts:375`); semester is linked by `v.id('academicYearSemesters')` while ktps store semester numbers — matching must resolve both representations.

## 1. Schema (`convex/schema.ts`)

Add to `ktps` table:

```ts
color: v.optional(v.string()),               // hex, e.g. '#FACC15'
languages: v.optional(v.array(v.string())),  // subset of ['KZ','RU','EN']
```

Optional fields → no migration; existing docs remain valid. Add the same two fields to `create` and `update` mutation args.

## 2. Backend (`convex/ktps/mutations.ts`)

### New mutation `reorderDetails`

```ts
args: { ktpId: v.id("ktps"), orderedIds: v.array(v.id("ktpDetails")) }
```

- Fetch details `by_ktpId`.
- Throw unless `orderedIds` is an exact permutation of the existing detail ids (same length, same set).
- Patch each row `position: index + 1` + `updateTimestamp()`.
- Convex mutation = transaction → atomic. Server positions become contiguous from first use.

### `bulkImportDetails`: add `replace: v.optional(v.boolean())`

When `true`, delete all existing `by_ktpId` rows before inserting. Store passes `true` — import becomes replace, matching both the store's existing local behavior and concept-v2 semantics.

## 3. Store (`src/stores/ktpStore.ts`)

- `reorderKtpDetails`: keep optimistic local rewrite; add `await convex.mutation(api.ktps.mutations.reorderDetails, { ktpId, orderedIds })`; on throw → `fetchDetailsForKtp(ktpId)` to revert.
- `deleteKtpByRupEntryId`: call `convex.mutation(api.ktps.mutations.remove, { id })` (cascades details server-side) before the local filter.
- `deleteKtpDetail`: scope local renumbering to the affected ktp's details only.
- New action `updateKtp(id, { color?, languages?, name? })` → existing (currently unused) `update` mutation + local merge into `ktps`.
- New getter `getPlannedHoursForKtp(ktpId): number | null`:
  - ktp → `rupEntryStore.getRupEntryById(ktp.rupEntryId)` → `distributionEntries.find(d => d.academicYearId === ktp.academicYearId && semesterMatches(d.semesterId, ktp.semesterId))` → parse `d.hours`: `const n = Number(d.hours); return Number.isFinite(n) && n > 0 ? n : null` (zero/garbage budget = "no budget known", prevents the fully-loaded badge from being trivially true via `sum >= 0`).
  - `semesterMatches(aysId, ktpSemesterId)`: true when ids equal, OR when `academicYearSemesterStore` resolves `aysId` to a `semesterNumber` whose string equals `ktpSemesterId` (handles the id-vs-number storage inconsistency).
  - Returns `null` when ktp/rupEntry/entry unresolvable. Callers treat `null` as "no budget known": badge skipped, hours warning skipped.
- New helper `toNullableNumber(v) = (v === '' || v == null) ? null : Number(v)` — replaces every `x ? Number(x) : null` coercion site in the store and in `KtpDetailFormPopover.vue`. Entering `0` now stores `0`.
- `Ktp` interface + `loadFromBackend`/`createKtp` hydration mappings gain `color`/`languages`.

## 4. UI

### `AddKtpItemForm.vue`

- Color swatch row: 8 colors (concept-v2 EditKtpModal palette) `['#FACC15','#60A5FA','#F87171','#4ADE80','#A78BFA','#FB923C','#2DD4BF','#F472B6']`, default first.
- KZ/RU/EN pill toggles (reuse existing language pill styling).
- Both optional — `isFormValid` unchanged. Values passed through `ensureKtpForRupEntry` → `createKtp`.

### `KtpPage.vue` cards

- Icon block tinted with `ktp.color`: background `color + '20'`, icon `color` (concept-v2 pattern); fallback to current primary styling when no color.
- Language badges next to the card title.
- New ⋮ action menu per card (`@click.stop`, f7 popover):
  - **Редактировать** → new `KtpEditPopover.vue` (color + languages only; save → `ktpStore.updateKtp`).
  - **Удалить** → `f7.dialog.confirm` → `ktpStore.deleteKtpById` + toast.
- Paperclip badge (top-right, concept-v2 style) when `isKtpFullyLoaded(ktp)`: details exist AND every `theme` non-empty (trimmed) AND `sum(totalHours) >= getPlannedHoursForKtp(ktpId)`. Skipped when planned hours is `null`.

### `KtpDetailPopupBody.vue`

- «Запланировано на семестр» = `getPlannedHoursForKtp` (real budget) instead of the duplicated detail sum.
- `remainingHoursForForm = plannedHours − sum(other rows' totalHours)`. When planned hours is `null` → pass `undefined` → FormPopover skips the warning. Removes the double-count.

### `KtpDetailFormPopover.vue`

- Replace falsy-number coercions with `toNullableNumber`.

### New `KtpEditPopover.vue`

Small GuardedPopover: color swatches + language toggles, Save/Cancel. Props: `opened`, `ktp`. Emits `update:opened`. Save → `updateKtp` → red toast on failure (popover stays open), close on success.

## 5. Data flow

Unchanged: ensure-on-event-create, positional journal column↔topic mapping, journal paperclips.
New fields flow: `AddKtpItemForm / KtpEditPopover → ktpStore → create/update mutation → ktps doc → loadFromBackend hydration → KtpPage cards`.

## 6. Error handling

- `reorderDetails` throw → existing red toast path + `fetchDetailsForKtp` revert.
- `updateKtp` failure → red toast, edit popover stays open.
- `getPlannedHoursForKtp` never throws — returns `null` on any unresolvable link.

## 7. Testing

- **e2e** (`tests/e2e/ktp.spec.ts`): create KTP with color + languages; card ⋮ menu edit changes color; delete via menu removes card.
- **Unit (vitest)**:
  - `toNullableNumber`: `'' → null`, `'0' → 0`, `0 → 0`, `null → null`, `'5' → 5`.
  - `getPlannedHoursForKtp`: id-match, number-match, unresolvable → null, string-hours parsing.
  - `reorderDetails` mutation: permutation validation (rejects wrong length / foreign ids), positions written 1..n (follow existing `convex/**/__tests__` harness pattern).
  - `bulkImportDetails` with `replace: true` clears prior rows.

## Files touched

`convex/schema.ts`, `convex/ktps/mutations.ts`, `src/stores/ktpStore.ts`, `src/components/AddKtpItemForm.vue`, `src/pages/KtpPage.vue`, `src/components/KtpDetailPopupBody.vue`, `src/components/KtpDetailFormPopover.vue`, + new `src/components/KtpEditPopover.vue`.
