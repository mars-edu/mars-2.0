# Journals Page Redesign

**Date:** 2026-03-11
**Status:** Approved
**Source concept:** `1-руп-и-каталог-дисциплин-fresh/components/JournalListView.tsx`

---

## Summary

Redesign the `journals.vue` list view from a horizontal column-per-course layout with amber gradient cards to a responsive grid with a segmented filter bar and clean white minimal cards, matching the concept from `JournalListView.tsx`.

No "Создать журналы" (Create journal) button is included.

---

## Architecture

**Approach A (selected):** Direct rewrite of the list section in `journals.vue` + new `JournalGridCard.vue` component.

- `src/pages/journals.vue` — template rewritten (list section only); script/stores/logic untouched
- `src/components/Cards/JournalGridCard.vue` — NEW component for the grid cards
- `src/components/Cards/JournalCard.vue` — UNCHANGED (still used in Calendar popover)

---

## Components

### `JournalGridCard.vue`

Props:
- `title: string` — discipline name
- `subtitle: string` — group/language info (from `journalStore.getJournalSubtitle`)
- `courseNumber?: number` — shown as "N Курс" badge; omitted for mixed/individual
- `studentCount: number`
- `accentColor: { bg: string; text: string }` — passed from parent, derived by palette index
- `selectionMode?: boolean`
- `selected?: boolean`

Emits: `click`, `toggle-select`

Design tokens used: `bg-card`, `border-border`, `text-foreground`, `text-muted-foreground` — card adapts to light/dark/lavanda themes.

### Color palette (in `journals.vue`)

6-color palette, index = `disciplineId` hashed to 0–5:

| Index | bg | text |
|---|---|---|
| 0 | `#EFF6FF` | `#3b82f6` |
| 1 | `#F0FDF4` | `#10b981` |
| 2 | `#FFF7ED` | `#f59e0b` |
| 3 | `#F5F3FF` | `#8b5cf6` |
| 4 | `#FFF1F2` | `#f43f5e` |
| 5 | `#ECFDF5` | `#059669` |

### Segmented filter bar

Options: Все | 1 Курс | 2 Курс | 3 Курс | 4 Курс | Смешанные | Индивидуальные

Implemented as a `ref<FilterValue>` computed against the flattened journal list (all courses + mixed + individual combined into one flat array).

---

## Layout Structure (journals.vue template)

```
<page-header>
  <h1>Журналы</h1>
  <dropdown-row> Academic Year | Semester | Teacher (admin) </dropdown-row>

<bg-card panel>
  <action-buttons-row>  ← unchanged (Settings, Open, Close, Download, Replace, Upload, Share)
  <segmented-filter-bar>  ← NEW
  <journal-grid>  ← NEW (replaces column layout)
    <JournalGridCard v-for="journal in filteredJournals" />
    <EmptyState v-if="filteredJournals.length === 0" />
```

### Filter logic

Flat list: `[...journalsByCourse flat, ...mixedGroupJournals, ...individualJournals]`

Filter by:
- `all` → all journals
- `course-N` → `journal.courseNumber === N && !journal.isMixedGroup && !journal.isIndividualJournal`
- `mixed` → `journal.isMixedGroup`
- `individual` → `journal.isIndividualJournal`

### Progress ring

The circular progress ring in `JournalGridCard.vue` is **commented out** (code preserved, not rendered). Can be re-enabled later.

---

## Data Flow

No changes to stores or composables. `journals.vue` continues using:
- `journalStore.journalsByCourse`, `mixedGroupJournals`, `individualJournals`
- `journalStore.getDisciplineTitle`, `getJournalSubtitle`, `getJournalGroupLanguage`, `getJournalPercent`
- All existing filter selects (academic year, semester, teacher, discipline, term, status, group, role)

---

## What Does NOT Change

- All Pinia stores
- `JournalCard.vue` (Calendar popover)
- `IndividualJournalPopup.vue`, `ReplaceJournalPopover.vue`
- All action button logic (open/close/download/replace/upload/share/selection mode)
- The 5 filter selects inside the card panel (discipline, term, status, group, role)
- No "Создать журналы" button added
