# Framework7 Icons → unplugin-icons Migration Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all 183 Framework7 icon usages (83 files, 54 unique icon names) with unplugin-icons Vue components, then remove `framework7-icons` from `package.json`.

**Architecture:** Direct per-file replacement — each file gets static `import IconName from "~icons/lucide/icon-name"` imports, replacing `<f7-icon>` components and `<i class="f7-icons">` elements with `<IconName />`. Two special components (`EmptyState`, `NoData`) have dynamic icon props and need their prop type changed from string/object to Vue component. The F7 action sheet HTML strings in TeacherCard strip their icon elements.

**Tech Stack:** Vue 3, unplugin-icons (already configured), `@iconify-json/lucide` (already installed), Vite

---

## Icon Name Mapping Reference

Use this table for every substitution in this plan:

| F7 name(s) | Import from | Component name |
|---|---|---|
| `plus`, `add` | `~icons/lucide/plus` | `IconPlus` |
| `trash`, `delete` | `~icons/lucide/trash-2` | `IconTrash` |
| `pencil`, `edit` | `~icons/lucide/pencil` | `IconPencil` |
| `xmark`, `close` | `~icons/lucide/x` | `IconX` |
| `xmark_circle`, `cancel` | `~icons/lucide/circle-x` | `IconCircleX` |
| `xmark_circle_fill` | `~icons/lucide/circle-x` | `IconCircleX` |
| `checkmark`, `checkmark_alt` | `~icons/lucide/check` | `IconCheck` |
| `checkmark_circle`, `check_circle` | `~icons/lucide/circle-check` | `IconCircleCheck` |
| `checkmark_circle_fill` | `~icons/lucide/circle-check` | `IconCircleCheck` |
| `chevron_left` | `~icons/lucide/chevron-left` | `IconChevronLeft` |
| `chevron_right` | `~icons/lucide/chevron-right` | `IconChevronRight` |
| `chevron_down`, `expand_more` | `~icons/lucide/chevron-down` | `IconChevronDown` |
| `chevron_up`, `expand_less` | `~icons/lucide/chevron-up` | `IconChevronUp` |
| `arrow_down` | `~icons/lucide/arrow-down` | `IconArrowDown` |
| `arrow_up` | `~icons/lucide/arrow-up` | `IconArrowUp` |
| `arrow_down_to_line` | `~icons/lucide/arrow-down-to-line` | `IconArrowDownToLine` |
| `arrow_up_to_line` | `~icons/lucide/arrow-up-to-line` | `IconArrowUpToLine` |
| `arrow_down_doc`, `file_upload`, `download` | `~icons/lucide/file-down` | `IconFileDown` |
| `arrow_up_doc`, `upload_file` | `~icons/lucide/file-up` | `IconFileUp` |
| `arrow_2_squarepath` | `~icons/lucide/refresh-cw` | `IconRefreshCw` |
| `arrow_clockwise` | `~icons/lucide/rotate-cw` | `IconRotateCw` |
| `square_arrow_down` | `~icons/lucide/square-arrow-down` | `IconSquareArrowDown` |
| `square_arrow_up` | `~icons/lucide/square-arrow-up` | `IconSquareArrowUp` |
| `doc_text`, `description` | `~icons/lucide/file-text` | `IconFileText` |
| `doc_on_doc`, `content_copy`, `square_on_square` | `~icons/lucide/copy` | `IconCopy` |
| `doc_chart_fill` | `~icons/lucide/file-bar-chart` | `IconFileBarChart` |
| `clock` | `~icons/lucide/clock` | `IconClock` |
| `calendar` | `~icons/lucide/calendar` | `IconCalendar` |
| `calendar_badge_plus` | `~icons/lucide/calendar-plus` | `IconCalendarPlus` |
| `calendar_badge_exclamationmark` | `~icons/lucide/calendar-x` | `IconCalendarX` |
| `bell` | `~icons/lucide/bell` | `IconBell` |
| `bell_slash` | `~icons/lucide/bell-off` | `IconBellOff` |
| `gear`, `settings` | `~icons/lucide/settings-2` | `IconSettings2` |
| `table`, `table_chart` | `~icons/lucide/table` | `IconTable` |
| `info_circle`, `info_circle_fill` | `~icons/lucide/info` | `IconInfo` |
| `exclamationmark_triangle`, `exclamationmark_triangle_fill`, `warning` | `~icons/lucide/triangle-alert` | `IconTriangleAlert` |
| `ellipsis_vertical` | `~icons/lucide/ellipsis-vertical` | `IconEllipsisVertical` |
| `share` | `~icons/lucide/share-2` | `IconShare` |
| `search` | `~icons/lucide/search` | `IconSearch` |
| `paperclip` | `~icons/lucide/paperclip` | `IconPaperclip` |
| `globe`, `language` | `~icons/lucide/globe` | `IconGlobe` |
| `lock_open` | `~icons/lucide/lock-open` | `IconLockOpen` |
| `eye_slash` | `~icons/lucide/eye-off` | `IconEyeOff` |
| `line_horizontal_3` | `~icons/lucide/menu` | `IconMenu` |
| `sparkles`, `smart_toy` | `~icons/lucide/sparkles` | `IconSparkles` |
| `person_circle_fill` | `~icons/lucide/circle-user` | `IconCircleUser` |
| `person_2_fill` | `~icons/lucide/users` | `IconUsers` |
| `chart_bar_fill` | `~icons/lucide/bar-chart-2` | `IconBarChart` |
| `megaphone_fill` | `~icons/lucide/megaphone` | `IconMegaphone` |
| `tray` (EmptyState default) | `~icons/lucide/inbox` | `IconInbox` |
| `book` | `~icons/lucide/book-open` | `IconBookOpen` |
| `sun_max` | `~icons/lucide/sun` | `IconSun` |
| `check_circle` (verified) | `~icons/lucide/circle-check` | `IconCircleCheck` |
| `event` (calendar) | `~icons/lucide/calendar` | `IconCalendar` |
| `schedule` (clock) | `~icons/lucide/clock` | `IconClock` |

## Size Mapping Reference

| F7 `size` attribute | Tailwind class |
|---|---|
| `size="12px"` | `class="w-3 h-3"` |
| `size="14px"` | `class="w-3.5 h-3.5"` |
| `size="16px"` | `class="w-4 h-4"` |
| `size="18px"` | `class="w-[18px] h-[18px]"` |
| `size="20px"` or `size="20"` | `class="w-5 h-5"` |
| `size="24px"` | `class="w-6 h-6"` |
| No size attr / text-* class | keep existing `class="text-*"` or add nothing |

Existing `class` attributes on `<f7-icon>` or `<i class="f7-icons">` must be preserved on the new `<IconName />` component. Append the size class if the old element had a `size` prop.

## Import Cleanup Rule

When replacing `<f7-icon>` in a file:
- Find the `import { ..., f7Icon, ... } from "framework7-vue"` line.
- Remove only `f7Icon` from the import list.
- If `f7Icon` was the **only** named import, remove the entire import statement.
- Leave all other framework7-vue imports untouched.

---

## Chunk 1: Foundation Components

### Task 1: EmptyState.vue — change icon prop to Component

**Files:**
- Modify: `src/components/ui/EmptyState.vue`

The current `icon: string` prop (default `"tray"`) is used as `{{ icon }}` inside `<i class="f7-icons">`. Change the prop to accept a Vue component, defaulting to `IconInbox`.

- [ ] **Replace `src/components/ui/EmptyState.vue` entirely:**

```vue
<template>
  <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
      <component :is="icon" class="text-[22px] text-muted-foreground" />
    </div>
    <p class="text-sm font-medium text-foreground mb-1">{{ title }}</p>
    <p v-if="description" class="text-sm text-muted-foreground mb-4">{{ description }}</p>
    <slot name="action" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import IconInbox from "~icons/lucide/inbox";

interface Props {
  icon?: Component;
  title: string;
  description?: string;
}

withDefaults(defineProps<Props>(), { icon: () => IconInbox });
</script>
```

- [ ] **Commit:**

```bash
git add src/components/ui/EmptyState.vue
git commit -m "refactor(icons): migrate EmptyState to unplugin-icons component prop"
```

---

### Task 2: Update EmptyState callers

**Files:**
- Modify: `src/components/Home/CalendarSchedulePanel.vue`
- Modify: `src/components/Cards/ScheduleCard.vue`

Both currently pass `icon="calendar"` (string). Change to `:icon="IconCalendar"` (component).

- [ ] **In `src/components/Home/CalendarSchedulePanel.vue`:**

Add to `<script setup>`:
```ts
import IconCalendar from "~icons/lucide/calendar";
```

Change template:
```diff
-      <EmptyState
-        v-else
-        icon="calendar"
-        title="Нет занятий на этот день"
-      />
+      <EmptyState
+        v-else
+        :icon="IconCalendar"
+        title="Нет занятий на этот день"
+      />
```

Also replace the two `<i class="f7-icons">` in the same file:
```diff
-            <i class="f7-icons text-sm">chevron_left</i>
+            <IconChevronLeft class="text-sm" />
```
```diff
-            <i class="f7-icons text-sm">chevron_right</i>
+            <IconChevronRight class="text-sm" />
```
Add imports:
```ts
import IconChevronLeft from "~icons/lucide/chevron-left";
import IconChevronRight from "~icons/lucide/chevron-right";
```

- [ ] **In `src/components/Cards/ScheduleCard.vue`:**

Add to `<script setup>`:
```ts
import IconCalendar from "~icons/lucide/calendar";
import IconChevronRight from "~icons/lucide/chevron-right";
```

Change template:
```diff
-    <EmptyState
-      v-else
-      icon="calendar"
-      title="Нет занятий на этот день"
-    />
+    <EmptyState
+      v-else
+      :icon="IconCalendar"
+      title="Нет занятий на этот день"
+    />
```

Replace icon in schedule arrow:
```diff
-          <i class="f7-icons text-muted-foreground group-hover:text-foreground"
-            >chevron_right</i
-          >
+          <IconChevronRight class="text-muted-foreground group-hover:text-foreground" />
```

- [ ] **Commit:**

```bash
git add src/components/Home/CalendarSchedulePanel.vue src/components/Cards/ScheduleCard.vue
git commit -m "refactor(icons): update EmptyState callers to use component icons"
```

---

### Task 3: NoData.vue — change icon prop to Component

**Files:**
- Modify: `src/components/ui/accordion/NoData.vue`

Current prop: `icon?: { ios: string; md: string }`. Change to `icon?: Component`, default `IconFileText`.

- [ ] **Replace `src/components/ui/accordion/NoData.vue` entirely:**

```vue
<template>
  <div class="flex flex-col items-center justify-center py-8 text-center">
    <div
      class="w-16 h-16 mb-4 flex items-center justify-center bg-muted/50 rounded-full"
    >
      <component :is="icon" class="w-6 h-6 text-muted-foreground" />
    </div>
    <h3 class="text-sm font-medium text-foreground mb-1">{{ title }}</h3>
    <p class="text-xs text-muted-foreground max-w-sm">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
import type { Component } from "vue";
import IconFileText from "~icons/lucide/file-text";

interface Props {
  title?: string;
  description?: string;
  icon?: Component;
}

const props = withDefaults(defineProps<Props>(), {
  title: "Нет данных",
  description: "Данные отсутствуют для выбранного учебного года",
  icon: () => IconFileText,
});
</script>
```

- [ ] **Commit:**

```bash
git add src/components/ui/accordion/NoData.vue
git commit -m "refactor(icons): migrate NoData to unplugin-icons component prop"
```

---

### Task 4: Update NoData callers in settings.vue

**Files:**
- Modify: `src/pages/settings.vue`

Find and update all 5 `<NoData :icon="{ ios: ..., md: ... }">` usages.

- [ ] **Add imports in `<script setup>` of `settings.vue`:**

```ts
import IconCalendar from "~icons/lucide/calendar";
import IconBookOpen from "~icons/lucide/book-open";
import IconGlobe from "~icons/lucide/globe";
import IconCircleCheck from "~icons/lucide/circle-check";
```

- [ ] **Replace 5 NoData icon props in `settings.vue`:**

```diff
- :icon="{ ios: 'f7:calendar', md: 'material:event' }"
+ :icon="IconCalendar"

- :icon="{ ios: 'f7:book', md: 'material:menu_book' }"
+ :icon="IconBookOpen"

- :icon="{ ios: 'f7:globe', md: 'material:language' }"
+ :icon="IconGlobe"

- :icon="{ ios: 'f7:check_circle', md: 'material:verified' }"   (×2)
+ :icon="IconCircleCheck"
```

Also replace the 5 `<f7-icon>` usages remaining in settings.vue (chevron up/down for accordion toggle button):

Line ~37–46 currently:
```vue
<f7-icon
  :ios="areAllExpanded ? 'f7:chevron_up' : 'f7:chevron_down'"
  :md="areAllExpanded ? 'material:expand_less' : 'material:expand_more'"
  size="16px"
  ck
/>
```
Replace with:
```vue
<component
  :is="areAllExpanded ? IconChevronUp : IconChevronDown"
  class="w-4 h-4"
/>
```
Add imports:
```ts
import IconChevronUp from "~icons/lucide/chevron-up";
import IconChevronDown from "~icons/lucide/chevron-down";
```

Remove `f7Icon` from the `framework7-vue` import in settings.vue.

- [ ] **Commit:**

```bash
git add src/pages/settings.vue
git commit -m "refactor(icons): migrate settings.vue icons to unplugin-icons"
```

---

### Task 5: Update NoData callers in EducationSchedule.vue

**Files:**
- Modify: `src/pages/EducationSchedule.vue`

5 `<NoData :icon="{ ... }">` usages + f7-icon usages.

- [ ] **Add imports in `<script setup>` of `EducationSchedule.vue`:**

```ts
import IconCalendar from "~icons/lucide/calendar";
import IconClock from "~icons/lucide/clock";
import IconSun from "~icons/lucide/sun";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconPlus from "~icons/lucide/plus";
import IconTrash from "~icons/lucide/trash-2";
import IconPencil from "~icons/lucide/pencil";
import IconX from "~icons/lucide/x";
import IconFileDown from "~icons/lucide/file-down";
```

- [ ] **Replace 5 NoData icon props:**

```diff
- :icon="{ ios: 'f7:calendar', md: 'material:event' }"
+ :icon="IconCalendar"

- :icon="{ ios: 'f7:clock', md: 'material:schedule' }"
+ :icon="IconClock"

- :icon="{ ios: 'f7:sun_max', md: 'material:beach_access' }"
+ :icon="IconSun"

- :icon="{ ios: 'f7:check_circle', md: 'material:verified' }"   (×2)
+ :icon="IconCircleCheck"
```

- [ ] **Replace remaining `<f7-icon>` usages in EducationSchedule.vue.** Read the file first to find each one, then apply the size mapping table. Common patterns expected:
  - `ios="f7:plus" md="material:add" size="16px"` → `<IconPlus class="w-4 h-4" />`
  - `ios="f7:trash" md="material:delete"` → `<IconTrash />`
  - `ios="f7:pencil" md="material:edit"` → `<IconPencil />`
  - `ios="f7:xmark" md="material:close"` → `<IconX />`
  - `ios="f7:arrow_down_doc"` → `<IconFileDown />`

Remove `f7Icon` from the `framework7-vue` import.

- [ ] **Commit:**

```bash
git add src/pages/EducationSchedule.vue
git commit -m "refactor(icons): migrate EducationSchedule.vue icons to unplugin-icons"
```

---

### Task 6: FabActions.vue

**Files:**
- Modify: `src/components/FabActions.vue`

Current content:
```vue
<f7-icon ios="f7:plus" md="material:add" class="text-white"></f7-icon>
<f7-icon ios="f7:xmark" md="material:close" class="text-white"></f7-icon>
```

- [ ] **Replace `src/components/FabActions.vue` entirely:**

```vue
<template>
  <f7-fab position="right-bottom" class="mb-6 mr-6">
    <IconPlus class="text-white" />
    <IconX class="text-white" />
  </f7-fab>
</template>

<script setup lang="ts">
import { f7Fab } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import IconX from "~icons/lucide/x";
</script>
```

- [ ] **Commit:**

```bash
git add src/components/FabActions.vue
git commit -m "refactor(icons): migrate FabActions.vue to unplugin-icons"
```

---

### Task 7: PopoverHeader.vue, UnsavedChangesDialog.vue, AccordionItem.vue

**Files:**
- Modify: `src/components/ui/PopoverHeader.vue`
- Modify: `src/components/ui/UnsavedChangesDialog.vue`
- Modify: `src/components/ui/accordion/AccordionItem.vue`

**PopoverHeader.vue** — one icon:
```diff
- <f7-icon ios="f7:xmark" md="material:close" size="16px" />
+ <IconX class="w-4 h-4" />
```
Add: `import IconX from "~icons/lucide/x";`
Remove `f7Icon` from framework7-vue import.

**UnsavedChangesDialog.vue** — one icon:
```diff
- <f7-icon ios="f7:exclamationmark_triangle_fill" md="material:warning" size="20" />
+ <IconTriangleAlert class="w-5 h-5" />
```
Add: `import IconTriangleAlert from "~icons/lucide/triangle-alert";`
Remove `f7Icon` from framework7-vue import (entire import line, as it's the only import).

**AccordionItem.vue** — conditional chevron:
```diff
- <f7-icon
-   :ios="isExpanded ? 'f7:chevron_down' : 'f7:chevron_right'"
-   :md="isExpanded ? 'material:expand_more' : 'material:chevron_right'"
-   size="14px"
-   class="mr-1 md:mr-2 text-foreground/60"
- ></f7-icon>
+ <component
+   :is="isExpanded ? IconChevronDown : IconChevronRight"
+   class="w-3.5 h-3.5 mr-1 md:mr-2 text-foreground/60"
+ />
```
Add:
```ts
import IconChevronDown from "~icons/lucide/chevron-down";
import IconChevronRight from "~icons/lucide/chevron-right";
```
Remove `f7Icon` from framework7-vue import.

- [ ] **Apply all three changes.**

- [ ] **Commit:**

```bash
git add src/components/ui/PopoverHeader.vue src/components/ui/UnsavedChangesDialog.vue src/components/ui/accordion/AccordionItem.vue
git commit -m "refactor(icons): migrate ui accordion/dialog icons to unplugin-icons"
```

---

### Task 8: Input.vue

**Files:**
- Modify: `src/components/ui/Input.vue`

Three icons:
1. `<f7-icon f7="checkmark_alt" class="text-green-500">` inside `#media` slot
2. `<f7-icon f7="arrow_down" class="text-base">` distribute button
3. `<f7-icon f7="square_on_square" class="text-lg">` copy button

- [ ] **Apply changes to `src/components/ui/Input.vue`:**

Add imports to `<script setup>`:
```ts
import IconCheck from "~icons/lucide/check";
import IconArrowDown from "~icons/lucide/arrow-down";
import IconCopy from "~icons/lucide/copy";
```

Template replacements:
```diff
- <f7-icon f7="checkmark_alt" class="text-green-500"></f7-icon>
+ <IconCheck class="text-green-500" />
```
```diff
- <f7-icon f7="arrow_down" class="text-base"></f7-icon>
+ <IconArrowDown class="text-base" />
```
```diff
- <f7-icon f7="square_on_square" class="text-lg"></f7-icon>
+ <IconCopy class="text-lg" />
```

Remove `f7Icon` from the framework7-vue import (keep `f7Input`, `f7Button`).

- [ ] **Commit:**

```bash
git add src/components/ui/Input.vue
git commit -m "refactor(icons): migrate Input.vue icons to unplugin-icons"
```

---

## Chunk 2: Calendar Components

### Task 9: Calendar small components

**Files:**
- Modify: `src/components/Calendar/AddEventButton.vue`
- Modify: `src/components/Calendar/MonthNavigator.vue`
- Modify: `src/components/Calendar/SearchInput.vue`

**AddEventButton.vue** — `<i class="f7-icons text-[16px]">plus</i>`:
Add: `import IconPlus from "~icons/lucide/plus";`
Replace: `<IconPlus class="text-[16px]" />`
No framework7-vue import to clean up.

**MonthNavigator.vue** — two chevrons:
```diff
- <i class="f7-icons text-muted-foreground text-sm">chevron_left</i>
+ <IconChevronLeft class="text-muted-foreground text-sm" />

- <i class="f7-icons text-muted-foreground text-sm">chevron_right</i>
+ <IconChevronRight class="text-muted-foreground text-sm" />
```
Add imports: `IconChevronLeft`, `IconChevronRight`.

**SearchInput.vue** — 4 icons (search, search, xmark, unknown):

Read `src/components/Calendar/SearchInput.vue` first to find all icons, then apply:
- `search` → `<IconSearch />`
- `xmark` → `<IconX />`
- Any others per mapping table.

Add needed imports. Remove `f7Icon` if present.

- [ ] **Apply all three files.**

- [ ] **Commit:**

```bash
git add src/components/Calendar/AddEventButton.vue src/components/Calendar/MonthNavigator.vue src/components/Calendar/SearchInput.vue
git commit -m "refactor(icons): migrate Calendar small components to unplugin-icons"
```

---

### Task 10: Calendar EventForm, EditEventPopover, JournalPreviewPopover

**Files:**
- Modify: `src/components/Calendar/EventForm.vue`
- Modify: `src/components/Calendar/EditEventPopover.vue`
- Modify: `src/components/Calendar/JournalPreviewPopover.vue`

**EventForm.vue** — 2 `<i class="f7-icons text-muted-foreground ml-1">chevron_right</i>`:
Add: `import IconChevronRight from "~icons/lucide/chevron-right";`
Replace both: `<IconChevronRight class="text-muted-foreground ml-1" />`

**EditEventPopover.vue** — 1 trash icon:
Read file first. Replace `ios="f7:trash" md="material:delete"` → `<IconTrash />` with appropriate size.
Add: `import IconTrash from "~icons/lucide/trash-2";`

**JournalPreviewPopover.vue** — pencil icon:
`ios="f7:pencil" md="material:edit" size="20px"` → `<IconPencil class="w-5 h-5" />`
Add: `import IconPencil from "~icons/lucide/pencil";`

Remove `f7Icon` from framework7-vue imports in each file as applicable.

- [ ] **Read each file, apply changes, verify.**

- [ ] **Commit:**

```bash
git add src/components/Calendar/EventForm.vue src/components/Calendar/EditEventPopover.vue src/components/Calendar/JournalPreviewPopover.vue
git commit -m "refactor(icons): migrate Calendar form/popover icons to unplugin-icons"
```

---

### Task 11: AddEventWizard.vue

**Files:**
- Modify: `src/components/Calendar/AddEventWizard.vue`

5 icon usages: `xmark`, `chevron_right`, and one more. Read the file to confirm all.

- [ ] **Read `src/components/Calendar/AddEventWizard.vue`, find all icon usages.**

Expected pattern: `<i class="f7-icons text-sm">xmark</i>` (×2), `<i class="f7-icons text-muted-foreground ml-1">chevron_right</i>`, `<i class="f7-icons text-sm text-muted-foreground">` (some icon).

- [ ] **Add imports per mapping table, replace all `<i class="f7-icons">` elements.**

- [ ] **Commit:**

```bash
git add src/components/Calendar/AddEventWizard.vue
git commit -m "refactor(icons): migrate AddEventWizard.vue icons to unplugin-icons"
```

---

## Chunk 3: Header and Search Components

### Task 12: Header.vue

**Files:**
- Modify: `src/components/Header/Header.vue`

3 icons: `bell`, `person_circle_fill`, `chevron_down` (all `<i class="icon f7-icons ...">`)

- [ ] **Add imports to `<script setup>`:**

```ts
import IconBell from "~icons/lucide/bell";
import IconCircleUser from "~icons/lucide/circle-user";
import IconChevronDown from "~icons/lucide/chevron-down";
```

- [ ] **Replace in template:**

```diff
- <i class="icon f7-icons text-[22px]">bell</i>
+ <IconBell class="text-[22px]" />
```
```diff
- <i class="icon f7-icons">person_circle_fill</i>
+ <IconCircleUser />
```
```diff
- <i class="icon f7-icons text-[14px] text-muted-foreground">chevron_down</i>
+ <IconChevronDown class="text-[14px] text-muted-foreground" />
```

Remove `f7` import from framework7-vue only if it's exclusively `f7` (not a store/router usage). Note: Header.vue uses `f7.popover.open` — do NOT remove the `f7` import, only remove `f7Icon` if it was imported. Check the actual import line.

- [ ] **Commit:**

```bash
git add src/components/Header/Header.vue
git commit -m "refactor(icons): migrate Header.vue icons to unplugin-icons"
```

---

### Task 13: SearchBar.vue

**Files:**
- Modify: `src/components/SearchBar.vue`

1 icon usage in template: `<i class="f7-icons text-white text-sm">{{ ... }}</i>` (dynamic icon name inside).

- [ ] **Read `src/components/SearchBar.vue` to find the full icon usage context.**

If the icon name is hardcoded (e.g., always `search`), replace with `<IconSearch class="text-white text-sm" />`. If it is genuinely dynamic, use `@iconify/vue`'s `Icon` component as a fallback:

```ts
import { Icon } from "@iconify/vue";
// Usage: <Icon :icon="`lucide:${iconName}`" class="text-white text-sm" />
```

- [ ] **Apply the appropriate replacement.**

- [ ] **Commit:**

```bash
git add src/components/SearchBar.vue
git commit -m "refactor(icons): migrate SearchBar.vue icons to unplugin-icons"
```

---

## Chunk 4: Add* Button Components

All `Add*Button.vue` components use the same pattern: `<f7-icon ios="f7:plus" md="material:add" size="16px" class="text-white" />` → `<IconPlus class="w-4 h-4 text-white" />`.

### Task 14: Simple Add* buttons (plus icon only)

**Files** (all use only `plus`/`add`):
- `src/components/AddAcademicYearButton.vue`
- `src/components/AddCourseButton.vue`
- `src/components/AddDisciplineButton.vue`
- `src/components/AddEducationScheduleButton.vue`
- `src/components/AddFinalControlButton.vue`
- `src/components/AddIntermediateControlButton.vue`
- `src/components/AddKtpDialog.vue`
- `src/components/AddLanguageButton.vue`
- `src/components/AddScheduledFinalControlButton.vue`
- `src/components/AddScheduledIntermediateControlButton.vue`
- `src/components/AddSemesterButton.vue`
- `src/components/AddSessionButton.vue`
- `src/components/AddSpecialtyButton.vue`
- `src/components/AddStudentButton.vue`
- `src/components/AddTeacherButton.vue`
- `src/components/AddVacationButton.vue`
- `src/components/AddWorkingPlanDialog.vue`
- `src/components/AddAcademicYearSemesterButton.vue`

For each file:

- [ ] **Add import:**
```ts
import IconPlus from "~icons/lucide/plus";
```

- [ ] **Replace `<f7-icon ios="f7:plus" md="material:add" size="16px" class="text-white" />`:**
```vue
<IconPlus class="w-4 h-4 text-white" />
```

(Some files may use `size="16px"` without `class="text-white"` — preserve existing class, just append `w-4 h-4`.)

- [ ] **Remove `f7Icon` from each file's `framework7-vue` import.**

- [ ] **Commit after all 18 files:**

```bash
git add src/components/Add*.vue
git commit -m "refactor(icons): migrate Add* button components to unplugin-icons"
```

---

### Task 15: ImportWorkingPlanDialog.vue and CopyEducationScheduleButton.vue

**Files:**
- Modify: `src/components/ImportWorkingPlanDialog.vue`
- Modify: `src/components/CopyEducationScheduleButton.vue`

**ImportWorkingPlanDialog.vue** — `ios="f7:arrow_down_doc" md="material:file_upload"`:
```diff
- <f7-icon ios="f7:arrow_down_doc" md="material:file_upload" />
+ <IconFileDown />
```
Add: `import IconFileDown from "~icons/lucide/file-down";`

**CopyEducationScheduleButton.vue** — `ios="f7:doc_on_doc" md="material:content_copy"` and `ios="f7:checkmark_circle_fill" md="material:check_circle"`:
```diff
- <f7-icon ios="f7:doc_on_doc" md="material:content_copy" />
+ <IconCopy />

- <f7-icon ios="f7:checkmark_circle_fill" md="material:check_circle" size="..." />
+ <IconCircleCheck class="..." />   (preserve size and class)
```
Add: `import IconCopy from "~icons/lucide/copy";`, `import IconCircleCheck from "~icons/lucide/circle-check";`

Read both files first to confirm exact attributes.

- [ ] **Apply changes.**

- [ ] **Commit:**

```bash
git add src/components/ImportWorkingPlanDialog.vue src/components/CopyEducationScheduleButton.vue
git commit -m "refactor(icons): migrate import/copy button icons to unplugin-icons"
```

---

## Chunk 5: Edit* Button Components

### Task 16: Edit* buttons with trash icon

All `Edit*Button.vue` components that have a delete/trash action use `ios="f7:trash" md="material:delete"`. They may also have other icons (pencil for edit action).

**Files:**
- `src/components/EditAcademicYearButton.vue`
- `src/components/EditAcademicYearSemesterButton.vue`
- `src/components/EditCourseButton.vue`
- `src/components/EditDisciplineButton.vue`
- `src/components/EditFinalControlButton.vue`
- `src/components/EditIntermediateControlButton.vue`
- `src/components/EditLanguageButton.vue`
- `src/components/EditScheduledFinalControlButton.vue`
- `src/components/EditScheduledIntermediateControlButton.vue`
- `src/components/EditSemesterButton.vue`
- `src/components/EditSessionButton.vue`
- `src/components/EditSpecialtyButton.vue`
- `src/components/EditStudentButton.vue`
- `src/components/EditTeacherButton.vue`
- `src/components/EditVacationButton.vue`

For each file:
- [ ] **Read the file to find all icon usages and their size/class attributes.**
- [ ] **Replace per mapping table, adding imports.**
- [ ] **Remove `f7Icon` from framework7-vue import.**

Common replacements needed:
- `ios="f7:trash" md="material:delete" size="18px"` → `<IconTrash class="w-[18px] h-[18px]" />`
- `ios="f7:trash" md="material:delete"` (no size) → `<IconTrash />`
- `ios="f7:pencil" md="material:edit"` → `<IconPencil />`
- Others per mapping table.

Required imports: `import IconTrash from "~icons/lucide/trash-2";` and any others per file.

- [ ] **Commit:**

```bash
git add src/components/Edit*.vue
git commit -m "refactor(icons): migrate Edit* button components to unplugin-icons"
```

---

### Task 17: EditCourseButton.vue — additional icons

`EditCourseButton.vue` may have icons beyond trash. Read and handle all.

(Fold into Task 16 if the file only has `trash`.)

---

## Chunk 6: Remaining Components

### Task 18: ModuleTable.vue

**Files:**
- Modify: `src/components/ModuleTable.vue`

5 icons: `pencil`, `table`, `xmark_circle` (×2), `plus`.

- [ ] **Read `src/components/ModuleTable.vue` to find size attributes.**

- [ ] **Add imports:**
```ts
import IconPencil from "~icons/lucide/pencil";
import IconTable from "~icons/lucide/table";
import IconCircleX from "~icons/lucide/circle-x";
import IconPlus from "~icons/lucide/plus";
```

- [ ] **Replace all `<f7-icon>` usages (apply size mapping table).**

- [ ] **Remove `f7Icon` from framework7-vue import.**

- [ ] **Commit:**

```bash
git add src/components/ModuleTable.vue
git commit -m "refactor(icons): migrate ModuleTable.vue icons to unplugin-icons"
```

---

### Task 19: JournalTab.vue

**Files:**
- Modify: `src/components/JournalTab.vue`

10 icons + 1 share. Read the file to find exact usages.

- [ ] **Read `src/components/JournalTab.vue`.**

- [ ] **Add imports per mapping table, replace all `<f7-icon>` usages.**

- [ ] **Remove `f7Icon` from framework7-vue import.**

- [ ] **Commit:**

```bash
git add src/components/JournalTab.vue
git commit -m "refactor(icons): migrate JournalTab.vue icons to unplugin-icons"
```

---

### Task 20: KtpDetailPopupBody.vue, KtpDetailPopup.vue, KtpDetailFormPopover.vue

**Files:**
- Modify: `src/components/KtpDetailPopupBody.vue`
- Modify: `src/components/KtpDetailPopup.vue`
- Modify: `src/components/KtpDetailFormPopover.vue`

**KtpDetailPopupBody.vue** — 7 icons: `arrow_down_doc`, `arrow_up_doc`, `square_arrow_down`, `square_arrow_up`, and others. Read to confirm.

**KtpDetailPopup.vue** — `trash`.

**KtpDetailFormPopover.vue** — `trash`.

- [ ] **Read each file, add imports, replace icons.**

- [ ] **Commit:**

```bash
git add src/components/KtpDetailPopupBody.vue src/components/KtpDetailPopup.vue src/components/KtpDetailFormPopover.vue
git commit -m "refactor(icons): migrate Ktp components icons to unplugin-icons"
```

---

### Task 21: IndividualJournalPopup.vue, Class9Popup.vue, Class11Table.vue

**Files:**
- Modify: `src/components/IndividualJournalPopup.vue`
- Modify: `src/components/Class9Popup.vue`
- Modify: `src/components/Class11Table.vue`

**IndividualJournalPopup.vue** — `xmark` size 16px, `trash` size 18px.

**Class9Popup.vue** — 9 icons: `trash`, `globe`, `arrow_down` (×3), `plus`. Read to find sizes.

**Class11Table.vue** — `doc_text`/`description`.

- [ ] **Read each file, add imports, replace icons.**

- [ ] **Commit:**

```bash
git add src/components/IndividualJournalPopup.vue src/components/Class9Popup.vue src/components/Class11Table.vue
git commit -m "refactor(icons): migrate Class/Journal popup icons to unplugin-icons"
```

---

### Task 22: Home and Cards components

**Files:**
- Modify: `src/components/Home/StatsRow.vue`
- Modify: `src/components/Home/QuickActionsCard.vue`
- Modify: `src/components/Cards/ActivityCard.vue`
- Modify: `src/components/Cards/AnnouncementsCard.vue`
- Modify: `src/components/Cards/JournalCard.vue`
- Modify: `src/components/Cards/CalendarCard.vue`
- Modify: `src/components/AiAssistantFab.vue`

**StatsRow.vue** — 3 `<i class="f7-icons text-xl">` icons: `person_2_fill`, `calendar`, `chart_bar_fill`.

**QuickActionsCard.vue** — 6 icons: `doc_chart_fill`, `megaphone_fill`, `chevron_right`.

**ActivityCard.vue, AnnouncementsCard.vue, JournalCard.vue, CalendarCard.vue** — read each to find exact icons.

**AiAssistantFab.vue** — `ios="f7:sparkles" md="material:smart_toy"` → `<IconSparkles />`.

- [ ] **Read each file, add imports, replace icons.**

- [ ] **Commit:**

```bash
git add src/components/Home/StatsRow.vue src/components/Home/QuickActionsCard.vue src/components/Cards/ActivityCard.vue src/components/Cards/AnnouncementsCard.vue src/components/Cards/JournalCard.vue src/components/Cards/CalendarCard.vue src/components/AiAssistantFab.vue
git commit -m "refactor(icons): migrate Home/Cards component icons to unplugin-icons"
```

---

### Task 23: Misc components

**Files:**
- Modify: `src/components/JournalHeader.vue`
- Modify: `src/components/ErrorDisplay.vue`
- Modify: `src/components/ColumnConfigForm.vue`
- Modify: `src/components/DownloadTemplateDialog.vue`
- Modify: `src/components/ui/TagsSelector.vue`
- Modify: `src/components/ui/accordion/NoData.vue` (already done in Task 3)

Read each file to find exact icon usages, apply mapping table, commit.

- [ ] **Read each file.**

- [ ] **Replace icons, add imports, remove `f7Icon` where applicable.**

- [ ] **Commit:**

```bash
git add src/components/JournalHeader.vue src/components/ErrorDisplay.vue src/components/ColumnConfigForm.vue src/components/DownloadTemplateDialog.vue src/components/ui/TagsSelector.vue
git commit -m "refactor(icons): migrate misc component icons to unplugin-icons"
```

---

## Chunk 7: Page Files

### Task 24: notifications.vue

**Files:**
- Modify: `src/pages/notifications.vue`

8 `<i class="icon f7-icons ...">` usages: `exclamationmark_triangle_fill`, `bell_slash`, `arrow_2_squarepath`, `checkmark_circle_fill`, `xmark_circle_fill`, `checkmark_circle`, `calendar_badge_exclamationmark`, `info_circle_fill`.

- [ ] **Add imports:**
```ts
import IconTriangleAlert from "~icons/lucide/triangle-alert";
import IconBellOff from "~icons/lucide/bell-off";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconCircleX from "~icons/lucide/circle-x";
import IconCalendarX from "~icons/lucide/calendar-x";
import IconInfo from "~icons/lucide/info";
```

- [ ] **Read the file, replace each `<i class="icon f7-icons ...">` with the appropriate icon component, preserving all class attributes.**

- [ ] **Commit:**

```bash
git add src/pages/notifications.vue
git commit -m "refactor(icons): migrate notifications.vue icons to unplugin-icons"
```

---

### Task 25: analytics.vue

**Files:**
- Modify: `src/pages/analytics.vue`

9 `<f7-icon>` usages. Read the file to find all icon names and sizes.

- [ ] **Read `src/pages/analytics.vue`, identify all icons.**

- [ ] **Add imports, replace usages, remove `f7Icon` from import.**

- [ ] **Commit:**

```bash
git add src/pages/analytics.vue
git commit -m "refactor(icons): migrate analytics.vue icons to unplugin-icons"
```

---

### Task 26: rup.vue

**Files:**
- Modify: `src/pages/rup.vue`

6 `<f7-icon>` usages. Includes `ios="f7:xmark" md="material:close" size="20px"` and others.

- [ ] **Read `src/pages/rup.vue`, identify all icons.**

- [ ] **Add imports, replace usages, remove `f7Icon` from import.**

- [ ] **Commit:**

```bash
git add src/pages/rup.vue
git commit -m "refactor(icons): migrate rup.vue icons to unplugin-icons"
```

---

### Task 27: journals.vue

**Files:**
- Modify: `src/pages/journals.vue`

15 `<f7-icon>` usages. Read to find all icon names/sizes.

- [ ] **Read `src/pages/journals.vue`, identify all icons.**

- [ ] **Add imports, replace usages, remove `f7Icon` from import.**

- [ ] **Commit:**

```bash
git add src/pages/journals.vue
git commit -m "refactor(icons): migrate journals.vue icons to unplugin-icons"
```

---

### Task 28: KtpPage.vue, profile.vue, home.vue

**Files:**
- Modify: `src/pages/KtpPage.vue`
- Modify: `src/pages/profile.vue`

**profile.vue** — `<i class="icon f7-icons">person_circle_fill</i>` → `<IconCircleUser />`.

**KtpPage.vue** — 1 icon. Read to find it.

- [ ] **Read each file, replace icons, add imports.**

- [ ] **Commit:**

```bash
git add src/pages/KtpPage.vue src/pages/profile.vue
git commit -m "refactor(icons): migrate profile/KtpPage icons to unplugin-icons"
```

---

### Task 29: TeacherCard.vue

**Files:**
- Modify: `src/pages/TeacherCard.vue`

**Special case:** The file has 1 `<f7-icon>` in the template and 2 HTML strings used in Framework7 action sheet buttons that contain `<i class="f7-icons">` tags. Since `framework7-icons` will be removed, the icon font won't load — strip the `<i class="f7-icons">` elements from those strings.

- [ ] **Read `src/pages/TeacherCard.vue` template section for the `<f7-icon>` usage.**

- [ ] **Replace the template `<f7-icon>` per mapping table.**

- [ ] **In the `openActionsMenu` function, update the button text strings:**

```diff
- text: '<div class="flex items-center gap-3"><i class="f7-icons">arrow_clockwise</i><span>Обновить пароль</span></div>',
+ text: 'Обновить пароль',

- text: '<div class="flex items-center gap-3"><i class="f7-icons">clock</i><span>История изменений</span></div>',
+ text: 'История изменений',
```

- [ ] **Remove `f7Icon` from framework7-vue import.**

- [ ] **Commit:**

```bash
git add src/pages/TeacherCard.vue
git commit -m "refactor(icons): migrate TeacherCard.vue icons to unplugin-icons"
```

---

### Task 29b: JournalGridCard.vue and EditEducationScheduleButton.vue

**Files:**
- Modify: `src/components/Cards/JournalGridCard.vue`
- Modify: `src/components/EditEducationScheduleButton.vue`

**JournalGridCard.vue** — 2 icons:
- `ios="f7:checkmark" md="material:check" size="14px" class="text-white"` → `<IconCheck class="w-3.5 h-3.5 text-white" />`
- `ios="f7:chevron_right" md="material:chevron_right" size="12px"` → `<IconChevronRight class="w-3 h-3" />`

Add:
```ts
import IconCheck from "~icons/lucide/check";
import IconChevronRight from "~icons/lucide/chevron-right";
```

**EditEducationScheduleButton.vue** — 1 icon:
- `ios="f7:trash" md="material:delete" size="18px" class="mr-2"` → `<IconTrash class="w-[18px] h-[18px] mr-2" />`

Add:
```ts
import IconTrash from "~icons/lucide/trash-2";
```

Remove `f7Icon` from framework7-vue imports in both files.

- [ ] **Read both files to confirm exact attributes, then apply changes.**

- [ ] **Commit:**

```bash
git add src/components/Cards/JournalGridCard.vue src/components/EditEducationScheduleButton.vue
git commit -m "refactor(icons): migrate JournalGridCard and EditEducationScheduleButton icons"
```

---

## Chunk 8: Cleanup and Verification

### Task 30: Remove framework7-icons from package.json

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

- [ ] **In `package.json`, remove the `framework7-icons` line from `dependencies`:**

```diff
-    "framework7-icons": "^5.0.5",
```

- [ ] **In `vite.config.js`, update the `framework7` chunk group to no longer reference `framework7-icons`:**

```diff
- test: /node_modules\/(framework7|framework7-vue|framework7-icons)/,
+ test: /node_modules\/(framework7|framework7-vue)/,
```

- [ ] **Commit:**

```bash
git add package.json vite.config.js
git commit -m "chore: remove framework7-icons dependency"
```

---

### Task 31: Verify no F7 icon references remain

- [ ] **Search for remaining f7-icon and f7-icons usages:**

```bash
grep -r "f7-icons\|f7Icon\|f7:.*ios=\|ios=\"f7:" src/ --include="*.vue" --include="*.ts"
```

Expected output: empty (no matches).

- [ ] **Search for remaining framework7-icons imports:**

```bash
grep -r "framework7-icons" src/ package.json
```

Expected: no matches in `src/`, only possibly in `node_modules` (which is fine until `npm install`).

- [ ] **Run the build to confirm no errors:**

```bash
npm run build
```

Expected: Build succeeds with no errors. The `framework7` chunk in the output should be smaller since it no longer includes the icons font (~600KB).

- [ ] **Run `npm install` to uninstall `framework7-icons`:**

```bash
npm install
```

- [ ] **Commit any package-lock.json changes:**

```bash
git add package-lock.json
git commit -m "chore: sync lockfile after removing framework7-icons"
```

---

### Task 32: Check material-icons dependency

- [ ] **Check if `material-icons` package is still needed:**

```bash
grep -r "material-icons" src/ --include="*.vue" --include="*.ts" --include="*.css"
```

If no results in `src/`, check if it's imported in CSS:

```bash
grep -r "material-icons" src/css/
```

- [ ] **If unused, remove from `package.json` as well.**

```diff
-    "material-icons": "^1.13.14",
```

- [ ] **Commit if removed:**

```bash
git add package.json
git commit -m "chore: remove unused material-icons dependency"
```
