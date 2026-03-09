# Port Concept Header Design Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Port the visual header design from `1-руп-и-каталог-дисциплин-fresh/components/Header.tsx` into the Vue project's Header, ThemeToggle, and LanguageSelector components.

**Architecture:** Three existing Vue components are updated in-place — no new files. All colors stay token-based (`bg-card`, `bg-muted`, `text-foreground`, etc.) so all three themes (light, dark, lavanda) just work. No logic changes, only visual style changes.

**Tech Stack:** Vue 3, Tailwind CSS, CSS custom properties (HSL design tokens), Framework7-Vue (f7-icons)

---

### Task 1: Redesign ThemeToggle.vue — text buttons → color dots pill

**Files:**
- Modify: `src/components/ThemeToggle.vue`

**Step 1: Implement new template and style**

Replace the entire file content with:

```vue
<!-- ThemeToggle.vue -->
<template>
  <div class="flex items-center gap-2 p-1.5 rounded-full border border-border bg-card shadow-sm">
    <button
      v-for="t in themes"
      :key="t.value"
      :title="t.label"
      class="w-5 h-5 rounded-full border border-border/60 transition-transform hover:scale-110 flex items-center justify-center flex-shrink-0"
      :class="themeStore.currentTheme === t.value ? 'ring-2 ring-offset-1 ring-primary scale-110' : ''"
      :style="{ backgroundColor: t.color }"
      @click="themeStore.setTheme(t.value)"
    >
      <svg
        v-if="themeStore.currentTheme === t.value"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="w-2.5 h-2.5"
        :class="t.value === 'dark' ? 'text-white' : 'text-gray-600'"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from "../stores/themeStore";

const themeStore = useThemeStore();

const themes = [
  { value: 'light',   color: '#ffffff',  label: 'Светлая' },
  { value: 'dark',    color: '#1f2937',  label: 'Темная' },
  { value: 'lavanda', color: '#e9d5ff',  label: 'Лавандовая' },
] as const;
</script>
```

**Step 2: Verify visually** — open the app, confirm three color dots appear in header with ring on active theme, check mark inside active dot.

**Step 3: Commit**

```bash
git add src/components/ThemeToggle.vue
git commit -m "feat(header): replace text theme buttons with color dots pill"
```

---

### Task 2: Redesign LanguageSelector.vue — rect toggle → compact pill

**Files:**
- Modify: `src/components/LanguageSelector.vue`

**Step 1: Implement new template**

Replace the entire file content with:

```vue
<template>
  <div class="flex p-0.5 rounded-full bg-muted">
    <button
      v-for="lang in availableLanguages"
      :key="lang.code"
      class="px-3 py-1 rounded-full text-xs font-bold transition-all"
      :class="lang.code === activeLanguage
        ? 'bg-card text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground'"
      @click="setLanguage(lang.code)"
    >
      {{ lang.code.toUpperCase() }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useLanguage } from "@/composables/useLanguage";

const { activeLanguage, availableLanguages, setLanguage } = useLanguage();
</script>
```

Note: removed unused `theme` prop and `themeStore` — colors now come from design tokens automatically.

**Step 2: Verify visually** — confirm compact pill toggle (KZ/RU) renders in header, active language gets card bg + shadow, no red color.

**Step 3: Commit**

```bash
git add src/components/LanguageSelector.vue
git commit -m "feat(header): replace lang selector with compact pill toggle"
```

---

### Task 3: Refine Header.vue — height, frosted glass, separator, avatar polish

**Files:**
- Modify: `src/components/Header/Header.vue`

**Step 1: Update template** — add vertical separator between lang and theme, add chevron next to avatar, add `pill-hover` wrapper around avatar:

In `<div class="header-right">`, change the order and add separator between LanguageSelector and ThemeToggle:

```html
<div class="header-right">
  <div class="flex-shrink-0">
    <button
      id="notification-bell-button"
      @click="openNotificationCenter"
      class="relative p-2 rounded-full transition-colors hover:bg-primary/10 text-primary"
    >
      <i class="icon f7-icons text-[22px]">bell</i>
      <span
        v-if="unreadCount > 0"
        class="absolute top-1 right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center px-1"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>
  </div>
  <div class="flex-shrink-0 min-w-[100px]">
    <LanguageSelector />
  </div>
  <div class="h-6 w-px bg-border flex-shrink-0"></div>
  <div class="flex-shrink-0">
    <ThemeToggle />
  </div>
  <div class="avatar-container flex-shrink-0">
    <button class="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-muted transition-colors border border-transparent hover:border-border">
      <img
        v-if="userStore.currentUser?.avatar"
        :src="userStore.currentUser.avatar"
        alt="User Avatar"
        class="user-avatar"
      />
      <div v-else class="user-avatar-placeholder">
        <i class="icon f7-icons">person_circle_fill</i>
      </div>
      <i class="icon f7-icons text-[14px] text-muted-foreground">chevron_down</i>
    </button>
  </div>
</div>
```

**Step 2: Update `<style scoped>`** — reduce height to 64px, add frosted glass background:

```css
.desktop-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  height: 64px;
  border-bottom: 1px solid var(--border-color);
  background-color: hsl(var(--card) / 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  color: hsl(var(--card-foreground));
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
  transition: all 0.3s ease;
  width: 100%;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
}
```

Also remove the `.avatar-container:hover { transform: scale(1.05); }` rule — hover is now handled by the pill button wrapper.

Also remove the `LanguageSelector :theme` prop (no longer needed after Task 2).

**Step 3: Verify visually** — confirm 64px height, frosted glass on light/lavanda, separator shows between lang and theme, avatar has chevron and pill hover.

**Step 4: Commit**

```bash
git add src/components/Header/Header.vue
git commit -m "feat(header): polish header - frosted glass, 64px height, separator, avatar pill"
```

---

### Task 4: Smoke-test all three themes

**Step 1:** Open app, switch between light → dark → lavanda themes
- Light: frosted glass header, white dot active, compact KZ/RU pill
- Dark: solid dark card bg (backdrop-blur less visible but graceful), dark dot active
- Lavanda: frosted glass with lavanda purple active dot

**Step 2:** If any theme shows hardcoded colors (not from tokens), fix and commit.
