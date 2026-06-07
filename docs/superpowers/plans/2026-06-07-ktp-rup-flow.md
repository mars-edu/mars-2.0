# KTP RUP-Style Creation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** KTP creation form follows the RUP page flow: study year (default active) → specialty → discipline (language variants visible) → pick a «Распределение по курсам и семестрам» row that supplies the KTP's year+semester.

**Architecture:** Pure form rework in `AddKtpItemForm.vue` — year/semester selects replaced by a distribution-row radio list; languages derived from the chosen variant via a new pure helper. No store/schema changes (`distributionEntry.academicYearId/semesterId` already match `ktps` field types).

**Tech Stack:** Vue 3 + Framework7, Pinia, Jest, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-07-ktp-rup-flow-design.md`

---

### Task 1: deriveKtpLanguages helper (TDD)

**Files:**
- Modify: `src/lib/ktpHelpers.ts` (append)
- Test: `src/lib/__tests__/ktpHelpers.spec.ts` (append)

- [ ] **Step 1: Write the failing tests**

Append to `src/lib/__tests__/ktpHelpers.spec.ts` (add `deriveKtpLanguages` to the existing import from `"../ktpHelpers"`):

```ts
describe("deriveKtpLanguages", () => {
  it("maps ru to RU", () => expect(deriveKtpLanguages("ru")).toEqual(["RU"]));
  it("maps kk to KZ (KTP badge convention)", () =>
    expect(deriveKtpLanguages("kk")).toEqual(["KZ"]));
  it("is case-insensitive", () => expect(deriveKtpLanguages("EN")).toEqual(["EN"]));
  it("returns undefined for empty/null/unknown", () => {
    expect(deriveKtpLanguages("")).toBeUndefined();
    expect(deriveKtpLanguages(null)).toBeUndefined();
    expect(deriveKtpLanguages(undefined)).toBeUndefined();
    expect(deriveKtpLanguages("xx")).toBeUndefined();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/lib/__tests__/ktpHelpers.spec.ts`
Expected: FAIL — `deriveKtpLanguages is not a function` (or TS import error).

- [ ] **Step 3: Implement**

Append to `src/lib/ktpHelpers.ts`:

```ts
/**
 * Map a rupEntry language code ('ru' | 'kk' | 'en') to the KTP badge
 * convention used by ktp.languages (see KTP_LANGUAGES). kk → KZ.
 */
export function deriveKtpLanguages(
  code?: string | null
): string[] | undefined {
  const map: Record<string, string> = { ru: "RU", kk: "KZ", en: "EN" };
  const mapped = code ? map[code.toLowerCase()] : undefined;
  return mapped ? [mapped] : undefined;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/lib/__tests__/ktpHelpers.spec.ts`
Expected: PASS (23 tests: 19 existing + 4 new).

- [ ] **Step 5: Commit**

```bash
git add src/lib/ktpHelpers.ts src/lib/__tests__/ktpHelpers.spec.ts
git commit -m "feat(ktp): add deriveKtpLanguages helper mapping rup language codes"
```

---

### Task 2: AddKtpItemForm rework

**Files:**
- Modify: `src/components/AddKtpItemForm.vue` (370 lines — read fully first; line refs below match the current file)

#### Script changes

- [ ] **Step 1: Replace state block** (lines 205-214)

```ts
const formError = ref("");

const rupEntryId = ref("");
const selectedColor = ref(KTP_COLORS[0]);

// RUP-style cascade: study year → specialty → discipline → distribution row
const selectedSpecialtyId = ref("");
const selectedYearId = ref("");
const selectedDistributionId = ref("");
```

(`selectedLanguages`, `innerAcademicYearId`, `innerSemesterId` removed.)

- [ ] **Step 2: Update imports** (line 185)

```ts
import { KTP_COLORS, deriveKtpLanguages } from "@/lib/ktpHelpers";
```

(`KTP_LANGUAGES` no longer imported here.) Add `getActiveAcademicYear` to the academicYearStore destructure (line 203):

```ts
const { academicYears, getActiveAcademicYear } = storeToRefs(academicYearStore);
```

Keep `useAcademicYearSemesterStore` import — semester labels need it.

- [ ] **Step 3: Year default + options.** Replace `innerSemesterOptions` computed and both watchers (lines 225-258) with:

```ts
// Default year: page filter if set, else the active academic year (rup.vue pattern)
const defaultYearId = () =>
  props.selectedAcademicYearId || getActiveAcademicYear.value?.id || "";

watch(
  () => props.opened,
  (opened) => {
    if (!opened) return;
    selectedYearId.value = defaultYearId();
  },
  { immediate: true }
);

// Year/specialty change invalidates discipline + row
watch([selectedYearId, selectedSpecialtyId], () => {
  rupEntryId.value = "";
  selectedDistributionId.value = "";
});
```

(`academicYearOptions` computed stays as-is, line 221-223.)

- [ ] **Step 4: Delete `toggleLanguage`** (lines 260-266).

- [ ] **Step 5: Discipline filter + variant labels.** Replace `filteredRupEntryOptions` (lines 268-287):

```ts
// Disciplines of the selected RUP year (+specialty). Language variants are
// separate rupEntries — each shows with an [RU]/[KK]/[EN] suffix.
const filteredRupEntryOptions = computed(() => {
  const yearId = selectedYearId.value;
  const specialtyId = selectedSpecialtyId.value;

  return rupEntryOptions.value
    .filter((option) => {
      const rupEntryItem = rupEntryStore.getRupEntryById(option.value);
      if (!rupEntryItem) return false;
      if (specialtyId && !rupEntryItem.specialtyIds.includes(specialtyId)) {
        return false;
      }
      return !yearId || rupEntryItem.academicYearId === yearId;
    })
    .map((option) => {
      const lang = rupEntryStore.getRupEntryById(option.value)?.language;
      return lang
        ? { ...option, text: `${option.text} [${lang.toUpperCase()}]` }
        : option;
    });
});
```

(Keep the existing stale-selection watcher on `filteredRupEntryOptions`, lines 289-297, unchanged — it now also triggers the row reset via Step 7's watcher.)

- [ ] **Step 6: Distribution rows computed + labels.** Add after `selectedEntry` (line 303):

```ts
interface DistributionRowOption {
  id: string;
  academicYearId: string;
  semesterId: string;
  label: string;
}

// «Распределение по курсам и семестрам» rows of the selected discipline.
// Each row's academicYearId+semesterId directly key the KTP.
const distributionRows = computed<DistributionRowOption[]>(() => {
  const entry = selectedEntry.value;
  if (!entry) return [];
  return entry.distributionEntries.map((d) => {
    const year = academicYearStore.getAcademicYearById(d.academicYearId);
    const yearLabel = year ? `${year.startYear}-${year.endYear}` : "—";
    const ays = academicYearSemesterStore.getAcademicYearSemesterById(
      d.semesterId
    );
    const semLabel = ays ? `Семестр ${ays.semesterNumber}` : "—";
    const hours = d.hours ? `${d.hours} ч.` : "— ч.";
    return {
      id: d.id,
      academicYearId: d.academicYearId,
      semesterId: d.semesterId,
      label: `${yearLabel} · ${semLabel} · ${hours}`,
    };
  });
});

const selectedDistributionRow = computed(
  () =>
    distributionRows.value.find((r) => r.id === selectedDistributionId.value) ??
    null
);
```

- [ ] **Step 7: Auto-select watcher.** Add after the computeds:

```ts
// Auto-select: single row, or the row matching the page filters
watch(
  () => [rupEntryId.value, distributionRows.value] as const,
  () => {
    const rows = distributionRows.value;
    if (
      selectedDistributionId.value &&
      rows.some((r) => r.id === selectedDistributionId.value)
    ) {
      return; // current selection still valid
    }
    if (rows.length === 1) {
      selectedDistributionId.value = rows[0].id;
      return;
    }
    const fromFilters = rows.find(
      (r) =>
        props.selectedAcademicYearId &&
        props.selectedSemesterId &&
        r.academicYearId === props.selectedAcademicYearId &&
        r.semesterId === props.selectedSemesterId
    );
    selectedDistributionId.value = fromFilters ? fromFilters.id : "";
  }
);
```

- [ ] **Step 8: Validation + reset + save.** Replace `isFormValid` (lines 305-311), `resetForm` (313-319), and the `ensureKtpForRupEntry` call inside `handleSave` (341-353):

```ts
const isFormValid = computed(() => {
  return !!rupEntryId.value && !!selectedDistributionRow.value;
});

const resetForm = () => {
  rupEntryId.value = "";
  formError.value = "";
  selectedColor.value = KTP_COLORS[0];
  selectedSpecialtyId.value = "";
  selectedDistributionId.value = "";
  selectedYearId.value = defaultYearId();
};
```

In `handleSave`, after the `selectedItem` guard:

```ts
    const row = selectedDistributionRow.value;
    if (!row) {
      formError.value = "Выберите строку распределения.";
      return;
    }

    const ktp = await ktpStore.ensureKtpForRupEntry(
      rupEntryId.value,
      row.academicYearId,
      row.semesterId,
      undefined,
      undefined,
      {
        color: selectedColor.value,
        languages: deriveKtpLanguages(selectedItem.language),
      }
    );
```

#### Template changes

- [ ] **Step 9: Year select replaces the year+semester grid** (lines 43-69). New block ABOVE the Specialty block (cascade order: год → специальность → дисциплина):

```html
        <!-- Study year -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Учебный год
          </label>
          <Select
            placeholder="Учебный год"
            v-model="selectedYearId"
            :options="academicYearOptions"
            name="ktp-item-academic-year"
            id="ktp-item-academic-year"
          />
        </div>
```

(Specialty block stays as-is, now second. The two-column «Учебный год + Семестр» grid is deleted.)

- [ ] **Step 10: Selected-entry preview language badge.** In the preview (lines 98-113), after the module-name `<span>`:

```html
            <span
              v-if="selectedEntry.language"
              class="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0"
            >
              {{ selectedEntry.language.toUpperCase() }}
            </span>
```

- [ ] **Step 11: Distribution rows block.** Insert between the selected-entry preview and the Color block:

```html
        <!-- Распределение по курсам и семестрам -->
        <div v-if="selectedEntry">
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Распределение по курсам и семестрам
          </label>
          <div v-if="distributionRows.length" class="flex flex-col gap-2">
            <button
              v-for="row in distributionRows"
              :key="row.id"
              type="button"
              data-testid="ktp-dist-row"
              class="w-full flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all"
              :class="selectedDistributionId === row.id
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50'"
              @click="selectedDistributionId = row.id"
            >
              <span
                class="w-3 h-3 rounded-full flex-shrink-0 border"
                :class="selectedDistributionId === row.id
                  ? 'bg-primary border-primary'
                  : 'border-muted-foreground/40'"
              />
              {{ row.label }}
            </button>
          </div>
          <div
            v-else
            class="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 text-amber-600 text-sm"
          >
            <IconAlertCircle class="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>Нет распределения по семестрам — заполните РУП для этой дисциплины.</div>
          </div>
        </div>
```

- [ ] **Step 12: Delete the Languages pill block** (lines 134-154). Update info-hint text (line 92-95) to: `Тематический план будет привязан к выбранной дисциплине и строке распределения.`

- [ ] **Step 13: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i AddKtpItemForm` → empty.
Run: `npm test -- src/lib/__tests__/ktpHelpers.spec.ts` → 23 passed.
Run: `grep -n "KTP_LANGUAGES\|toggleLanguage\|innerAcademicYearId\|innerSemesterId\|selectedLanguages" src/components/AddKtpItemForm.vue` → empty.

- [ ] **Step 14: Commit**

```bash
git add src/components/AddKtpItemForm.vue
git commit -m "feat(ktp): RUP-style creation flow with distribution row picker"
```

---

### Task 3: e2e update

**Files:**
- Modify: `tests/e2e/ktp.spec.ts`

- [ ] **Step 1: Rework the metadata-fields test.** Find the test `"create popover shows color swatches and language toggles"` and replace it with (keep the file's login-guard idiom):

```ts
  test("create popover shows RUP-flow selects and color swatches", async ({ page }) => {
    const url = page.url();
    if (url.includes("login")) return;

    await page.waitForTimeout(2000);

    await page.locator("button", { hasText: "Создать" }).first().click();
    await page.waitForTimeout(500);
    const popover = page.locator("#add-ktp-item-popover");
    await expect(popover).toBeVisible();

    // Cascade selects: study year, specialty, discipline
    await expect(popover.locator('[name="ktp-item-academic-year"]')).toBeAttached();
    await expect(popover.locator('[name="ktp-item-specialty"]')).toBeAttached();
    await expect(popover.locator('[name="ktp-item-rupEntry"]')).toBeAttached();

    // Color swatches present, language pills gone
    await expect(popover.getByTestId("ktp-color-FACC15")).toBeVisible();
    await expect(popover.locator('[data-testid^="ktp-lang-"]')).toHaveCount(0);
  });
```

NOTE: check how existing tests in this file assert the inner Select control (the project Select renders a trigger button — if `[name=...]` isn't attached to a visible element, match the existing test idiom for Selects in this file, e.g. `.locator('[name="semester"]')` usage at line ~46).

- [ ] **Step 2: Verify**

Run: `npx playwright test tests/e2e/ktp.spec.ts --list` → parses, same total count (one test replaced).

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/ktp.spec.ts
git commit -m "test(ktp): e2e for RUP-flow create form"
```

---

## Verification checklist (after all tasks)

- `npm test` — 23 helper tests + suites unchanged (4 pre-existing failures only).
- `npx tsc --noEmit` — no ktp-related errors.
- Manual: open Создать → год pre-set to active year → специальность filters disciplines → discipline list shows `[RU]/[KK]/[EN]` variants → pick discipline → distribution rows appear (single auto-selected) → Создать enabled only with row → created card shows derived language badge; discipline without distribution rows shows amber hint, Создать disabled.
