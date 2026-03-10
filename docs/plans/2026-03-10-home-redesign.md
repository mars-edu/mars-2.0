# Home Page Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign `src/pages/home.vue` and its card components to match the Apple-style dashboard concept from `1-руп-и-каталог-дисциплин-fresh/components/DashboardView.tsx`, using the project's token system.

**Architecture:** Replace the `Doodle`/`Quote` banner with a `WelcomeSection`, add a `StatsRow` of 3 stat widgets, merge `CalendarCard`+`ScheduleCard` into a single `CalendarSchedulePanel` right panel, restyle `ActivityCard` and `AnnouncementsCard`, and add `QuickActionsCard`. All components use design tokens (`bg-card`, `text-foreground`, `bg-muted`, `border-border`) so dark/lavanda themes work automatically.

**Tech Stack:** Vue 3 + TypeScript, Tailwind CSS (token-based), Pinia stores (`userStore`, `studentStore`, `academicYearSemesterStore`, `scheduleStore`, `notificationStore`)

---

## Visual Design Reference

From `1-руп-и-каталог-дисциплин-fresh/components/DashboardView.tsx`:
- Cards: `rounded-3xl` (≈ `rounded-[32px]`), `shadow-sm`, thin `border border-border`
- Background: `bg-background` page, `bg-card` cards
- Muted areas: `bg-muted` (replaces `bg-[#F5F5F7]`)
- Headers: `text-foreground font-bold`, sub-text: `text-muted-foreground`
- Colored icon pills: `bg-blue-50 text-blue-600 rounded-full p-2.5` — kept as semantic accent colors (not in token system), works across themes
- Primary accent: `text-primary` / `bg-primary` (maps to red in light, red in dark)
- Hover transitions: `transition-all duration-200`
- Schedule color bar: colored `w-1 rounded-full` strip left of content
- Announcement grid cards: `bg-muted hover:bg-card hover:shadow-md` rounded cells

## Token Mapping (concept → project tokens)

| Concept color | Token |
|---|---|
| `bg-white` card | `bg-card` |
| `text-[#1D1D1F]` | `text-foreground` |
| `text-gray-500` | `text-muted-foreground` |
| `bg-[#F5F5F7]` | `bg-muted` |
| `border-gray-100` | `border-border` |
| `text-[#007AFF]` links | `text-primary` |
| `shadow-[0_4px_24px_...]` | `shadow-sm` / `shadow-md` |

---

## Task 1: Create `WelcomeSection.vue`

**Files:**
- Create: `src/components/Home/WelcomeSection.vue`

Replaces the red `Doodle`+`Quote` banner. Shows time-of-day greeting + user's first name + current date.

**Step 1: Create the component**

```vue
<template>
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-foreground tracking-tight">
      {{ greeting }}, {{ firstName }}!
    </h1>
    <p class="text-muted-foreground text-sm font-medium mt-1">
      {{ formattedDate }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useUserStore } from "@/stores/userStore";

const userStore = useUserStore();

const firstName = computed(() => {
  const name = userStore.currentUser?.firstName;
  return name || "Пользователь";
});

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 12) return "Доброе утро";
  if (hour < 17) return "Добрый день";
  return "Добрый вечер";
});

const formattedDate = computed(() => {
  return new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});
</script>
```

**Step 2: Commit**
```bash
git add src/components/Home/WelcomeSection.vue
git commit -m "feat(home): add WelcomeSection component with greeting and date"
```

---

## Task 2: Create `StatsRow.vue`

**Files:**
- Create: `src/components/Home/StatsRow.vue`

3 stat widgets in a row: total students, current academic week, attendance %.

**Step 1: Create the component**

```vue
<template>
  <div class="grid grid-cols-3 gap-4 mb-8">
    <!-- Students -->
    <div
      class="bg-card rounded-3xl p-6 shadow-sm border border-border flex flex-col justify-between h-36 hover:shadow-md transition-all"
    >
      <div class="flex justify-between items-start">
        <div class="p-2.5 bg-blue-50 text-blue-600 rounded-full">
          <i class="f7-icons text-xl">person_2_fill</i>
        </div>
        <span class="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
          {{ studentCount }} всего
        </span>
      </div>
      <div>
        <div class="text-2xl font-bold text-foreground">{{ studentCount }}</div>
        <div class="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
          Студентов
        </div>
      </div>
    </div>

    <!-- Current Week -->
    <div
      class="bg-card rounded-3xl p-6 shadow-sm border border-border flex flex-col justify-between h-36 hover:shadow-md transition-all"
    >
      <div class="flex justify-between items-start">
        <div class="p-2.5 bg-orange-50 text-orange-600 rounded-full">
          <i class="f7-icons text-xl">calendar</i>
        </div>
        <span class="text-xs font-bold bg-muted text-muted-foreground px-2 py-1 rounded-full">
          {{ semesterLabel }}
        </span>
      </div>
      <div>
        <div class="text-2xl font-bold text-foreground">
          {{ currentWeek > 0 ? `${currentWeek} неделя` : "—" }}
        </div>
        <div class="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
          Текущая неделя
        </div>
      </div>
    </div>

    <!-- Attendance -->
    <div
      class="bg-card rounded-3xl p-6 shadow-sm border border-border flex flex-col justify-between h-36 hover:shadow-md transition-all"
    >
      <div class="flex justify-between items-start">
        <div class="p-2.5 bg-red-50 text-red-500 rounded-full">
          <i class="f7-icons text-xl">chart_bar_fill</i>
        </div>
        <span class="text-xs font-bold text-red-500 bg-red-50 px-2 py-1 rounded-full">
          -1.2%
        </span>
      </div>
      <div>
        <div class="text-2xl font-bold text-foreground">94%</div>
        <div class="text-xs text-muted-foreground font-medium uppercase tracking-wide mt-1">
          Посещаемость
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useStudentStore } from "@/stores/studentStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";

const studentStore = useStudentStore();
const studentCount = computed(() => studentStore.students?.length ?? 0);

const academicStore = useAcademicYearSemesterStore();
const { getActiveAcademicYearSemester } = storeToRefs(academicStore);

const semesterLabel = computed(() => {
  const s = getActiveAcademicYearSemester.value;
  return s ? `Семестр` : "Нет семестра";
});

const currentWeek = computed(() => {
  const s = getActiveAcademicYearSemester.value;
  if (!s?.startDate) return 0;
  const start = new Date(s.startDate);
  const today = new Date();
  const diff = today.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
});
</script>
```

**Step 2: Commit**
```bash
git add src/components/Home/StatsRow.vue
git commit -m "feat(home): add StatsRow with students/week/attendance widgets"
```

---

## Task 3: Restyle `ActivityCard.vue`

**Files:**
- Modify: `src/components/Cards/ActivityCard.vue`

Remove the old 2-stat grid layout. Replace with the concept's "Последняя активность" list style with icon avatars. Data stays mock (no activity store).

**Step 1: Rewrite the component**

```vue
<template>
  <div class="bg-card rounded-3xl p-8 shadow-sm border border-border flex flex-col">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-lg font-bold text-foreground">Последняя активность</h3>
      <button
        class="text-primary text-sm font-medium hover:opacity-70 transition-opacity"
        @click="$router.push('/protocol')"
      >
        Показать все
      </button>
    </div>

    <div class="space-y-5">
      <div
        v-for="item in activityItems"
        :key="item.id"
        class="flex gap-4 group cursor-default"
      >
        <div class="mt-0.5 flex-shrink-0">
          <div
            class="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors"
          >
            <i class="f7-icons text-base">{{ item.icon }}</i>
          </div>
        </div>
        <div class="border-b border-border pb-5 w-full last:border-0 last:pb-0">
          <div class="flex justify-between mb-1">
            <span class="text-sm font-bold text-foreground">{{ item.title }}</span>
            <span class="text-xs text-muted-foreground">{{ item.time }}</span>
          </div>
          <p class="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {{ item.description }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const activityItems = [
  {
    id: 1,
    icon: "doc_text_fill",
    title: "Журнал закрыт",
    time: "14:30",
    description: "Журнал по дисциплине «Философия» для группы 3 РЭХТ закрыт.",
  },
  {
    id: 2,
    icon: "arrow_2_squarepath",
    title: "Назначена пересдача",
    time: "11:15",
    description: "Пересдача экзамена назначена в журнале по дисциплине «История Казахстана».",
  },
  {
    id: 3,
    icon: "bell_fill",
    title: "Новое объявление",
    time: "09:00",
    description: "Опубликовано объявление: «Заседание кафедры — 5 января, 15:00».",
  },
];
</script>
```

**Step 2: Commit**
```bash
git add src/components/Cards/ActivityCard.vue
git commit -m "feat(home): restyle ActivityCard to concept list layout"
```

---

## Task 4: Create `QuickActionsCard.vue`

**Files:**
- Create: `src/components/Home/QuickActionsCard.vue`

Two tall clickable cards stacked: "Сформировать отчет" (→ `/reports`) and "Создать объявление" (→ `/notifications`).

**Step 1: Create the component**

```vue
<template>
  <div class="flex flex-col gap-4">
    <!-- Report Card -->
    <div
      class="bg-card rounded-3xl p-8 shadow-sm border border-border cursor-pointer hover:bg-muted transition-colors group flex flex-col justify-between min-h-[180px]"
      @click="navigate('/reports')"
    >
      <div>
        <div class="flex justify-between items-start mb-5">
          <div
            class="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform"
          >
            <i class="f7-icons text-2xl">doc_chart_fill</i>
          </div>
          <i class="f7-icons text-2xl text-muted-foreground/40 group-hover:text-blue-500 transition-colors">
            arrow_up_right
          </i>
        </div>
        <h3 class="text-lg font-bold text-foreground">Сформировать отчет</h3>
        <p class="text-muted-foreground text-sm mt-2 leading-relaxed">
          Выгрузка статистики успеваемости и посещаемости за текущий месяц.
        </p>
      </div>
      <div class="mt-4 pt-4 border-t border-border">
        <span class="text-primary text-sm font-bold flex items-center gap-1">
          Начать <i class="f7-icons text-xs">chevron_right</i>
        </span>
      </div>
    </div>

    <!-- Announcement Card -->
    <div
      class="bg-card rounded-3xl p-8 shadow-sm border border-border cursor-pointer hover:bg-muted transition-colors group flex flex-col justify-between min-h-[180px]"
      @click="navigate('/notifications')"
    >
      <div>
        <div class="flex justify-between items-start mb-5">
          <div
            class="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 group-hover:scale-110 transition-transform"
          >
            <i class="f7-icons text-2xl">megaphone_fill</i>
          </div>
          <i class="f7-icons text-2xl text-muted-foreground/40 group-hover:text-orange-500 transition-colors">
            plus
          </i>
        </div>
        <h3 class="text-lg font-bold text-foreground">Создать объявление</h3>
        <p class="text-muted-foreground text-sm mt-2 leading-relaxed">
          Опубликовать новость для студентов или преподавателей.
        </p>
      </div>
      <div class="mt-4 pt-4 border-t border-border">
        <span class="text-orange-500 text-sm font-bold flex items-center gap-1">
          Создать <i class="f7-icons text-xs">chevron_right</i>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7 } from "framework7-vue";

const navigate = (path: string) => {
  f7.views.main.router.navigate(path);
};
</script>
```

**Step 2: Commit**
```bash
git add src/components/Home/QuickActionsCard.vue
git commit -m "feat(home): add QuickActionsCard for reports and announcements"
```

---

## Task 5: Restyle `AnnouncementsCard.vue`

**Files:**
- Modify: `src/components/Cards/AnnouncementsCard.vue`

Replace the vertical list with a filterable grid of announcement tiles. Use `notificationStore` for real data, fall back to static items.

**Step 1: Rewrite the component**

```vue
<template>
  <div class="bg-card rounded-3xl p-8 shadow-sm border border-border">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
      <div class="flex items-center gap-3">
        <div class="bg-orange-100 text-orange-600 p-2 rounded-xl">
          <i class="f7-icons text-xl">megaphone_fill</i>
        </div>
        <h3 class="text-lg font-bold text-foreground">Объявления и новости</h3>
      </div>

      <!-- Filter Tabs -->
      <div class="flex p-1 bg-muted rounded-xl overflow-x-auto">
        <button
          v-for="filter in filters"
          :key="filter.id"
          class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all"
          :class="
            activeFilter === filter.id
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          "
          @click="activeFilter = filter.id"
        >
          {{ filter.label }}
        </button>
      </div>
    </div>

    <!-- Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <template v-if="filteredItems.length > 0">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="p-5 rounded-3xl border border-border bg-muted hover:bg-card hover:shadow-md transition-all cursor-default group"
        >
          <div class="flex justify-between items-start mb-3">
            <span
              class="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide"
              :class="item.badgeClass"
            >
              {{ item.badge }}
            </span>
            <span class="text-xs text-muted-foreground font-medium">{{ item.date }}</span>
          </div>
          <h4
            class="text-sm font-bold text-foreground mb-2 leading-tight group-hover:text-primary transition-colors"
          >
            {{ item.title }}
          </h4>
          <p class="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {{ item.description }}
          </p>
        </div>
      </template>
      <div v-else class="col-span-3 text-center py-8 text-muted-foreground text-sm">
        Нет объявлений в этой категории
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";

const activeFilter = ref("all");

const filters = [
  { id: "all", label: "Все" },
  { id: "academic", label: "Учебная часть" },
  { id: "contests", label: "Конкурсы" },
  { id: "events", label: "Мероприятия" },
  { id: "system", label: "Система" },
];

interface AnnouncementItem {
  id: number;
  title: string;
  description: string;
  date: string;
  category: string;
  badge: string;
  badgeClass: string;
}

const items: AnnouncementItem[] = [
  {
    id: 1,
    title: "Заседание кафедры",
    date: "5 марта, 15:00",
    category: "academic",
    badge: "Инфо",
    badgeClass: "bg-blue-50 text-blue-600",
    description: "Обсуждение плана на 2 семестр. Явка обязательна.",
  },
  {
    id: 2,
    title: "Срок сдачи ведомостей",
    date: "до 10 марта",
    category: "academic",
    badge: "Важно",
    badgeClass: "bg-red-50 text-red-600",
    description: "Необходимо закрыть все электронные журналы до конца недели.",
  },
  {
    id: 3,
    title: "Обновление системы",
    date: "11 марта",
    category: "system",
    badge: "Система",
    badgeClass: "bg-muted text-muted-foreground border border-border",
    description: "Плановые технические работы с 22:00 до 00:00.",
  },
  {
    id: 4,
    title: "Конкурс «Лучший куратор»",
    date: "Заявки до 20.03",
    category: "contests",
    badge: "Конкурс",
    badgeClass: "bg-yellow-50 text-yellow-600",
    description: "Открыт приём заявок на ежегодный конкурс.",
  },
  {
    id: 5,
    title: "Весенний концерт",
    date: "22 марта",
    category: "events",
    badge: "Мероприятие",
    badgeClass: "bg-purple-50 text-purple-600",
    description: "Праздничное мероприятие в актовом зале в 17:00.",
  },
];

const filteredItems = computed(() =>
  activeFilter.value === "all"
    ? items
    : items.filter((i) => i.category === activeFilter.value)
);
</script>
```

**Step 2: Commit**
```bash
git add src/components/Cards/AnnouncementsCard.vue
git commit -m "feat(home): restyle AnnouncementsCard to filterable grid"
```

---

## Task 6: Create `CalendarSchedulePanel.vue`

**Files:**
- Create: `src/components/Home/CalendarSchedulePanel.vue`

Merges the existing `CalendarCard` and `ScheduleCard` into a single tall right-panel card. Re-uses the existing store logic, just changes the visual container.

**Step 1: Create the component**

```vue
<template>
  <div class="bg-card rounded-3xl shadow-sm border border-border h-full flex flex-col p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6 px-2">
      <h2 class="text-lg font-bold text-foreground">Календарь</h2>
    </div>

    <!-- Calendar (reuse CalendarCard internals) -->
    <div class="mb-6 border-b border-border pb-6">
      <!-- Month nav -->
      <div class="flex justify-between items-center mb-4 px-2">
        <span class="text-sm font-bold text-foreground capitalize">
          {{ currentMonthYear }}
        </span>
        <div class="flex gap-1">
          <button
            class="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            @click="previousMonth"
          >
            <i class="f7-icons text-sm">chevron_left</i>
          </button>
          <button
            class="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            @click="nextMonth"
          >
            <i class="f7-icons text-sm">chevron_right</i>
          </button>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-sm">
        <div
          v-for="d in weekDays"
          :key="d"
          class="text-muted-foreground text-xs font-medium uppercase"
        >
          {{ d }}
        </div>
        <div
          v-for="date in calendarDays"
          :key="`${date.date.getFullYear()}-${date.date.getMonth()}-${date.day}`"
          class="h-8 flex items-center justify-center"
        >
          <button
            class="w-8 h-8 flex items-center justify-center text-xs rounded-full transition-all duration-200"
            :class="[
              date.isToday
                ? 'bg-primary text-primary-foreground shadow-md font-bold'
                : isSelectedDate(date)
                ? 'bg-primary/20 text-primary font-bold'
                : date.isCurrentMonth
                ? 'text-foreground hover:bg-muted'
                : 'text-muted-foreground/40',
              date.hasSchedule && !date.isToday ? 'font-bold' : '',
            ]"
            :disabled="!date.isCurrentMonth"
            @click="selectDate(date)"
          >
            {{ date.day }}
          </button>
        </div>
      </div>
    </div>

    <!-- Schedule -->
    <div class="flex-1 overflow-y-auto">
      <div class="flex justify-between items-end mb-4 px-2">
        <h3 class="text-base font-bold text-foreground">Расписание</h3>
        <span class="text-xs text-muted-foreground font-medium uppercase">{{ scheduleLabel }}</span>
      </div>

      <div v-if="schedule.length > 0" class="space-y-3">
        <div
          v-for="(lesson, index) in schedule"
          :key="index"
          class="group p-4 rounded-2xl bg-muted hover:bg-card border border-transparent hover:border-border hover:shadow-sm cursor-default transition-all duration-200 flex items-stretch gap-4"
        >
          <div class="flex flex-col justify-center min-w-[48px]">
            <span class="text-sm font-bold text-foreground leading-none">{{ lesson.startTime }}</span>
            <span class="text-xs text-muted-foreground font-medium mt-1">{{ lesson.endTime }}</span>
          </div>
          <div class="w-1 rounded-full bg-primary opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0"></div>
          <div class="flex-1 py-0.5">
            <div class="text-sm font-bold text-foreground mb-0.5 leading-tight group-hover:text-primary transition-colors">
              {{ lesson.subject }}
            </div>
            <div class="flex items-center justify-between mt-2">
              <div class="text-xs text-muted-foreground bg-card group-hover:bg-muted px-2 py-1 rounded-md transition-colors">
                {{ lesson.room }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <EmptyState
        v-else
        icon="calendar"
        title="Нет занятий на этот день"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useScheduleStore } from "@/stores/scheduleStore";
import EmptyState from "@/components/ui/EmptyState.vue";

const scheduleStore = useScheduleStore();
const weekDays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const currentDate = ref(new Date());

interface CalendarDate {
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  date: Date;
  hasSchedule?: boolean;
}

const checkHasSchedule = (date: Date): boolean => {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return !!scheduleStore.scheduleData[key]?.length;
};

const isSelectedDate = (date: CalendarDate): boolean => {
  if (!date.isCurrentMonth) return false;
  const sel = scheduleStore.selectedDate;
  if (!sel) return false;
  const s = new Date(sel);
  return date.date.getDate() === s.getDate() && date.date.getMonth() === s.getMonth() && date.date.getFullYear() === s.getFullYear();
};

const selectDate = (date: CalendarDate) => {
  if (!date.isCurrentMonth) return;
  scheduleStore.setSelectedDate(date.date);
};

const changeMonth = (delta: number) => {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() + delta);
  currentDate.value = d;
  const sel = new Date(scheduleStore.selectedDate);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  scheduleStore.setSelectedDate(new Date(d.getFullYear(), d.getMonth(), Math.min(sel.getDate(), last)));
};

const previousMonth = () => changeMonth(-1);
const nextMonth = () => changeMonth(1);

const currentMonthYear = computed(() => {
  const months = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
  return `${months[currentDate.value.getMonth()]} ${currentDate.value.getFullYear()}`;
});

const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() || 7) - 1;

  const prev: CalendarDate[] = [];
  if (startOffset > 0) {
    const prevLastDay = new Date(year, month, 0).getDate();
    const prevMonth = month - 1 < 0 ? 11 : month - 1;
    const prevYear = prevMonth === 11 ? year - 1 : year;
    for (let i = prevLastDay - startOffset + 1; i <= prevLastDay; i++) {
      const d = new Date(prevYear, prevMonth, i);
      prev.push({ day: i, isCurrentMonth: false, isToday: false, date: d, hasSchedule: checkHasSchedule(d) });
    }
  }

  const curr: CalendarDate[] = Array.from({ length: lastDay.getDate() }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return { day: i + 1, isCurrentMonth: true, isToday: today.getDate() === i + 1 && today.getMonth() === month && today.getFullYear() === year, date: d, hasSchedule: checkHasSchedule(d) };
  });

  const total = 42;
  const next: CalendarDate[] = [];
  for (let i = 1; i <= total - prev.length - curr.length; i++) {
    const d = new Date(year, month + 1, i);
    next.push({ day: i, isCurrentMonth: false, isToday: false, date: d, hasSchedule: checkHasSchedule(d) });
  }

  return [...prev, ...curr, ...next];
});

const schedule = computed(() => scheduleStore.selectedDateSchedule);

const scheduleLabel = computed(() => {
  const sel = scheduleStore.selectedDate;
  if (!sel) return "Сегодня";
  const d = new Date(sel);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Сегодня";
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return "Завтра";
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
});

onMounted(() => {
  scheduleStore.setSelectedDate(new Date());
});
</script>
```

**Step 2: Commit**
```bash
git add src/components/Home/CalendarSchedulePanel.vue
git commit -m "feat(home): add CalendarSchedulePanel merging calendar and schedule"
```

---

## Task 7: Rewrite `home.vue` layout

**Files:**
- Modify: `src/pages/home.vue`

Wire up all new components into the final layout. Remove `Doodle`, `Quote`, `CalendarCard`, `ScheduleCard`, `AcademicWeekCard` imports. Add `WelcomeSection`, `StatsRow`, `QuickActionsCard`, `CalendarSchedulePanel`.

**Step 1: Rewrite the desktop layout section of home.vue**

Replace the entire file content:

```vue
<template>
  <f7-page
    name="home"
    class="flex flex-col h-screen"
    :data-page-id="`home-${pageId}`"
    data-page-name="home"
  >
    <Header class="hidden md:block flex-shrink-0" />

    <!-- Desktop Layout -->
    <div class="hidden md:flex overflow-hidden flex-1">
      <Sidebar v-model:activeNavItem="activeNavItem" />

      <div
        class="flex-1 overflow-y-auto p-6 bg-background text-foreground transition-all duration-200"
        :class="contentMargin"
      >
        <WelcomeSection />
        <StatsRow />

        <div class="flex flex-row gap-6">
          <!-- Left: Activity + QuickActions + Announcements -->
          <div class="flex-1 space-y-6 min-w-0">
            <div class="grid grid-cols-3 gap-6">
              <div class="col-span-2">
                <ActivityCard />
              </div>
              <QuickActionsCard />
            </div>
            <AnnouncementsCard />
          </div>

          <!-- Right: Calendar + Schedule panel -->
          <div class="w-[380px] flex-shrink-0">
            <CalendarSchedulePanel />
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile Layout with Tabs -->
    <f7-tabs class="md:hidden">
      <f7-tab
        id="tab-home"
        class="page-content"
        :tab-active="activeNavItem === 'home'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <WelcomeSection />
          <StatsRow />
          <div class="flex flex-col gap-4">
            <ActivityCard />
            <AnnouncementsCard />
            <CalendarSchedulePanel class="min-h-[600px]" />
          </div>
        </div>
      </f7-tab>

      <f7-tab
        id="tab-schedule"
        class="page-content"
        :tab-active="activeNavItem === 'schedule'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">Расписание</h2>
          <CalendarSchedulePanel class="min-h-[600px]" />
        </div>
      </f7-tab>

      <f7-tab
        id="tab-journals"
        class="page-content"
        :tab-active="activeNavItem === 'journals'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">Журналы</h2>
          <div class="bg-card text-card-foreground rounded-xl p-4 shadow-sm">
            <p class="text-muted-foreground">Содержимое журналов будет здесь</p>
          </div>
        </div>
      </f7-tab>

      <f7-tab
        id="tab-rup"
        class="page-content"
        :tab-active="activeNavItem === 'rup'"
      >
        <div class="overflow-y-auto p-4 bg-background text-foreground pb-16">
          <h2 class="text-2xl font-bold mb-4">РУП</h2>
          <div class="bg-card text-card-foreground rounded-xl p-4 shadow-sm">
            <p class="text-muted-foreground">Содержимое РУП будет здесь</p>
          </div>
        </div>
      </f7-tab>
    </f7-tabs>

    <!-- Mobile Tabbar -->
    <f7-toolbar tabbar labels position="bottom" class="md:hidden">
      <f7-link
        v-for="item in navigationItems"
        :key="item.id"
        :tab-link="'#tab-' + item.id"
        :tab-link-active="item.id === activeNavItem"
        :icon-f7="item.icon"
        :text="item.label"
        @click="activeNavItem = item.id"
      ></f7-link>
    </f7-toolbar>
  </f7-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7Page, f7Link, f7Toolbar, f7Tabs, f7Tab } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import ActivityCard from "@/components/Cards/ActivityCard.vue";
import AnnouncementsCard from "@/components/Cards/AnnouncementsCard.vue";
import WelcomeSection from "@/components/Home/WelcomeSection.vue";
import StatsRow from "@/components/Home/StatsRow.vue";
import QuickActionsCard from "@/components/Home/QuickActionsCard.vue";
import CalendarSchedulePanel from "@/components/Home/CalendarSchedulePanel.vue";
import { useSidebar } from "@/composables/useSidebar";

const { contentMargin } = useSidebar();
const pageId = ref(Date.now());
const activeNavItem = ref("home");

const navigationItems = [
  { id: "home", label: "Главная", icon: "house_fill" },
  { id: "schedule", label: "Расписание", icon: "calendar" },
  { id: "journals", label: "Журналы", icon: "doc_text_fill" },
  { id: "rup", label: "РУП", icon: "book_fill" },
];
</script>
```

**Step 2: Commit**
```bash
git add src/pages/home.vue
git commit -m "feat(home): restructure layout with welcome, stats, activity, announcements, calendar panel"
```

---

## Task 8: Verify in browser

**Step 1:** Run dev server
```bash
cd /home/olge/SOFT/git/mars-2.0
bun run dev
```

**Step 2:** Open browser, navigate to home page. Verify:
- Welcome greeting shows current user's first name
- Greeting text changes by time of day (утро/день/вечер)
- 3 stat widgets visible and populated (or show zeros if no data)
- Activity list shows 3 items with icons
- Quick action cards clickable (report → `/reports`, announcement → `/notifications`)
- Announcements grid shows 5 items, filter tabs work
- Right panel shows calendar + schedule for selected date
- Dark theme and lavanda theme look correct (no hardcoded white/gray colors broken)

**Step 3:** Check mobile layout (narrow browser window):
- Stats grid still visible (3 cols may be tight — acceptable at sm)
- Cards stack vertically
- Bottom tabbar visible

**Step 4:** If anything looks broken, check browser console for import errors.
