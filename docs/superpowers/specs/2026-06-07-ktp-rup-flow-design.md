# KTP Creation — RUP-Style Flow — Design

**Date:** 2026-06-07
**Scope:** Rework `AddKtpItemForm.vue` to the RUP page's selection flow: study year (default active) → specialty → discipline (with language variants) → pick a row from the discipline's «Распределение по курсам и семестрам». The chosen distribution row supplies the KTP's `academicYearId` + `semesterId`.
**Out of scope:** RUP page changes, ktps schema/store changes, KtpEditPopover, page-level filters on KtpPage, fixing `RupImportDialog.vue:87` dead `rup.courseId` reference.

## Background

Current form: specialty → year select → semester select → discipline. Problems: year/semester are picked manually and may not match any РУП hour distribution (budget unknown → no fully-loaded badge, no hour warnings); language pills are manual although disciplines already exist as per-language RUP entries.

RUP facts (verified):
- `rupEntry.academicYearId` = the RUP study year; `rup.vue` defaults to `academicYearStore.getActiveAcademicYear` (`rup.vue:338-342`).
- Language variants are separate `rupEntry` rows sharing `groupId`, `language` ∈ `'ru' | 'kk' | 'en'`; RupEntryTable shows an uppercase badge (`RupEntryTable.vue:33-43`).
- «Распределение по курсам и семестрам» rows (`distributionEntries`) carry `academicYearId` (string) + `semesterId` (`Id<"academicYearSemesters">`) + `hours` — **identical types** to `ktps.academicYearId`/`ktps.semesterId`, directly passable to `ensureKtpForRupEntry`.
- Distribution row user-facing label: year as `{startYear}-{endYear}` + `Семестр {semesterNumber}` (`RupEntryPopup.vue:352-388`).

Decisions made:
- Language pills dropped; `ktp.languages` auto-derived from the chosen variant's `rupEntry.language`.
- Discipline without distribution rows: block save with amber hint (forces РУП data correctness; budget always known for created KTPs).

## 1. Form cascade (`src/components/AddKtpItemForm.vue`)

Order top-to-bottom:

1. **Учебный год** — options from `academicYears` (`{value: id, text: name}`, e.g. «2025-2026»). Default: page filter year (`props.selectedAcademicYearId`) if set, else `getActiveAcademicYear.id`. Change clears discipline + distribution row (specialty list is global — not reset).
2. **Специальность** — existing select with «Все специальности» (value `""`) default. Change clears discipline + row.
3. **Дисциплина** — options = `rupEntries` where `academicYearId === selectedYear` AND (specialty selected ? `specialtyIds.includes(specialty)` : true) AND non-empty `learningOutcome` (reuse `rupEntryOptions` source). Option text: `{moduleIndex} {moduleName} — {learningOutcome}` + ` [{LANG}]` suffix when `language` non-empty (`language.toUpperCase()`). Variants appear as separate options (they are separate rupEntries). Selected-entry preview card shows the same language badge.
4. **Распределение по курсам и семестрам** — new block, rendered when a discipline is selected:
   - Radio-card list from `selectedEntry.distributionEntries`. Each card: `data-testid="ktp-dist-row"`, label `{startYear}-{endYear} · Семестр {semesterNumber} · {hours} ч.`; unresolvable year/semester parts render «—». Selected card: primary ring/border.
   - Auto-select: single row → selected immediately; multiple rows → pre-select the row matching `props.selectedAcademicYearId` + `props.selectedSemesterId` when both match a row; else none.
   - Empty list → amber hint block: «Нет распределения по семестрам — заполните РУП для этой дисциплины», save stays disabled.
5. **Цвет** — unchanged color swatches.
6. **Языки обучения pills — removed** (template + `selectedLanguages` state + `toggleLanguage`).

Removed: the Учебный год/Семестр selects used for KTP keying (`innerAcademicYearId`/`innerSemesterId` and their options/watchers).

## 2. Save path

```ts
const row = selectedDistributionRow; // from the radio list
const ktp = await ktpStore.ensureKtpForRupEntry(
  rupEntryId,
  row.academicYearId,
  row.semesterId,
  undefined,
  undefined,
  { color: selectedColor, languages: deriveKtpLanguages(selectedEntry.language) }
);
```

New helper in `src/lib/ktpHelpers.ts`:

```ts
/** Map a rupEntry language code to the KTP badge convention. */
export function deriveKtpLanguages(code?: string | null): string[] | undefined {
  const map: Record<string, string> = { ru: "RU", kk: "KZ", en: "EN" };
  const mapped = code ? map[code.toLowerCase()] : undefined;
  return mapped ? [mapped] : undefined;
}
```

(`kk → KZ` matches the existing `KTP_LANGUAGES = ["KZ","RU","EN"]` badge convention.)

`isFormValid = !!rupEntryId && !!selectedDistributionId`. Idempotent `ensureKtpForRupEntry` semantics unchanged (existing KTP for same rupEntry+year+semester is returned; `extra` ignored for existing).

## 3. Resets and watchers

- Year change → `rupEntryId = ""`, `selectedDistributionId = ""`.
- Specialty change → same.
- Discipline change → `selectedDistributionId = ""` then run auto-select logic.
- `resetForm` clears all of the above + color.
- Popover open: sync default year from props (existing `watch(props.opened)` pattern, now only for the year).
- Props `selectedAcademicYearId`/`selectedSemesterId` retained (used for year default + row pre-select). `KtpPage.openAddDialog` unchanged.

## 4. Side effects

- `KTP_LANGUAGES` stays in `ktpHelpers.ts` (KtpEditPopover still uses it).
- e2e: `ktp-lang-*` testids disappear from the create form → replace that test section with: discipline/year selects visible, color swatches visible, `ktp-dist-row` block appears after selecting a discipline (guarded — data may be absent in CI), lang pills absent.
- `useKtpPlannedHours` untouched — every KTP created via this flow now has a guaranteed matching distribution row, so the budget lookup always resolves.

## 5. Testing

- **Unit (`src/lib/__tests__/ktpHelpers.spec.ts`):** `deriveKtpLanguages`: `'ru'→["RU"]`, `'kk'→["KZ"]`, `'EN'→["EN"]` (case-insensitive), `''/null/undefined/'xx'→undefined`.
- **e2e (`tests/e2e/ktp.spec.ts`):** create popover shows Учебный год + Специальность + Дисциплина selects and color swatches; no `ktp-lang-*` elements.
- **Manual:** variant pick → card badge matches variant language; single-row auto-select; multi-row pre-select from page filters; empty-distribution discipline blocks save with hint.

## Files touched

- Modify: `src/components/AddKtpItemForm.vue`, `src/lib/ktpHelpers.ts`, `src/lib/__tests__/ktpHelpers.spec.ts`, `tests/e2e/ktp.spec.ts`
