# Sidebar Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the fixed-width icon+label sidebar with a collapsible sidebar (icon-only when collapsed, icons+labels when expanded) using toggle button on right edge, card-style active states, and lucide icons via unplugin-icons.

**Architecture:** New `useSidebar` composable holds collapse state (persisted to localStorage via `@vueuse/core`). `Sidebar.vue` is fully rewritten with dynamic width. All pages that currently use `ml-32` are updated to bind dynamic margin from `useSidebar`. A new `SidebarItem.vue` sub-component keeps the template clean.

**Tech Stack:** Vue 3, TypeScript, Tailwind CSS (design tokens), unplugin-icons + @iconify-json/lucide, @vueuse/core (useLocalStorage), Framework7 router

---

### Task 1: Install unplugin-icons and configure Vite

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`

**Step 1: Install packages**

```bash
cd /home/olge/SOFT/git/mars-2.0
npm install --save-dev unplugin-icons @iconify-json/lucide
```

Expected: packages added to devDependencies, no errors.

**Step 2: Add plugin to vite.config.js**

At the top of `vite.config.js`, add the import:

```js
import Icons from "unplugin-icons/vite";
```

Inside the `plugins` array (after the `vue()` plugin), add:

```js
Icons({
  compiler: "vue3",
  autoInstall: false,
}),
```

**Step 3: Add type declarations**

In `src/env.d.ts` (or create `src/icons.d.ts`), add:

```ts
/// <reference types="unplugin-icons/types/vue" />
```

**Step 4: Verify vite starts without errors**

```bash
cd /home/olge/SOFT/git/mars-2.0 && npm run dev
```

Expected: dev server starts, no TypeScript errors about icon imports.

**Step 5: Commit**

```bash
git add vite.config.js package.json package-lock.json src/env.d.ts
git commit -m "feat: add unplugin-icons with lucide collection"
```

---

### Task 2: Create useSidebar composable

**Files:**
- Create: `src/composables/useSidebar.ts`

**Step 1: Write the composable**

```ts
// src/composables/useSidebar.ts
import { useLocalStorage } from "@vueuse/core";
import { computed } from "vue";

const collapsed = useLocalStorage("sidebar-collapsed", false);

export function useSidebar() {
  const sidebarWidth = computed(() => (collapsed.value ? "w-16" : "w-64"));
  const contentMargin = computed(() => (collapsed.value ? "ml-16" : "ml-64"));

  function toggle() {
    collapsed.value = !collapsed.value;
  }

  return { collapsed, sidebarWidth, contentMargin, toggle };
}
```

Note: `collapsed` is defined at module scope so all callers share the same reactive ref (singleton pattern).

**Step 2: Commit**

```bash
git add src/composables/useSidebar.ts
git commit -m "feat: add useSidebar composable with localStorage persistence"
```

---

### Task 3: Create SidebarItem sub-component

**Files:**
- Create: `src/components/Sidebar/SidebarItem.vue`

**Step 1: Write the component**

```vue
<!-- src/components/Sidebar/SidebarItem.vue -->
<template>
  <div
    :title="collapsed ? label : undefined"
    class="group flex items-center gap-3 rounded-xl cursor-pointer transition-all duration-200 mx-2 px-3 py-2.5"
    :class="[
      active
        ? 'bg-card shadow-sm ring-1 ring-border text-foreground'
        : 'text-muted-foreground hover:text-foreground hover:bg-muted',
    ]"
    @click="$emit('click')"
  >
    <div class="flex-shrink-0 flex items-center justify-center w-5 h-5">
      <slot />
    </div>
    <span
      class="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-200"
      :class="collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'"
    >
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  active?: boolean;
  collapsed?: boolean;
}>();

defineEmits<{ (e: "click"): void }>();
</script>
```

**Step 2: Commit**

```bash
git add src/components/Sidebar/SidebarItem.vue
git commit -m "feat: add SidebarItem sub-component"
```

---

### Task 4: Rewrite Sidebar.vue

**Files:**
- Modify: `src/components/Sidebar/Sidebar.vue`

**Step 1: Write the icon map**

The icon imports use unplugin-icons virtual module syntax: `~icons/lucide/<IconName>`.
Each is a Vue component. They must be imported individually at the top of `<script setup>`.

Icon map (nav item id → lucide icon name):

| id | icon import |
|----|-------------|
| home | `~icons/lucide/house` |
| specialty-catalog | `~icons/lucide/graduation-cap` |
| discipline-catalog | `~icons/lucide/book-open` |
| schedule | `~icons/lucide/calendar` |
| protocol | `~icons/lucide/file-text` |
| journals | `~icons/lucide/clipboard-list` |
| rup | `~icons/lucide/layout-list` |
| analytics | `~icons/lucide/bar-chart-2` |
| reports | `~icons/lucide/file-bar-chart` |
| education-schedule | `~icons/lucide/calendar-days` |
| student-card | `~icons/lucide/users` |
| teacher-card | `~icons/lucide/user-check` |
| profile | `~icons/lucide/circle-user` |
| settings | `~icons/lucide/settings` |
| logout | `~icons/lucide/log-out` |

**Step 2: Write the full component**

Replace the entire contents of `src/components/Sidebar/Sidebar.vue`:

```vue
<template>
  <aside
    class="fixed top-[55px] left-0 bottom-0 bg-card border-r border-border overflow-visible z-50 shadow-sm transition-all duration-200"
    :class="sidebarWidth"
    style="display: grid; grid-template-rows: 1fr auto"
  >
    <!-- Toggle button on right edge -->
    <button
      class="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-card border border-border shadow-sm hover:bg-muted transition-colors"
      @click="toggle"
      :title="collapsed ? 'Развернуть' : 'Свернуть'"
    >
      <component
        :is="collapsed ? IconChevronRight : IconChevronLeft"
        class="w-3 h-3 text-muted-foreground"
      />
    </button>

    <!-- Nav items -->
    <div class="overflow-y-auto overflow-x-hidden w-full">
      <nav class="flex flex-col pt-4 pb-4 w-full">
        <SidebarItem
          v-for="item in navigationItems"
          :key="item.id"
          :label="item.label"
          :active="item.id === activeNavItem"
          :collapsed="collapsed"
          @click="handleNavItemClick(item.id)"
        >
          <component :is="navIconMap[item.id]" class="w-5 h-5" />
        </SidebarItem>
      </nav>
    </div>

    <!-- Profile / bottom items -->
    <div class="border-t border-border bg-card py-3 overflow-x-hidden">
      <SidebarItem
        v-for="item in profileMenuItems"
        :key="item.id"
        :label="item.label"
        :active="false"
        :collapsed="collapsed"
        @click="handleProfileItemClick(item.id)"
      >
        <component :is="profileIconMap[item.id]" class="w-5 h-5" />
      </SidebarItem>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from "vue";
import { useRBAC } from "@/composables/useRBAC";
import { useSidebar } from "@/composables/useSidebar";
import { f7 } from "framework7-vue";
import { useUserStore } from "@/stores/userStore";
import AuthService from "@/services/auth";
import type { NavigationItem } from "@/composables/useRBAC";
import SidebarItem from "./SidebarItem.vue";

// Lucide icons via unplugin-icons
import IconHouse from "~icons/lucide/house";
import IconGraduationCap from "~icons/lucide/graduation-cap";
import IconBookOpen from "~icons/lucide/book-open";
import IconCalendar from "~icons/lucide/calendar";
import IconFileText from "~icons/lucide/file-text";
import IconClipboardList from "~icons/lucide/clipboard-list";
import IconLayoutList from "~icons/lucide/layout-list";
import IconBarChart2 from "~icons/lucide/bar-chart-2";
import IconFileBarChart from "~icons/lucide/file-bar-chart";
import IconCalendarDays from "~icons/lucide/calendar-days";
import IconUsers from "~icons/lucide/users";
import IconUserCheck from "~icons/lucide/user-check";
import IconCircleUser from "~icons/lucide/circle-user";
import IconSettings from "~icons/lucide/settings";
import IconLogOut from "~icons/lucide/log-out";
import IconChevronLeft from "~icons/lucide/chevron-left";
import IconChevronRight from "~icons/lucide/chevron-right";

const navIconMap: Record<string, unknown> = {
  "home": IconHouse,
  "specialty-catalog": IconGraduationCap,
  "discipline-catalog": IconBookOpen,
  "schedule": IconCalendar,
  "protocol": IconFileText,
  "journals": IconClipboardList,
  "rup": IconLayoutList,
  "analytics": IconBarChart2,
  "reports": IconFileBarChart,
  "education-schedule": IconCalendarDays,
  "student-card": IconUsers,
  "teacher-card": IconUserCheck,
};

const profileIconMap: Record<string, unknown> = {
  "profile": IconCircleUser,
  "settings": IconSettings,
  "logout": IconLogOut,
};

interface Props {
  activeNavItem?: string;
}

const props = withDefaults(defineProps<Props>(), {
  activeNavItem: "home",
});

const { collapsed, sidebarWidth, toggle } = useSidebar();
const { getNavigationItems, getProfileMenuItems } = useRBAC();
const userStore = useUserStore();

const navigationItems = computed(() => getNavigationItems.value);
const profileMenuItems = computed(() => getProfileMenuItems.value);

const emit = defineEmits<{
  (e: "update:activeNavItem", value: string): void;
}>();

const activeNavItem = computed({
  get: () => props.activeNavItem,
  set: (value) => emit("update:activeNavItem", value),
});

const handleNavItemClick = (itemId: string): void => {
  activeNavItem.value = itemId;
  const item = navigationItems.value.find((item) => item.id === itemId);
  if (item && item.route) {
    f7.views.main.router.navigate(item.route);
  }
};

const handleProfileItemClick = async (itemId: string): Promise<void> => {
  if (itemId === "logout") {
    await AuthService.logout();
    f7.views.main.router.navigate("/login");
    return;
  }
  const item = profileMenuItems.value.find((item) => item.id === itemId);
  if (item && item.route) {
    f7.views.main.router.navigate(item.route);
  }
};

const updateActiveItem = () => {
  const currentPath = f7.views.main.router.currentRoute.path;
  const matchingItem = navigationItems.value.reduce((best, item) => {
    if (
      item.route &&
      currentPath.startsWith(item.route) &&
      item.route.length > (best?.route?.length || 0)
    ) {
      return item;
    }
    return best;
  }, null as NavigationItem | null);
  if (matchingItem) {
    activeNavItem.value = matchingItem.id;
  }
};

onMounted(() => {
  updateActiveItem();
  f7.views.main.router.on("routeChanged", updateActiveItem);
});

onUnmounted(() => {
  f7.views.main.router.off("routeChanged", updateActiveItem);
});
</script>
```

**Step 3: Commit**

```bash
git add src/components/Sidebar/Sidebar.vue
git commit -m "feat: rewrite Sidebar with collapsible toggle + lucide icons"
```

---

### Task 5: Update page content margins

**Problem:** All 18 pages/components use hardcoded `ml-32` to offset main content past the fixed sidebar. With a collapsible sidebar (w-16 collapsed, w-64 expanded), this needs to be dynamic.

**Pattern to apply:** In each page's desktop main content `<div>`, replace the static `ml-32` class with a dynamic binding using `useSidebar`.

**Files to modify (all have `ml-32`):**
- `src/pages/home.vue`
- `src/pages/rup.vue`
- `src/pages/JournalDetails.vue`
- `src/pages/KtpPage.vue`
- `src/pages/profile.vue`
- `src/pages/DisciplineCatalog.vue`
- `src/pages/planning.vue`
- `src/pages/journals.vue`
- `src/pages/reports.vue`
- `src/pages/SpecialtyCatalog.vue`
- `src/pages/StudentCard.vue`
- `src/pages/analytics.vue`
- `src/pages/TeacherCard.vue`
- `src/pages/EducationSchedule.vue`
- `src/pages/protocol.vue`
- `src/pages/settings.vue`
- `src/pages/notifications.vue`
- `src/components/PageSkeleton.vue`

**Step 1: For each file, add import in `<script setup>`**

```ts
import { useSidebar } from "@/composables/useSidebar";
const { contentMargin } = useSidebar();
```

**Step 2: Replace the static class with dynamic binding**

Find the element with `ml-32` and change from:
```html
<div class="flex-1 overflow-y-auto p-4 bg-background text-foreground ml-32">
```
To:
```html
<div class="flex-1 overflow-y-auto p-4 bg-background text-foreground transition-all duration-200" :class="contentMargin">
```

Note: Some pages use `ml-32` in different wording or combined classes. The pattern is the same: remove `ml-32` from the static `class` string, add `:class="contentMargin"` and `transition-all duration-200`.

**Step 3: Commit all page updates at once**

```bash
git add src/pages/ src/components/PageSkeleton.vue
git commit -m "feat: use dynamic sidebar content margin across all pages"
```

---

### Task 6: Verify and polish

**Step 1: Start the dev server and visually verify**

```bash
npm run dev
```

Check:
- [ ] Sidebar starts in its last stored state (localStorage key `sidebar-collapsed`)
- [ ] Toggle button visible on right edge of sidebar
- [ ] Clicking toggle animates width smoothly (200ms)
- [ ] When collapsed: only icons visible, no labels
- [ ] When expanded: icons + labels visible
- [ ] Active item shows card style (elevated, shadow, ring)
- [ ] Inactive items show hover state
- [ ] Main content margin transitions in sync with sidebar
- [ ] Profile items (profile/settings/logout) work correctly
- [ ] Router navigation works on item click
- [ ] Tooltip (`:title`) shows label when collapsed and hovering

**Step 2: Fix any TypeScript errors**

If unplugin-icons types aren't resolving, ensure `src/env.d.ts` has:
```ts
/// <reference types="unplugin-icons/types/vue" />
```

If lucide icon names don't resolve (e.g. `bar-chart-2` vs `BarChart2`), check the actual file names in `node_modules/@iconify-json/lucide/icons/`. The file names use kebab-case.

**Step 3: Commit any polish fixes**

```bash
git add -p
git commit -m "fix: sidebar polish and icon resolution"
```
