# Journals Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the column-per-course layout in `journals.vue` with a responsive grid + segmented filter bar, and create a new `JournalGridCard.vue` component matching the concept in `JournalListView.tsx`.

**Architecture:** Create one new card component (`JournalGridCard.vue`), add a flat-list computed + filter state + color-palette helper to `journals.vue`'s script, then swap the template's column layout for the new grid. No stores, composables, or other pages are touched.

**Tech Stack:** Vue 3 (Composition API, `<script setup>`), Tailwind CSS with design tokens (`bg-card`, `text-foreground`, etc.), Framework7-Vue (`f7-icon`)

**Spec:** `docs/superpowers/specs/2026-03-11-journals-redesign.md`

---

## Chunk 1: New card component

### Task 1: Create `JournalGridCard.vue`

**Files:**
- Create: `src/components/Cards/JournalGridCard.vue`

This component renders one journal entry in the new grid. It has no logic of its own beyond click/select handling — all data is passed as props.

- [ ] **Step 1: Create the file**

`src/components/Cards/JournalGridCard.vue`:

```vue
<template>
  <div
    class="group relative overflow-hidden rounded-[18px] bg-card border border-border shadow-sm hover:border-blue-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer select-none flex flex-col p-4 gap-2.5"
    @click="handleClick"
  >
    <!-- Selection checkbox -->
    <div
      v-if="selectionMode"
      class="absolute top-3 right-3 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all duration-200"
      :class="selected ? 'bg-primary border-primary' : 'bg-card border-border'"
    >
      <f7-icon
        v-if="selected"
        ios="f7:checkmark"
        md="material:check"
        size="14px"
        class="text-white"
      />
    </div>

    <!-- Top row: icon + badges -->
    <div class="flex justify-between items-start">
      <div
        class="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center text-[17px] font-extrabold flex-shrink-0"
        :style="{ background: accentColor.bg, color: accentColor.text }"
      >
        {{ titleInitial }}
      </div>
      <div class="flex flex-col items-end gap-1">
        <div
          v-if="courseNumber"
          class="bg-blue-50 text-blue-600 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-[5px]"
        >
          {{ courseNumber }} Курс
        </div>
        <div class="bg-muted text-muted-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-[5px]">
          {{ studentCount }} студ.
        </div>
      </div>
    </div>

    <!-- Title + subtitle -->
    <div>
      <p class="text-[13px] font-bold text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
        {{ title }}
      </p>
      <p class="text-[11px] text-muted-foreground leading-relaxed line-clamp-1 mt-0.5">
        {{ subtitle }}
      </p>
    </div>

    <!-- Hover chevron -->
    <div
      v-if="!selectionMode"
      class="absolute bottom-3 right-3 w-6 h-6 bg-muted rounded-full flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity"
    >
      <f7-icon ios="f7:chevron_right" md="material:chevron_right" size="12px" />
    </div>

    <!--
      Progress ring (commented out — preserved for future use)
      <div class="shrink-0 w-10 h-10 relative self-end">
        <svg viewBox="0 0 44 44" class="w-10 h-10 -rotate-90">
          <circle cx="22" cy="22" r="18" stroke="rgba(156,163,175,0.2)" stroke-width="4" fill="none" stroke-linecap="round" />
          <circle cx="22" cy="22" r="18" :stroke="progressColor" stroke-width="4" fill="none" stroke-linecap="round"
            :stroke-dasharray="circumference" :stroke-dashoffset="dashOffset" class="transition-all duration-500" />
        </svg>
        <div class="absolute inset-0 flex items-center justify-center">
          <span class="text-[10px] font-bold text-foreground">{{ percent }}%</span>
        </div>
      </div>
    -->
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { f7Icon } from 'framework7-vue'

interface AccentColor {
  bg: string
  text: string
}

interface Props {
  title: string
  subtitle: string
  accentColor: AccentColor
  courseNumber?: number
  studentCount?: number
  selectionMode?: boolean
  selected?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  studentCount: 0,
  selectionMode: false,
  selected: false,
})

const emit = defineEmits<{
  click: []
  'toggle-select': []
}>()

const titleInitial = computed(() => props.title.charAt(0).toUpperCase())

const handleClick = () => {
  if (props.selectionMode) {
    emit('toggle-select')
  } else {
    emit('click')
  }
}
</script>
```

- [ ] **Step 2: Verify the file was created correctly**

```bash
head -5 src/components/Cards/JournalGridCard.vue
```

Expected output starts with `<template>`.

- [ ] **Step 3: Commit**

```bash
git add src/components/Cards/JournalGridCard.vue
git commit -m "feat(journals): add JournalGridCard component for grid redesign"
```

---

## Chunk 2: Script additions in journals.vue

### Task 2: Add filter state, flat-list computed, color palette helper

**Files:**
- Modify: `src/pages/journals.vue` (script section only)

We need three additions to the `<script setup>` block:
1. `JOURNAL_CARD_PALETTE` constant + `getJournalAccentColor()` helper
2. `activeFilter` ref
3. `filteredByTab` computed (flat list filtered by activeFilter)

- [ ] **Step 1: Add the import for `JournalGridCard` and the palette + filter additions**

Find the import block near the top of the script (around line 413) and add the import:

```typescript
import JournalGridCard from '@/components/Cards/JournalGridCard.vue'
```

- [ ] **Step 2: Add palette constant, color helper, filter state, and flat computed**

Add after the existing computed `filteredIndividualJournals` (around line 822 in the original), before `goToJournalDetails`:

```typescript
// ─── Journal grid redesign ────────────────────────────────────────────────

const JOURNAL_CARD_PALETTE = [
  { bg: '#EFF6FF', text: '#3b82f6' },
  { bg: '#F0FDF4', text: '#10b981' },
  { bg: '#FFF7ED', text: '#f59e0b' },
  { bg: '#F5F3FF', text: '#8b5cf6' },
  { bg: '#FFF1F2', text: '#f43f5e' },
  { bg: '#ECFDF5', text: '#059669' },
] as const

function getJournalAccentColor(id: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xfffffff
  }
  return JOURNAL_CARD_PALETTE[hash % JOURNAL_CARD_PALETTE.length]
}

type JournalFilter = 'all' | 'course-1' | 'course-2' | 'course-3' | 'course-4' | 'mixed' | 'individual'
const activeFilter = ref<JournalFilter>('all')

const JOURNAL_FILTERS = [
  { id: 'all',        label: 'Все' },
  { id: 'course-1',   label: '1 Курс' },
  { id: 'course-2',   label: '2 Курс' },
  { id: 'course-3',   label: '3 Курс' },
  { id: 'course-4',   label: '4 Курс' },
  { id: 'mixed',      label: 'Смешанные' },
  { id: 'individual', label: 'Индивидуальные' },
] as const

const filteredByTab = computed(() => {
  if (activeFilter.value === 'all') {
    const flat: Journal[] = []
    Object.values(filteredJournalsByCourse.value).forEach((list) => flat.push(...list))
    flat.push(...filteredMixedGroupJournals.value)
    flat.push(...filteredIndividualJournals.value)
    return flat
  }
  if (activeFilter.value === 'mixed')      return filteredMixedGroupJournals.value
  if (activeFilter.value === 'individual') return filteredIndividualJournals.value
  const num = parseInt(activeFilter.value.split('-')[1])
  return filteredJournalsByCourse.value[num] ?? []
})

// ─────────────────────────────────────────────────────────────────────────────
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/journals.vue
git commit -m "feat(journals): add filter state, flat computed, and color palette helper"
```

---

## Chunk 3: Template replacement in journals.vue

### Task 3: Replace column layout with filter bar + grid

**Files:**
- Modify: `src/pages/journals.vue` (template section)

The existing column layout lives inside the `bg-card` panel, after the action-buttons block (starting at `<div class="overflow-x-auto">`). Replace everything from `<div class="overflow-x-auto">` through the closing `</template>` of the `v-for="(course, idx) in courses"` (approximately lines 276–387) with the new filter bar + grid.

- [ ] **Step 1: Locate the exact block to replace**

The block to remove starts with:
```html
            <div class="overflow-x-auto">
              <div class="flex gap-5 w-full">
                <template v-for="(course, idx) in courses" :key="course.id">
```
…and ends just before the closing `</div>` of the outer `bg-card` panel (the `</div>` that closes `<div class="bg-card … shadow-md">`).

- [ ] **Step 2: Replace that block with the filter bar + grid**

Replace the old column layout with:

```html
            <!-- Filter bar -->
            <div class="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl self-start overflow-x-auto max-w-full mb-5 flex-wrap">
              <button
                v-for="f in JOURNAL_FILTERS"
                :key="f.id"
                @click="activeFilter = f.id"
                class="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 whitespace-nowrap"
                :class="activeFilter === f.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
              >
                {{ f.label }}
              </button>
            </div>

            <!-- Journal grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <JournalGridCard
                v-for="journal in filteredByTab"
                :key="journal.id"
                :title="journalStore.getDisciplineTitle(journal)"
                :subtitle="journalStore.getJournalSubtitle(journal)"
                :accent-color="getJournalAccentColor(journal.id)"
                :course-number="(!journal.isMixedGroup && !journal.isIndividualJournal) ? journal.courseNumber : undefined"
                :student-count="journal.students?.length ?? 0"
                :selection-mode="isSelectionMode"
                :selected="selectedJournalIds.has(journal.id)"
                @click="goToJournalDetails(journal.id)"
                @toggle-select="toggleJournalSelection(journal.id)"
              />
              <div
                v-if="filteredByTab.length === 0"
                class="col-span-full rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground"
              >
                <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <f7-icon ios="f7:tray" md="material:inbox" size="24px" class="opacity-40" />
                </div>
                <span class="text-sm font-medium opacity-60">В этой категории нет журналов</span>
              </div>
            </div>
```

- [ ] **Step 3: Remove the now-unused `IndividualJournalPopup` add button from the old layout**

The old template had a dedicated "+ индивидуальный журнал" add button inside the column loop (lines ~343-358). Since the grid replaces the entire column loop, this button is gone. The `onAddIndividualJournal` function and `IndividualJournalPopup` component remain — they're still reachable via other means if needed in future.

Verify the template no longer contains the `v-for="(course, idx) in courses"` loop:

```bash
grep -n "v-for=\"(course, idx)" src/pages/journals.vue
```

Expected: no output (the loop is gone).

- [ ] **Step 4: Verify the app builds without errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript/Vue errors. Warnings about unused variables are acceptable.

- [ ] **Step 5: Commit**

```bash
git add src/pages/journals.vue
git commit -m "feat(journals): replace column layout with grid + segmented filter bar"
```

---

## Chunk 4: Manual verification

### Task 4: Smoke test in browser

**Files:** none

- [ ] **Step 1: Start dev server**

```bash
npm run dev
```

Navigate to the Journals page.

- [ ] **Step 2: Check filter bar**

All 7 pills render. Clicking each one filters the grid correctly:
- "Все" → all journals
- "1 Курс" → only course-1 journals
- "Смешанные" → only mixed-group journals
- "Индивидуальные" → only individual journals
- Empty category → dashed empty-state box appears

- [ ] **Step 3: Check card design**

Each card shows:
- Colored icon (first letter of discipline title, deterministic color)
- "N Курс" badge (absent for mixed/individual)
- Student count badge
- Title (discipline name)
- Subtitle (group/language info)
- Chevron appears on hover

- [ ] **Step 4: Check selection mode still works**

Click "Скачать" button → cards show checkboxes → selecting + confirming works.

- [ ] **Step 5: Check dark / lavanda themes**

Switch theme via the theme toggle. Cards use `bg-card`, `border-border`, `text-foreground` — they should adapt without hardcoded white/gray leaking through.

- [ ] **Step 6: Check Calendar popover is unaffected**

Navigate to the Calendar page. Open a journal preview popover. The amber `JournalCard.vue` is still rendered correctly.

- [ ] **Step 7: Final commit (if any style fixes needed)**

```bash
git add src/pages/journals.vue src/components/Cards/JournalGridCard.vue
git commit -m "fix(journals): polish grid card style after smoke test"
```
