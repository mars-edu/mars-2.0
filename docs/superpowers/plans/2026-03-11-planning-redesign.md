# Планирование Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Планирование calendar page in `src/` to match the Apple-style design language from the `1-руп-и-каталог-дисциплин-fresh/` concept prototype.

**Architecture:** Port visual design from React concept to existing Vue 3 + CSS design token system. No logic changes — only UI/styling updates across 4 files. All hardcoded colors replaced with design tokens.

**Tech Stack:** Vue 3 SFC, Tailwind CSS, CSS custom properties (HSL design tokens), lucide-vue-next icons, Framework7-Vue.

---

## Files

- **Modify:** `src/pages/planning.vue` — add title/subtitle header above CalendarToolbar
- **Modify:** `src/components/Calendar/CalendarDay.vue` — today = `bg-primary`, add event count badge
- **Modify:** `src/components/Calendar/CalendarEvent.vue` — add Clock icon before time, bold title
- **Modify:** `src/components/Calendar/AddEventButton.vue` — `bg-primary` instead of `bg-green-500`

---

## Chunk 1: Page Header + Today Indicator + Event Badge

### Task 1: Add page title/subtitle to planning.vue

**Files:**
- Modify: `src/pages/planning.vue`

The concept renders a bold "Планирование" h1 + "Календарь занятий и мероприятий" subtitle above the calendar. Add this inside `.calendar-container`, before CalendarToolbar. Use design tokens.

- [ ] **Step 1: Edit planning.vue** — add title section before CalendarToolbar

```vue
<!-- inside .calendar-container, before CalendarToolbar -->
<div class="mb-4 px-1">
  <h1 class="text-2xl font-bold text-foreground tracking-tight">Планирование</h1>
  <p class="text-sm text-muted-foreground font-medium mt-0.5">Календарь занятий и мероприятий</p>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/planning.vue
git commit -m "feat(planning): add page title and subtitle header"
```

---

### Task 2: Fix today indicator color in CalendarDay.vue

**Files:**
- Modify: `src/components/Calendar/CalendarDay.vue`

The concept uses `bg-[#007AFF]` (blue) for today. Current code uses hardcoded `bg-red-500`. Replace with design tokens `bg-primary text-primary-foreground`.

Also add an event count badge (top-right of cell, visible when `day.events.length > 1`).

- [ ] **Step 1: Update CalendarDay.vue**

Replace today span:
```html
<!-- old -->
<span class="w-6 h-6 bg-red-500 rounded-lg inline-flex items-center justify-center font-black text-[11px] shadow-md">
```
```html
<!-- new -->
<span class="w-6 h-6 bg-primary text-primary-foreground rounded-lg inline-flex items-center justify-center font-black text-[11px] shadow-md">
```

Add event count badge in the date row (after today/number span):
```html
<span
  v-if="day.events.length > 0"
  class="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md"
>
  {{ day.events.length }}
</span>
```

Wrap date row and badge in a flex justify-between:
```html
<div class="flex justify-between items-start mb-1.5">
  <!-- day number (today or normal) -->
  <!-- badge -->
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Calendar/CalendarDay.vue
git commit -m "fix(calendar): use primary token for today, add event count badge"
```

---

## Chunk 2: Event Card + Create Button

### Task 3: Add Clock icon to CalendarEvent.vue

**Files:**
- Modify: `src/components/Calendar/CalendarEvent.vue`

The concept shows `<Clock size={10} />` before the time. Add Clock icon from lucide-vue-next. Also make title font-bold (concept uses `font-bold`).

- [ ] **Step 1: Update CalendarEvent.vue script** — import Clock

```vue
<script setup lang="ts">
import { Clock } from "lucide-vue-next";
// ... existing imports
</script>
```

- [ ] **Step 2: Update time display in template**

```html
<!-- old -->
<div class="text-opacity-80 truncate" :style="{ color: textColor }">
  {{ event.time }}
</div>

<!-- new -->
<div class="flex items-center gap-1 text-opacity-80" :style="{ color: textColor }">
  <Clock :size="10" />
  <span class="truncate">{{ event.time }}</span>
</div>
```

- [ ] **Step 3: Make title font-bold** — change `font-medium` to `font-bold` on title div

- [ ] **Step 4: Commit**

```bash
git add src/components/Calendar/CalendarEvent.vue
git commit -m "feat(calendar): add Clock icon to event time, bold title"
```

---

### Task 4: Use design token on AddEventButton

**Files:**
- Modify: `src/components/Calendar/AddEventButton.vue`

Project convention (MEMORY.md): Add buttons use `bg-primary hover:bg-primary/90`, not hardcoded green.

- [ ] **Step 1: Replace button classes**

```html
<!-- old -->
class="flex items-center gap-1.5 px-4 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-full transition-colors"

<!-- new -->
class="flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-full transition-colors"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Calendar/AddEventButton.vue
git commit -m "fix(calendar): use primary token for create button"
```
