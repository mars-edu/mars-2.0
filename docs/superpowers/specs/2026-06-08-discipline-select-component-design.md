# DisciplineSelect Shared Component — Design

**Date:** 2026-06-08
**Scope:** Extract the KTP discipline picker (rich rupEntry `<Select>` with language badge + specialty chips, year filter) into a reusable `DisciplineSelect.vue`, and adopt it at every discipline/rupEntry dropdown: AddKtpItemForm, EventForm, AddEventWizard, CalendarToolbar.
**Out of scope:** store/schema changes; the commented-out dead selector in `journals.vue`; non-discipline selects.

## Background

Four active discipline dropdowns exist; only AddKtpItemForm renders rich options (language badge + emerald specialty chips) and filters by academic year. The others (`EventForm`, `AddEventWizard`, `CalendarToolbar`) use raw `rupEntryOptions` with plain text. `rupEntryStore.rupEntryOptions` carries `{value, text, moduleIndex, moduleName, learningOutcome}` but NOT `language`/`specialtyIds` — AddKtpItemForm re-joins the store per option (`getRupEntryById` + `specialtyStore`) to enrich. `ui/Select` already has an `#option` slot and `SelectOption` allows extra fields. Decision: rich rendering everywhere, one component owns the enrichment.

CalendarToolbar binds the select to a local `searchValue` (a rupEntryId) and, in its own `watch`, resolves the option text to `emit("search", text)`. After the swap it keeps that watch but resolves the text via the store getter — so DisciplineSelect needs no emit-text mode; it stays a pure v-model component.

## 1. `DisciplineSelect.vue` (new: `src/components/DisciplineSelect.vue`)

Wraps `ui/Select`, self-contained (pulls its own stores; no `options` prop).

**Props:**
```ts
interface Props {
  modelValue: string | null;      // rupEntryId (v-model)
  yearId?: string;                // filter to one academicYearId; omit = all years
  searchable?: boolean;           // default true
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  name?: string;
  id?: string;
  disabled?: boolean;
}
```

**Emits:** `(e: "update:modelValue", value: string | null)`.

**Internal:**
- `useRupEntryStore()` + `useSpecialtyStore()`; `const { rupEntryOptions } = storeToRefs(rupEntryStore)`.
- `options` computed: start from `rupEntryOptions`; if `props.yearId`, keep only options whose `getRupEntryById(o.value)?.academicYearId === props.yearId`; map each to spread the base option + `language` (from rupEntry) + `specialtyChips: Specialty[]` (resolve `rupEntry.specialtyIds` through `specialtyStore.specialties`).
- Renders `<Select v-model bind :options="options" :searchable :placeholder :search-placeholder :label :name :id :disabled>` with the `#option` slot (markup moved verbatim from AddKtpItemForm: module name + language badge + specialty chips).
- v-model passthrough: `:model-value="modelValue"` + `@update:model-value="emit('update:modelValue', $event)"`.
- Auto-clear: `watch(options, (opts) => { if (modelValue && !opts.some(o => o.value === modelValue)) emit('update:modelValue', null) })` — drops a selection that fell out after `yearId` change (matches AddKtpItemForm's current behavior).

No `any`: type via `Specialty` (specialtyStore) and rupEntry getter return.

## 2. Call-site swaps

### AddKtpItemForm.vue
Replace the `<Select>`+`#option`+`enrichedDiscOptions` block with:
```html
<DisciplineSelect
  v-model="rupEntryId"
  :year-id="selectedYearId"
  name="ktp-item-rupEntry"
  id="ktp-item-rupEntry"
  placeholder="Выберите из списка..."
  search-placeholder="Поиск по дисциплине..."
/>
```
Remove: `enrichedDiscOptions` computed, `useSpecialtyStore`/`specialtyStore` (if unused elsewhere — the preview card's `specialtyChips` uses it; KEEP specialtyStore if still referenced), the `#option` markup, now-unused `Select`/`rupEntryOptions` imports IF unused after. Keep: `rupEntryId`, `selectedYearId`, `selectedEntry`, `distributionRows`, preview card. (The preview `specialtyChips` computed still needs `specialtyStore` + `rupEntryOptions`? It reads `selectedEntry.specialtyIds` + `specialtyStore` — keep those.)

### EventForm.vue
```html
<DisciplineSelect
  v-model="rupEntryIdModel"
  label="Результат обучения/дисциплина"
  name="event-rupEntry-generic"
  id="event-rupEntry-generic"
  placeholder="Выберите результат обучения/дисциплину"
/>
```
(searchable defaults true.)

### AddEventWizard.vue
```html
<DisciplineSelect
  v-model="rupEntryIdModel"
  :searchable="false"
  id="event-rupEntry-generic"
  placeholder="Выберите дисциплину"
/>
```

### CalendarToolbar.vue
```html
<DisciplineSelect
  v-model="searchValue"
  :searchable="false"
  id="calendar-search"
  :placeholder="searchPlaceholder"
  class="w-[200px]"
/>
```
Its existing `watch(searchValue, …)` stays, but resolves the text via `rupEntryStore.getRupEntryById(value)` (build `${moduleIndex} ${moduleName} - ${learningOutcome}`) instead of the local `disciplineOptions`. Remove the now-unused `disciplineOptions` computed if nothing else uses it.

## 3. Data flow

All reactive; DisciplineSelect re-derives `options` from store refs. v-model carries rupEntryId. No store/schema/backend changes.

## 4. Testing

- `npm test` green; `npx tsc --noEmit` clean (no `any`).
- Playwright: KTP discipline picker still shows badges/chips + year filter + search; EventForm and AddEventWizard discipline dropdowns now render rich options; CalendarToolbar select still drives the calendar search.
- No unit test for DisciplineSelect (presentational wrapper, mirrors untested KtpJournalsAccordion).

## Files touched

- Create: `src/components/DisciplineSelect.vue`
- Modify: `src/components/AddKtpItemForm.vue`, `src/components/Calendar/EventForm.vue`, `src/components/Calendar/AddEventWizard.vue`, `src/components/Calendar/CalendarToolbar.vue`
