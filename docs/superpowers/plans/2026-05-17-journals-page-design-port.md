# Журналы Page Design Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the visual design of the Журналы page from `concept/components/JournalListView.tsx` to `mars-2.0`, matching the concept's typography, card design, layout, and interaction patterns without changing any functional behavior.

**Architecture:** Two files change — `JournalGridCard.vue` gets a full visual redesign (larger cards, bottom badges, hover yellow border), and `journals.vue` gets a new page layout (gray bg, large title, inline pill dropdowns, collapsed action menu). All Convex store logic, i18n keys, routing, and selection mode behavior are untouched.

**Tech Stack:** Vue 3, Tailwind CSS, unplugin-icons (`~icons/lucide/*`), existing Pinia stores.

**Spec:** `docs/superpowers/specs/2026-05-17-journals-page-design-port.md`

---

### Task 1: Redesign `JournalGridCard.vue`

**Files:**
- Modify: `src/components/Cards/JournalGridCard.vue`

- [ ] **Step 1: Replace the card template**

Replace the entire `<template>` block in `src/components/Cards/JournalGridCard.vue` with:

```vue
<template>
  <div
    class="group relative overflow-hidden rounded-[20px] bg-card border border-transparent shadow-sm hover:border-yellow-400 hover:shadow-[0_12px_32px_rgba(250,204,21,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer select-none flex flex-col p-4 gap-3"
    @click="handleClick"
  >
    <!-- Top row: icon + hover menu OR selection checkbox -->
    <div class="flex justify-between items-start">
      <div
        class="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-extrabold flex-shrink-0"
        :style="{ background: accentColor.bg, color: accentColor.text }"
      >
        {{ titleInitial }}
      </div>

      <!-- Selection checkbox (replaces menu in selection mode) -->
      <div
        v-if="selectionMode"
        class="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0"
        :class="selected ? 'bg-primary border-primary' : 'bg-card border-border'"
      >
        <IconCheck v-if="selected" class="w-3.5 h-3.5 text-white" />
      </div>

      <!-- Per-card action menu (normal mode, visible on hover) -->
      <div v-else class="relative" @click.stop>
        <button
          class="p-1.5 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
          @click="isMenuOpen = !isMenuOpen"
        >
          <IconMoreVertical class="w-4 h-4" />
        </button>
        <!-- Backdrop -->
        <div
          v-if="isMenuOpen"
          class="fixed inset-0 z-40"
          @click="isMenuOpen = false"
        />
        <div
          v-if="isMenuOpen"
          class="absolute right-0 top-full mt-1 w-48 bg-card rounded-2xl shadow-2xl border border-border py-2 z-50"
        >
          <button
            class="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-2"
            @click="emit('download'); isMenuOpen = false"
          >
            <IconDownload class="w-4 h-4" />
            Скачать журнал
          </button>
        </div>
      </div>
    </div>

    <!-- Title + subtitle -->
    <div class="flex-1">
      <p class="text-[22px] font-bold text-foreground leading-tight line-clamp-4 group-hover:text-primary transition-colors">
        {{ title }}
      </p>
      <p class="text-sm text-muted-foreground leading-relaxed line-clamp-1 mt-1">
        {{ subtitle }}
      </p>
    </div>

    <!-- Bottom badges -->
    <div class="flex flex-wrap items-center gap-2 mt-auto">
      <div
        v-if="courseNumber !== undefined"
        class="bg-primary/10 text-primary text-[13px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-md"
      >
        {{ courseNumber }} Курс
      </div>
      <div class="bg-muted text-muted-foreground text-[13px] font-bold px-3 py-1.5 rounded-md">
        {{ studentCount }} студ.
      </div>
    </div>
  </div>
</template>
```

- [ ] **Step 2: Replace the `<script setup>` block**

Replace the entire `<script setup>` block with:

```vue
<script setup lang="ts">
import { ref } from 'vue'
import IconCheck from "~icons/lucide/check"
import IconMoreVertical from "~icons/lucide/more-vertical"
import IconDownload from "~icons/lucide/download"

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
  download: []
}>()

const isMenuOpen = ref(false)
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

Note: add `import { ref, computed } from 'vue'` — `computed` is needed for `titleInitial`.

- [ ] **Step 3: Fix the import line**

The script block should start with:

```ts
import { ref, computed } from 'vue'
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Cards/JournalGridCard.vue
git commit -m "design: redesign JournalGridCard to match concept — larger cards, bottom badges, yellow hover, per-card download menu"
```

---

### Task 2: Update `journals.vue` — page layout & background

**Files:**
- Modify: `src/pages/journals.vue` (template section, lines ~12–16)

- [ ] **Step 1: Update the content wrapper div**

Find this div (around line 12):
```html
<div class="flex flex-1 overflow-hidden">
  <div
    class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 transition-all duration-200"
    :class="contentMargin"
  >
    <div class="flex flex-col gap-4">
```

Replace with:
```html
<div class="flex flex-1 overflow-hidden">
  <div
    class="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/40 pb-16 md:pb-6 transition-all duration-200"
    :class="contentMargin"
  >
    <div class="flex flex-col gap-6">
```

- [ ] **Step 2: Remove the `bg-card` wrapper div**

Find (around line 51–53):
```html
          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md"
          >
```

Remove that opening div tag and its closing `</div>` (which is around line 256, just before `</div>` that closes the `flex flex-col gap-6`). The content inside (filters, tabs, grid) remains flat.

- [ ] **Step 3: Commit**

```bash
git add src/pages/journals.vue
git commit -m "design: flatten journals page layout — gray bg, more padding, remove card wrapper"
```

---

### Task 3: Update `journals.vue` — header redesign with pill dropdowns

**Files:**
- Modify: `src/pages/journals.vue`

- [ ] **Step 1: Add new icon imports to `<script setup>`**

Add these imports after the existing icon imports (around line 286):
```ts
import IconChevronDown from "~icons/lucide/chevron-down"
import IconMoreVertical from "~icons/lucide/more-vertical"
```

- [ ] **Step 2: Add pill dropdown open/close state**

Add these refs after `const activeFilter = ref<JournalFilter>('all')` (around line 789):

```ts
const isYearPillOpen = ref(false)
const isSemesterPillOpen = ref(false)
const isTeacherPillOpen = ref(false)
```

- [ ] **Step 3: Add computed helpers for current pill labels**

Add these computed values after the `teacherOptions` computed (around line 469):

```ts
const currentYearLabel = computed(() => {
  const found = academicYearOptions.value.find(o => o.value === selectedAcademicYearModel.value)
  return found?.text ?? journal_academic_year()
})

const currentSemesterLabel = computed(() => {
  const found = semesterOptions.value.find(o => o.value === selectedSemesterId.value)
  return found?.text ?? journal_semester()
})

const currentTeacherLabel = computed(() => {
  const found = teacherOptions.value.find(o => o.value === selectedTeacherId.value)
  return found?.text ?? journal_teacher()
})
```

- [ ] **Step 4: Replace the header `<div>` in the template**

Find and replace the entire header block (the `div.flex.flex-col.md:flex-row` that contains `<h1>` and the three `<Select>` components), from around line 17–48:

```html
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-3 journals-page-header"
          >
            <h1 class="text-2xl font-semibold">{{ journal_title() }}</h1>
            <div
              class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"
            >
              <Select ... />
              <Select ... />
              <Select v-if="userStore.isAdmin" ... />
            </div>
          </div>
```

Replace with:

```html
          <div class="flex items-start justify-between gap-4">
            <div>
              <h1 class="text-4xl font-bold tracking-tight text-foreground">{{ journal_title() }}</h1>
              <div class="flex flex-wrap items-center gap-2 text-muted-foreground font-medium mt-2 text-[15px]">
                <span>Выберите журнал для работы</span>
                <span class="text-border">•</span>

                <!-- Year pill -->
                <div class="relative">
                  <button
                    class="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition-all shadow-sm"
                    @click="isYearPillOpen = !isYearPillOpen; isSemesterPillOpen = false; isTeacherPillOpen = false"
                  >
                    <span>{{ currentYearLabel }}</span>
                    <IconChevronDown class="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200" :class="{ 'rotate-180': isYearPillOpen }" />
                  </button>
                  <div v-if="isYearPillOpen" class="fixed inset-0 z-40" @click="isYearPillOpen = false" />
                  <div v-if="isYearPillOpen" class="absolute left-0 top-full mt-2 w-44 bg-card rounded-xl shadow-xl border border-border py-2 z-50">
                    <button
                      v-for="opt in academicYearOptions"
                      :key="opt.value"
                      class="w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted flex items-center justify-between"
                      @click="selectedAcademicYearModel = opt.value; isYearPillOpen = false"
                    >
                      <span>{{ opt.text }}</span>
                      <IconCheck v-if="selectedAcademicYearModel === opt.value" class="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>
                </div>

                <span class="text-border">•</span>

                <!-- Semester pill -->
                <div class="relative">
                  <button
                    class="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition-all shadow-sm"
                    @click="isSemesterPillOpen = !isSemesterPillOpen; isYearPillOpen = false; isTeacherPillOpen = false"
                  >
                    <span>{{ currentSemesterLabel }}</span>
                    <IconChevronDown class="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200" :class="{ 'rotate-180': isSemesterPillOpen }" />
                  </button>
                  <div v-if="isSemesterPillOpen" class="fixed inset-0 z-40" @click="isSemesterPillOpen = false" />
                  <div v-if="isSemesterPillOpen" class="absolute left-0 top-full mt-2 w-44 bg-card rounded-xl shadow-xl border border-border py-2 z-50">
                    <button
                      v-for="opt in semesterOptions"
                      :key="opt.value"
                      class="w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted flex items-center justify-between"
                      @click="selectedSemesterId = opt.value; isSemesterPillOpen = false"
                    >
                      <span>{{ opt.text }}</span>
                      <IconCheck v-if="selectedSemesterId === opt.value" class="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>
                </div>

                <template v-if="userStore.isAdmin">
                  <span class="text-border">•</span>

                  <!-- Teacher pill -->
                  <div class="relative">
                    <button
                      class="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition-all shadow-sm"
                      @click="isTeacherPillOpen = !isTeacherPillOpen; isYearPillOpen = false; isSemesterPillOpen = false"
                    >
                      <span>{{ currentTeacherLabel }}</span>
                      <IconChevronDown class="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200" :class="{ 'rotate-180': isTeacherPillOpen }" />
                    </button>
                    <div v-if="isTeacherPillOpen" class="fixed inset-0 z-40" @click="isTeacherPillOpen = false" />
                    <div v-if="isTeacherPillOpen" class="absolute left-0 top-full mt-2 w-64 bg-card rounded-xl shadow-xl border border-border py-2 z-50 max-h-72 overflow-y-auto">
                      <button
                        v-for="opt in teacherOptions"
                        :key="opt.value"
                        class="w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted flex items-center justify-between"
                        @click="selectedTeacherId = opt.value; isTeacherPillOpen = false"
                      >
                        <span class="truncate">{{ opt.text }}</span>
                        <IconCheck v-if="selectedTeacherId === opt.value" class="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
```

Note: `IconCheck` is already imported in `JournalGridCard.vue` but NOT in `journals.vue`. Add this import to `journals.vue`:
```ts
import IconCheck from "~icons/lucide/check"
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/journals.vue
git commit -m "design: redesign journals header — large title, inline year/semester/teacher pill dropdowns"
```

---

### Task 4: Update `journals.vue` — collapse action buttons into MoreVertical dropdown

**Files:**
- Modify: `src/pages/journals.vue`

- [ ] **Step 1: Add action menu open state**

Add this ref after the pill open refs (after `isTeacherPillOpen`):

```ts
const isActionMenuOpen = ref(false)
```

- [ ] **Step 2: Replace the action buttons area in the template**

The current action buttons are inside `<template v-else>` (the non-selection-mode branch, around lines 146–212). This `<template v-else>` block currently outputs 7 `<f7-button>` elements.

Find the entire `<template v-else>` ... `</template>` block containing all 7 buttons and the wrapping `<div class="mb-3 flex flex-wrap gap-2 items-center justify-end">`. Replace the contents of that wrapper div (keeping the `<template v-if="isSelectionMode">` branch unchanged) with:

Replace the `<template v-else>` block (the one with all 7 `f7-button` elements) with:

```html
              <template v-else>
                <div class="relative">
                  <button
                    class="p-2.5 bg-card rounded-xl shadow-sm border border-border hover:border-primary hover:text-primary transition-all flex items-center justify-center"
                    @click="isActionMenuOpen = !isActionMenuOpen"
                  >
                    <IconMoreVertical class="w-5 h-5" />
                  </button>
                  <div v-if="isActionMenuOpen" class="fixed inset-0 z-40" @click="isActionMenuOpen = false" />
                  <div v-if="isActionMenuOpen" class="absolute right-0 top-full mt-2 w-56 bg-card rounded-2xl shadow-2xl border border-border py-2 z-50">
                    <button class="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted hover:text-primary transition-colors flex items-center gap-2"
                      @click="onSettingsClick(); isActionMenuOpen = false">
                      <IconSettings2 class="w-4 h-4" />
                      {{ journal_settings() }}
                    </button>
                    <button class="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted hover:text-primary transition-colors flex items-center gap-2"
                      @click="onOpenJournalClick(); isActionMenuOpen = false">
                      <IconLockOpen class="w-4 h-4" />
                      {{ journal_open() }}
                    </button>
                    <button class="w-full text-left px-4 py-2.5 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                      @click="onCloseJournalClick(); isActionMenuOpen = false">
                      <IconCircleX class="w-4 h-4" />
                      {{ journal_close() }}
                    </button>
                    <button class="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted hover:text-primary transition-colors flex items-center gap-2"
                      @click="onDownloadClick(); isActionMenuOpen = false">
                      <IconArrowDownToLine class="w-4 h-4" />
                      {{ journal_download() }}
                    </button>
                    <div class="h-px bg-border my-1" />
                    <button class="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted hover:text-primary transition-colors flex items-center gap-2"
                      @click="onReplaceClick(); isActionMenuOpen = false">
                      <IconRefreshCw class="w-4 h-4" />
                      {{ journal_replace() }}
                    </button>
                    <button class="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted hover:text-primary transition-colors flex items-center gap-2"
                      @click="onUploadClick(); isActionMenuOpen = false">
                      <IconArrowUpToLine class="w-4 h-4" />
                      {{ journal_upload() }}
                    </button>
                    <button class="w-full text-left px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted hover:text-primary transition-colors flex items-center gap-2"
                      @click="onShareClick(); isActionMenuOpen = false">
                      <IconShare class="w-4 h-4" />
                      {{ journal_share() }}
                    </button>
                  </div>
                </div>
              </template>
```

- [ ] **Step 3: Move the action menu button to the header row**

The `<div class="mb-3 flex flex-wrap gap-2 items-center justify-end">` wrapper now only contains the selection mode banner and the MoreVertical button. Move the MoreVertical button into the header row (Task 3's `<div class="flex items-start justify-between gap-4">`) as a flex sibling to the title+subtitle div:

In the header div from Task 3, the outer div ends with just the title+subtitle section. Add the action menu button as a sibling after the title div:

```html
          <div class="flex items-start justify-between gap-4">
            <div>
              <!-- title + subtitle pills (from Task 3) -->
            </div>

            <!-- Action menu button -->
            <div class="relative flex-shrink-0 mt-1">
              <button
                class="p-2.5 bg-card rounded-xl shadow-sm border border-border hover:border-primary hover:text-primary transition-all flex items-center justify-center"
                @click="isActionMenuOpen = !isActionMenuOpen"
              >
                <IconMoreVertical class="w-5 h-5" />
              </button>
              <div v-if="isActionMenuOpen" class="fixed inset-0 z-40" @click="isActionMenuOpen = false" />
              <div v-if="isActionMenuOpen" class="absolute right-0 top-full mt-2 w-56 bg-card rounded-2xl shadow-2xl border border-border py-2 z-50">
                <!-- same menu items as Step 2 -->
              </div>
            </div>
          </div>
```

This means the `<div class="mb-3 flex flex-wrap gap-2 items-center justify-end">` wrapper now only needs to contain the selection mode banner (`<template v-if="isSelectionMode">`). Remove the `<template v-else>` from it entirely (the MoreVertical button is now in the header).

- [ ] **Step 4: Wire the `@download` event on `JournalGridCard`**

In the journal grid (around line 233–245), update `<JournalGridCard>` to handle the download event:

```html
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
                @download="handleCardDownload(journal.id)"
              />
```

Add the handler function in `<script setup>` (after `onSelectionDone`):

```ts
function handleCardDownload(journalId: string) {
  selectedJournalIds.value = new Set([journalId])
  selectionAction.value = 'download'
  onSelectionDone()
}
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/journals.vue
git commit -m "design: collapse journal action buttons into MoreVertical dropdown, wire per-card download"
```

---

### Task 5: Remove unused `f7-button` imports and verify

**Files:**
- Modify: `src/pages/journals.vue`

- [ ] **Step 1: Remove now-unused imports**

After replacing all `<f7-button>` usages with plain `<button>` elements, remove from the import line:

```ts
import { f7Page, f7Input, f7, f7Button } from "framework7-vue";
```

Change to (keeping only what's still used for router navigation in `handleTabClick`):

```ts
import { f7 } from "framework7-vue";
```

Check if `f7Page`, `f7Input`, `f7Button` are still referenced anywhere else in the template (search for `f7-page`, `f7-input`, `f7-button`). The `<f7-page>` tag is still in use — keep `f7Page` if needed by Framework7's component registration. Keep only what TypeScript doesn't complain about.

- [ ] **Step 2: Start the dev server and verify**

```bash
cd /home/olge/SOFT/git/MARS/mars-2.0
npm run dev
```

Navigate to `http://localhost:5173/journals/` (or whatever the dev URL is). Verify:
- Page has gray background with generous padding
- Title "Журналы" is large and bold (≈40px)
- Year/semester/teacher pills appear inline below title, open dropdowns on click, update the journal list
- MoreVertical button top-right opens dropdown with all 7 actions
- Journal cards are larger with colored icon block, large title, bottom badges
- Hovering a card shows yellow border + shadow + lift
- Hovering a card shows the `...` menu (download)
- Selection mode still works (checkboxes appear, banner shows)

- [ ] **Step 3: Commit**

```bash
git add src/pages/journals.vue
git commit -m "chore: clean up unused f7-button import after action button refactor"
```
