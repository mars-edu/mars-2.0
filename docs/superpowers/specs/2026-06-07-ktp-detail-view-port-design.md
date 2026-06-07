# KTP Detail View Port — Design

**Date:** 2026-06-07
**Scope:** Port concept-v2's in-page KTP detail interface into mars-2.0's KtpPage, backed by a shared `useKtpDetail` composable extracted from `KtpDetailPopupBody`.
**Out of scope:** journal planning tab redesign (keeps current PopupBody template), wizard/EventForm KTP popups (unchanged), delete-all in the detail view (stays in popup header / card ⋮ menu), literal concept-v2 colors (mars theme tokens used instead).

## Background

mars-2.0 currently shows KTP details only in a near-fullscreen popover (`KtpDetailPopup` → `KtpDetailPopupBody`, 707 lines). concept-v2's KtpView renders details **in-page**: back button, metric cards, large title, action-pill toolbar, and a clean 6-column topic table. Decision: KtpPage card click swaps the list for an in-page detail view (concept layout, mars-2.0 design tokens); the popup remains for the journal planning tab, AddEventWizard, and EventForm. Detail table shows the concept 6-column set; per-type hour fields (СРСП/СРС/Теория/Практика/Индив.) remain visible only in the edit/view form popover.

To avoid duplicating ~400 lines of logic (the concept-v2 dead-duplicate disease), all detail logic moves into a composable consumed by both surfaces.

## 1. `useKtpDetail` composable (new: `src/composables/useKtpDetail.ts`)

Verbatim extraction of `KtpDetailPopupBody`'s script logic. Signature:

```ts
export function useKtpDetail(ktpId: ComputedRef<string | null> | Ref<string | null>)
```

Callers pass `computed(() => props.ktpId)` (avoids `Ref<string>` vs `Ref<string | null>` invariance friction).

Returns (names preserved from PopupBody):

- **Data:** `ktpDetails` (sorted via `ktpStore.getDetailsByKtpId`), `linkedEvent`, `lessonDates`, `getLessonDateByIndex(idx)`, `learningOutcome`
- **Hours:** `plannedHoursFromKtp` (sum of detail.totalHours), `semesterPlannedHours` (budget via `useKtpPlannedHours`, `number | null`), `remainingHoursForForm` (`number | undefined`)
- **Locking:** `isRowLocked(idx)` (positional lesson date < today)
- **Form popover state:** `isFormPopoverOpen`, `editingDetail`, `isEditingLocked`, `openAddPopover()`, `openEditPopover(detail)`, `handleRowClick(item, idx)`
- **Drag:** `dragSourceId`, `dragOverId`, `dropIndex`, `onDragStart`, `onDragEnter`, `onDragOver`, `onDrop`, `onDragEnd`
- **Import/export:** `isImporting`, `uploadDocument()`, `importData()`, `isRupImportDialogOpen`, `onThemesImported(count)`, `downloadRup()`, `downloadTemplate()`
- **Title:** `moduleTitle` computed — moved up from `KtpDetailPopup.computedModuleTitle` (`${moduleIndex} - ${moduleName}` via rupEntryStore, fallback «Рабочие учебные программы»)

`KtpDetailPopupBody.vue` script shrinks to a composable call (`useKtpDetail(toRef(props, 'ktpId'))`); **its template is not modified**. `KtpDetailPopup.vue` keeps its own `computedModuleTitle` usage or switches to the composable's `moduleTitle` — implementer's choice, behavior identical.

## 2. `KtpDetailView.vue` (new: `src/components/KtpDetailView.vue`)

In-page detail surface, concept-v2 layout, mars-2.0 tokens. Props: `{ ktpId: string }`. Emits: `back`.

Layout top-to-bottom:

1. **Back button:** `← Назад к списку` (ghost, muted-foreground → foreground on hover), `@click="emit('back')"`.
2. **Metric cards row** (concept style: tiny uppercase tracking-widest muted label over 2xl bold number):
   - «Запланировано»: `semesterPlannedHours ?? '—'` + « ч.»
   - «Добавлено»: `plannedHoursFromKtp` + « ч.»
3. **Title:** `moduleTitle`, `text-3xl font-bold`.
4. **Action bar** (flex-wrap, rounded-2xl bold pill buttons in primary tokens):
   - «Скачать шаблон» (id `download-template-button`) → `downloadTemplate()`
   - «Скачать план» → `downloadRup()`
   - «Загрузить план» → `uploadDocument()`
   - «Импорт» → `importData()`
   - «Добавить» (emerald/success accent, IconPlus) → `openAddPopover()`
5. **Topic table** (6 data columns + drag-handle column):
   `№ | Тема занятия | Дата | Часы | Что задано? | Примечание | ≡`
   - Row: locked → Lock icon before theme, muted bg, `draggable=false`; unlocked → grip handle, draggable
   - Empty theme → italic muted «Тема еще не загружена»
   - Дата = `getLessonDateByIndex(idx)`; Часы = `totalHours ?? '—'`; homework/notes `|| '—'`
   - Row click → `handleRowClick(item, idx)` (locked opens FormPopover view-mode)
   - Drop-indicator line between rows during drag (same pattern as PopupBody)
   - Loading state: «Загрузка деталей...» when `ktpStore.loading && !isImporting`
6. **Children:** `KtpDetailFormPopover` (v-if ktpId, same prop wiring as PopupBody), `DownloadTemplateDialog`, `RupImportDialog`. Element ids match PopupBody's — only one surface is mounted at a time, no id clash.

No delete-all button (concept parity; plan deletion via card ⋮ menu).

## 3. KtpPage wiring (`src/pages/KtpPage.vue`)

- New `selectedKtpId = ref<string | null>(null)`.
- `selectItem(item)`: sets `selectedKtpId = item.ktpId` and calls `ktpStore.fetchDetailsForKtp(item.ktpId)` (replaces popup opening). Items without `ktpId` cannot occur (ktpItems built from ktps).
- Template: `<KtpDetailView v-if="selectedKtpId" :ktp-id="selectedKtpId" @back="selectedKtpId = null" />`, `v-else` the existing search/filter + card list block. Header row («Тематические планы (КТП)» + Создать) hidden in detail mode (concept parity — detail view owns the full area).
- Remove `KtpDetailPopup` import/usage and `isPopupOpened`/`selectedKtpParentId` state from KtpPage. The popup component itself remains (JournalDetails, AddEventWizard, EventForm).

## 4. Data flow

No store/backend changes. Composable is a pure refactor of existing logic; both surfaces call identical store actions (`updateKtpDetail`, `reorderKtpDetails`, `bulkImportKtpDetails`, etc.).

## 5. Error handling

Unchanged from PopupBody: toasts on import/reorder/export errors, `ktpStore.error` banner (View renders the same banner at top).

## 6. Testing

- **e2e additions** (`tests/e2e/ktp.spec.ts`): card click → «Назад к списку» button and table header «Тема занятия» visible; click back → card list visible again. Card ⋮ menu test unaffected.
- **Manual regression:** journal planning tab (PopupBody on composable) — add/edit/drag/import still work; wizard КТП popup opens.
- No new unit tests: composable is moved code; its pure dependencies (`ktpHelpers`, `useKtpPlannedHours` parts) already covered.

## Files touched

- Create: `src/composables/useKtpDetail.ts`, `src/components/KtpDetailView.vue`
- Modify: `src/components/KtpDetailPopupBody.vue` (script → composable, template untouched), `src/pages/KtpPage.vue`, `tests/e2e/ktp.spec.ts`
- Optional touch: `src/components/KtpDetailPopup.vue` (may adopt composable's `moduleTitle`)
