# Analytics Page Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port six missing UI sections from concept's AnalyticsView into mars-2.0's analytics.vue, wiring all data to real Convex-backed stores.

**Architecture:** Four new sub-components (`AnalyticsStatCards`, `AnalyticsCharts`, `AnalyticsAttendanceSheet`, `AnalyticsTranscriptView`) receive computed props from `analytics.vue`, which gains `viewMode` and `sheetType` state refs plus four new computed properties for stats/charts/attendance data.

**Tech Stack:** Vue 3, ApexCharts (vue3-apexcharts), Pinia stores (marksStore, studentStore, journalStore, calendarStore), Tailwind CSS, Framework7-Vue.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `package.json` | add apexcharts + vue3-apexcharts |
| Modify | `src/js/app.js` | register VueApexCharts plugin |
| Create | `src/components/AnalyticsStatCards.vue` | 4 summary stat cards |
| Create | `src/components/AnalyticsCharts.vue` | line + donut ApexCharts |
| Create | `src/components/AnalyticsAttendanceSheet.vue` | per-student attendance grid |
| Create | `src/components/AnalyticsTranscriptView.vue` | student transcript with letter grades |
| Modify | `src/pages/analytics.vue` | new state + computed + component wiring |

---

## Task 1: Install ApexCharts

**Files:**
- Modify: `package.json`
- Modify: `src/js/app.js`

- [ ] **Step 1: Install packages**

```bash
cd /home/olge/SOFT/git/MARS/mars-2.0
bun add apexcharts vue3-apexcharts
```

Expected output: packages added to `node_modules` and `package.json` updated.

- [ ] **Step 2: Register plugin in app.js**

In `src/js/app.js`, add after the existing imports (around line 13):

```js
import VueApexCharts from "vue3-apexcharts";
```

And after `app.use(pinia);` (around line 46), add:

```js
app.use(VueApexCharts);
```

- [ ] **Step 3: Commit**

```bash
cd /home/olge/SOFT/git/MARS/mars-2.0
git add package.json bun.lock src/js/app.js
git commit -m "feat: add apexcharts dependency for analytics charts"
```

---

## Task 2: AnalyticsStatCards.vue

**Files:**
- Create: `src/components/AnalyticsStatCards.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/AnalyticsStatCards.vue -->
<template>
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <div
      v-for="card in cards"
      :key="card.label"
      class="bg-card rounded-xl border border-border shadow-sm p-5 flex items-center gap-4"
    >
      <div :class="['p-3 rounded-xl', card.bgColor]">
        <component :is="card.icon" class="w-6 h-6" :class="card.iconColor" />
      </div>
      <div>
        <p class="text-sm text-muted-foreground font-medium">{{ card.label }}</p>
        <p class="text-2xl font-bold text-foreground">{{ card.value }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import IconTrendingUp from "~icons/lucide/trending-up";
import IconUsers from "~icons/lucide/users";
import IconBookOpen from "~icons/lucide/book-open";
import IconClock from "~icons/lucide/clock";

const props = defineProps<{
  averageScore: number | null;
  studentCount: number;
  disciplineCount: number;
  attendancePercent: number | null;
}>();

const cards = computed(() => [
  {
    label: "Средний балл",
    value: props.averageScore !== null ? props.averageScore.toFixed(1) : "—",
    icon: IconTrendingUp,
    bgColor: "bg-emerald-50 dark:bg-emerald-950",
    iconColor: "text-emerald-600",
  },
  {
    label: "Студентов",
    value: props.studentCount,
    icon: IconUsers,
    bgColor: "bg-blue-50 dark:bg-blue-950",
    iconColor: "text-blue-600",
  },
  {
    label: "Дисциплин",
    value: props.disciplineCount,
    icon: IconBookOpen,
    bgColor: "bg-purple-50 dark:bg-purple-950",
    iconColor: "text-purple-600",
  },
  {
    label: "Посещаемость",
    value:
      props.attendancePercent !== null
        ? props.attendancePercent.toFixed(0) + "%"
        : "—",
    icon: IconClock,
    bgColor: "bg-orange-50 dark:bg-orange-950",
    iconColor: "text-orange-600",
  },
]);
</script>
```

- [ ] **Step 2: Commit**

```bash
cd /home/olge/SOFT/git/MARS/mars-2.0
git add src/components/AnalyticsStatCards.vue
git commit -m "feat: add AnalyticsStatCards component"
```

---

## Task 3: AnalyticsCharts.vue

**Files:**
- Create: `src/components/AnalyticsCharts.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/AnalyticsCharts.vue -->
<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Line chart: monthly dynamics -->
    <div class="bg-card rounded-xl border border-border shadow-sm p-5">
      <h3 class="text-base font-semibold text-foreground mb-4">
        Динамика успеваемости
      </h3>
      <apexchart
        v-if="monthlyData.length > 0"
        type="line"
        height="280"
        :options="lineOptions"
        :series="lineSeries"
      />
      <div
        v-else
        class="h-[280px] flex items-center justify-center text-muted-foreground text-sm"
      >
        Недостаточно данных
      </div>
    </div>

    <!-- Donut chart: grade distribution -->
    <div class="bg-card rounded-xl border border-border shadow-sm p-5">
      <h3 class="text-base font-semibold text-foreground mb-4">
        Распределение оценок
      </h3>
      <apexchart
        v-if="hasGradeData"
        type="donut"
        height="280"
        :options="donutOptions"
        :series="donutSeries"
      />
      <div
        v-else
        class="h-[280px] flex items-center justify-center text-muted-foreground text-sm"
      >
        Нет данных об оценках
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  monthlyData: { month: string; avgScore: number }[];
  overallAverages: (number | null)[];
}>();

// Line chart
const lineSeries = computed(() => [
  {
    name: "Средний балл",
    data: props.monthlyData.map((d) => parseFloat(d.avgScore.toFixed(1))),
  },
]);

const lineOptions = computed(() => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false } },
  stroke: { curve: "smooth", width: 3 },
  xaxis: { categories: props.monthlyData.map((d) => d.month) },
  yaxis: { min: 0, max: 100 },
  colors: ["#3B82F6"],
  grid: { borderColor: "var(--color-border)", xaxis: { lines: { show: false } } },
  tooltip: { theme: "light" },
  dataLabels: { enabled: false },
}));

// Donut chart
const gradeLabels = ["Отлично (≥90)", "Хорошо (75–89)", "Удовл. (50–74)", "Неудовл. (<50)"];
const gradeColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

const donutSeries = computed(() => {
  const scores = props.overallAverages.filter((s): s is number => s !== null);
  return [
    scores.filter((s) => s >= 90).length,
    scores.filter((s) => s >= 75 && s < 90).length,
    scores.filter((s) => s >= 50 && s < 75).length,
    scores.filter((s) => s < 50).length,
  ];
});

const hasGradeData = computed(() =>
  donutSeries.value.some((v) => v > 0)
);

const donutOptions = computed(() => ({
  labels: gradeLabels,
  colors: gradeColors,
  chart: { toolbar: { show: false } },
  legend: { position: "bottom" },
  dataLabels: { enabled: true },
  plotOptions: {
    pie: { donut: { size: "65%" } },
  },
  tooltip: { theme: "light" },
}));
</script>
```

- [ ] **Step 2: Commit**

```bash
cd /home/olge/SOFT/git/MARS/mars-2.0
git add src/components/AnalyticsCharts.vue
git commit -m "feat: add AnalyticsCharts component with ApexCharts"
```

---

## Task 4: AnalyticsAttendanceSheet.vue

**Files:**
- Create: `src/components/AnalyticsAttendanceSheet.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/AnalyticsAttendanceSheet.vue -->
<template>
  <div class="space-y-4">
    <!-- Controls bar -->
    <div class="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-foreground">Период:</span>
        <select
          v-model="period"
          class="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm outline-none focus:border-primary transition-colors"
        >
          <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-foreground">Учебный год:</span>
        <select
          v-model="year"
          class="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm outline-none focus:border-primary transition-colors"
        >
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-foreground">Семестр:</span>
        <select
          v-model="semesterNum"
          class="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm outline-none focus:border-primary transition-colors"
        >
          <option value="1">1 семестр</option>
          <option value="2">2 семестр</option>
        </select>
      </div>
      <button
        class="ml-auto px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
        @click="generate"
      >
        Сформировать
      </button>
    </div>

    <!-- Student multi-select -->
    <div class="flex items-center gap-3">
      <span class="text-sm font-medium text-foreground">Обучающийся:</span>
      <div class="relative" ref="dropdownRef">
        <button
          class="border border-border rounded-xl px-4 py-2 bg-background text-foreground text-sm flex items-center gap-2 min-w-[220px] justify-between"
          @click="dropdownOpen = !dropdownOpen"
        >
          <span class="truncate">
            {{
              selectedIds.length === 0
                ? "Все обучающиеся"
                : `Выбрано: ${selectedIds.length}`
            }}
          </span>
          <IconChevronDown class="w-4 h-4 text-muted-foreground flex-shrink-0" />
        </button>
        <div
          v-if="dropdownOpen"
          class="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-72 flex flex-col py-2"
        >
          <div class="px-3 pb-2 border-b border-border">
            <input
              v-model="search"
              type="text"
              placeholder="Поиск..."
              class="w-full px-3 py-1.5 text-sm border border-border rounded-lg outline-none focus:border-primary bg-background"
            />
          </div>
          <div class="overflow-y-auto flex-1 py-1">
            <div
              class="px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-muted/50"
              :class="{ 'bg-primary/10 text-primary font-medium': selectedIds.length === 0 }"
              @click="selectedIds = []; dropdownOpen = false"
            >
              Все обучающиеся
            </div>
            <div
              v-for="s in filteredStudents"
              :key="s.id"
              class="px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors hover:bg-muted/50"
              :class="{ 'bg-primary/10': selectedIds.includes(s.id) }"
              @click="toggleStudent(s.id)"
            >
              <div
                class="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                :class="
                  selectedIds.includes(s.id)
                    ? 'bg-primary border-primary'
                    : 'border-border'
                "
              >
                <IconCheck
                  v-if="selectedIds.includes(s.id)"
                  class="w-3 h-3 text-primary-foreground"
                />
              </div>
              {{ s.fullName }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Generated attendance tables -->
    <template v-if="isGenerated">
      <div
        v-if="displayStudents.length === 0"
        class="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground"
      >
        Выберите обучающегося для просмотра посещаемости
      </div>
      <div
        v-for="student in displayStudents"
        :key="student.id"
        class="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-border bg-muted/30">
          <h4 class="font-semibold text-foreground">{{ student.fullName }}</h4>
        </div>
        <div class="space-y-6 p-6">
          <div
            v-for="(journal, jIdx) in journals"
            :key="journal.id"
          >
            <p class="text-sm font-semibold text-foreground mb-3">
              {{ jIdx + 1 }}. {{ journal.title }}
            </p>
            <div class="overflow-x-auto">
              <table class="border-collapse">
                <tbody>
                  <tr>
                    <td
                      v-for="cell in getAttendanceCells(journal.id, student.id)"
                      :key="cell.date"
                      class="border border-border text-center h-10 min-w-[52px] px-2"
                    >
                      <span
                        v-if="cell.present === true"
                        class="text-emerald-500 font-bold text-lg"
                      >+</span>
                      <span
                        v-else-if="cell.present === false"
                        class="text-red-500 font-bold text-lg"
                      >-</span>
                    </td>
                  </tr>
                  <tr class="bg-muted/30">
                    <th
                      v-for="cell in getAttendanceCells(journal.id, student.id)"
                      :key="cell.date"
                      class="border border-border text-[10px] font-bold text-muted-foreground text-center px-2 py-1 uppercase tracking-wide"
                    >
                      {{ cell.label }}
                    </th>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconCheck from "~icons/lucide/check";
import type { Mark } from "@/types/marks";

const props = defineProps<{
  students: { id: string; fullName: string }[];
  journals: { id: string; title: string }[];
  getStudentMarks: (journalId: string, studentId: string) => Mark[] | null;
}>();

const months = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const currentDate = new Date();
const years = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];

const period = ref(months[currentDate.getMonth()]);
const year = ref("2025-2026");
const semesterNum = ref("1");
const isGenerated = ref(false);
const selectedIds = ref<string[]>([]);
const search = ref("");
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const generate = () => { isGenerated.value = true; };

const filteredStudents = computed(() =>
  props.students.filter((s) =>
    s.fullName.toLowerCase().includes(search.value.toLowerCase())
  )
);

const displayStudents = computed(() => {
  if (selectedIds.value.length === 0) return props.students;
  return props.students.filter((s) => selectedIds.value.includes(s.id));
});

const toggleStudent = (id: string) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((s) => s !== id);
  } else {
    selectedIds.value = [...selectedIds.value, id];
  }
};

const monthIndex = computed(() => months.indexOf(period.value)); // 0-based

const isAbsent = (value: string | number | null): boolean => {
  if (value === null || value === undefined || value === "") return true;
  const s = String(value).trim().toLowerCase();
  return s === "н" || s === "б" || s === "0" || s === "0.0";
};

const getAttendanceCells = (
  journalId: string,
  studentId: string
): { date: string; label: string; present: boolean | null }[] => {
  const marks = props.getStudentMarks(journalId, studentId);
  if (!marks) return [];

  const dateMarks = marks.filter(
    (m: Mark) =>
      m.type === "date" &&
      m.isoDate &&
      new Date(m.isoDate).getMonth() === monthIndex.value
  );

  return dateMarks.map((m: Mark) => {
    const d = new Date(m.isoDate!);
    const label = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    const firstValue = Array.isArray(m.values) ? m.values[0] : null;
    const present = firstValue !== null && firstValue !== undefined && firstValue !== ""
      ? !isAbsent(firstValue)
      : null;
    return { date: m.isoDate!, label, present };
  });
};

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false;
  }
};
onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));
</script>
```

- [ ] **Step 2: Commit**

```bash
cd /home/olge/SOFT/git/MARS/mars-2.0
git add src/components/AnalyticsAttendanceSheet.vue
git commit -m "feat: add AnalyticsAttendanceSheet component"
```

---

## Task 5: AnalyticsTranscriptView.vue

**Files:**
- Create: `src/components/AnalyticsTranscriptView.vue`

- [ ] **Step 1: Create the component**

```vue
<!-- src/components/AnalyticsTranscriptView.vue -->
<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="bg-card border border-border rounded-xl p-5 flex flex-wrap items-end gap-4">
      <div>
        <label class="text-sm font-medium text-foreground block mb-1">Год поступления (с)</label>
        <input
          v-model="yearFrom"
          type="number"
          placeholder="2020"
          class="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm outline-none focus:border-primary w-28"
        />
      </div>
      <div>
        <label class="text-sm font-medium text-foreground block mb-1">Год поступления (по)</label>
        <input
          v-model="yearTo"
          type="number"
          placeholder="2025"
          class="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm outline-none focus:border-primary w-28"
        />
      </div>
      <div class="flex-1 min-w-[220px]">
        <label class="text-sm font-medium text-foreground block mb-1">Обучающийся</label>
        <div class="relative" ref="dropdownRef">
          <button
            class="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground text-sm flex items-center justify-between gap-2"
            @click="dropdownOpen = !dropdownOpen"
          >
            <span class="truncate">
              {{
                selectedIds.length === 0
                  ? "Выберите обучающихся..."
                  : `Выбрано: ${selectedIds.length}`
              }}
            </span>
            <IconChevronDown class="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
          <div
            v-if="dropdownOpen"
            class="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-72 flex flex-col py-2"
          >
            <div class="px-3 pb-2 border-b border-border">
              <input
                v-model="search"
                type="text"
                placeholder="Поиск..."
                class="w-full px-3 py-1.5 text-sm border border-border rounded-lg outline-none focus:border-primary bg-background"
              />
            </div>
            <div class="overflow-y-auto flex-1 py-1">
              <div
                v-for="s in filteredStudents"
                :key="s.id"
                class="px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors hover:bg-muted/50"
                :class="{ 'bg-primary/10': selectedIds.includes(s.id) }"
                @click="toggleStudent(s.id)"
              >
                <div
                  class="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                  :class="selectedIds.includes(s.id) ? 'bg-primary border-primary' : 'border-border'"
                >
                  <IconCheck v-if="selectedIds.includes(s.id)" class="w-3 h-3 text-primary-foreground" />
                </div>
                {{ s.fullName }}
              </div>
              <div v-if="filteredStudents.length === 0" class="px-4 py-3 text-sm text-muted-foreground text-center">
                Ничего не найдено
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transcripts -->
    <div
      v-if="selectedIds.length === 0"
      class="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground"
    >
      Выберите обучающихся для просмотра транскриптов
    </div>

    <div
      v-for="studentId in selectedIds"
      :key="studentId"
      class="bg-card border border-border rounded-xl overflow-hidden"
    >
      <template v-if="getTranscript(studentId) as transcript">
        <!-- Student header -->
        <div class="px-6 py-5 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 class="text-lg font-bold text-foreground">
              {{ transcript.fullName }}
            </h3>
            <p class="text-sm text-muted-foreground">
              Год поступления: {{ transcript.enrollmentYear }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-muted-foreground font-medium">Кумулятивный GPA</p>
            <p class="text-2xl font-bold text-foreground">{{ transcript.cumulativeGpa.toFixed(2) }}</p>
          </div>
        </div>

        <!-- Transcript table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th class="px-4 py-3 text-center w-10">№</th>
                <th class="px-4 py-3 text-left">Дисциплина</th>
                <th class="px-4 py-3 text-center w-20">Кредиты</th>
                <th class="px-4 py-3 text-center w-20">Оценка (%)</th>
                <th class="px-4 py-3 text-center w-16">Буква</th>
                <th class="px-4 py-3 text-center w-32">Традиционная</th>
                <th class="px-4 py-3 text-center w-16">GPA</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="(row, idx) in transcript.rows"
                :key="row.disciplineId"
                class="hover:bg-muted/20 transition-colors"
              >
                <td class="px-4 py-3 text-center text-muted-foreground">{{ idx + 1 }}</td>
                <td class="px-4 py-3 font-medium text-foreground">{{ row.title }}</td>
                <td class="px-4 py-3 text-center">{{ row.credits }}</td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex items-center justify-center w-10 h-8 rounded-lg text-xs font-bold"
                    :class="gradeColor(row.score)"
                  >
                    {{ row.score !== null ? row.score.toFixed(0) : '—' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center font-bold">{{ row.letter }}</td>
                <td class="px-4 py-3 text-center text-xs">{{ row.traditional }}</td>
                <td class="px-4 py-3 text-center font-semibold">{{ row.gpa }}</td>
              </tr>
            </tbody>
            <tfoot class="border-t-2 border-border bg-muted/30">
              <tr>
                <td colspan="2" class="px-4 py-3 font-semibold text-foreground">Итого</td>
                <td class="px-4 py-3 text-center font-semibold">
                  {{ transcript.rows.reduce((sum, r) => sum + r.credits, 0) }}
                </td>
                <td colspan="3"></td>
                <td class="px-4 py-3 text-center font-bold text-foreground">
                  {{ transcript.cumulativeGpa.toFixed(2) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconCheck from "~icons/lucide/check";
import type { Mark } from "@/types/marks";

interface StudentInfo {
  id: string;
  fullName: string;
  enrollmentYear: string;
}

interface JournalInfo {
  id: string;
  title: string;
}

const props = defineProps<{
  students: StudentInfo[];
  journals: JournalInfo[];
  getStudentMarks: (journalId: string, studentId: string) => Mark[] | null;
}>();

const yearFrom = ref("");
const yearTo = ref("");
const search = ref("");
const selectedIds = ref<string[]>([]);
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const filteredStudents = computed(() =>
  props.students.filter((s) => {
    const matchSearch = s.fullName.toLowerCase().includes(search.value.toLowerCase());
    const matchFrom = yearFrom.value ? parseInt(s.enrollmentYear) >= parseInt(yearFrom.value) : true;
    const matchTo = yearTo.value ? parseInt(s.enrollmentYear) <= parseInt(yearTo.value) : true;
    return matchSearch && matchFrom && matchTo;
  })
);

const toggleStudent = (id: string) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((s) => s !== id)
    : [...selectedIds.value, id];
};

const getGradeDetails = (score: number) => {
  if (score >= 95) return { letter: "A", gpa: "4.0", traditional: "Отлично" };
  if (score >= 90) return { letter: "A-", gpa: "3.67", traditional: "Отлично" };
  if (score >= 85) return { letter: "B+", gpa: "3.33", traditional: "Хорошо" };
  if (score >= 80) return { letter: "B", gpa: "3.0", traditional: "Хорошо" };
  if (score >= 75) return { letter: "B-", gpa: "2.67", traditional: "Хорошо" };
  if (score >= 70) return { letter: "C+", gpa: "2.33", traditional: "Удовлетворительно" };
  if (score >= 65) return { letter: "C", gpa: "2.0", traditional: "Удовлетворительно" };
  if (score >= 60) return { letter: "C-", gpa: "1.67", traditional: "Удовлетворительно" };
  if (score >= 55) return { letter: "D+", gpa: "1.33", traditional: "Удовлетворительно" };
  if (score >= 50) return { letter: "D", gpa: "1.0", traditional: "Удовлетворительно" };
  return { letter: "F", gpa: "0.0", traditional: "Неудовлетворительно" };
};

const gradeColor = (score: number | null) => {
  if (score === null) return "bg-muted text-muted-foreground";
  if (score >= 90) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  if (score >= 75) return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
  if (score >= 50) return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
};

const CREDITS_DEFAULT = 3;

const getTranscript = (studentId: string) => {
  const student = props.students.find((s) => s.id === studentId);
  if (!student) return null;

  const rows = props.journals
    .map((journal) => {
      const marks = props.getStudentMarks(journal.id, studentId);
      if (!marks) return null;

      const numericValues: number[] = [];
      marks.forEach((m: Mark) => {
        if (!Array.isArray(m.values)) return;
        m.values.forEach((v) => {
          const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
          if (Number.isFinite(n)) numericValues.push(n);
        });
      });

      if (numericValues.length === 0) return null;
      const score = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const details = getGradeDetails(score);
      return {
        disciplineId: journal.id,
        title: journal.title,
        credits: CREDITS_DEFAULT,
        score,
        ...details,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const totalCredits = rows.reduce((sum, r) => sum + r.credits, 0);
  const cumulativeGpa =
    totalCredits > 0
      ? rows.reduce((sum, r) => sum + parseFloat(r.gpa) * r.credits, 0) / totalCredits
      : 0;

  return {
    fullName: student.fullName,
    enrollmentYear: student.enrollmentYear,
    rows,
    cumulativeGpa,
  };
};

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false;
  }
};
onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));
</script>
```

- [ ] **Step 2: Commit**

```bash
cd /home/olge/SOFT/git/MARS/mars-2.0
git add src/components/AnalyticsTranscriptView.vue
git commit -m "feat: add AnalyticsTranscriptView component with letter grades and GPA"
```

---

## Task 6: Wire everything into analytics.vue

**Files:**
- Modify: `src/pages/analytics.vue`

This task has three sub-steps: add state+computed, add imports, update template.

- [ ] **Step 1: Add new state refs** — in the `<script setup>` section, after `const hasGeneratedReport = ref(false);` (around line 532), add:

```ts
const viewMode = ref<"ведомость" | "транскрипт">("ведомость");
const sheetType = ref<"успеваемость" | "посещаемость">("успеваемость");
```

- [ ] **Step 2: Add new computed properties** — after `const reportFinalForms = computed(...)` (around line 696), add:

```ts
// Stat card computed values
const analyticsAverageScore = computed<number | null>(() => {
  const scores = reportRows.value
    .map((r) => r.overallAverage)
    .filter((s): s is number => s !== null);
  return scores.length
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : null;
});

const analyticsAttendancePercent = computed<number | null>(() => {
  let present = 0;
  let total = 0;
  selectedAnalyticsStudents.value.forEach((student) => {
    relevantJournals.value.forEach((journal) => {
      const marks = marksStore.getStudentMarks(journal.id, student.id);
      if (!marks) return;
      marks
        .filter((m: Mark) => m.type === "date")
        .forEach((m: Mark) => {
          if (!Array.isArray(m.values)) return;
          m.values.forEach((v) => {
            if (v === null || v === undefined || v === "") return;
            total++;
            const s = String(v).trim().toLowerCase();
            if (s !== "н" && s !== "б" && s !== "0" && s !== "0.0") {
              present++;
            }
          });
        });
    });
  });
  return total > 0 ? (present / total) * 100 : null;
});

// Monthly dynamics for line chart
const analyticsMonthlyData = computed<{ month: string; avgScore: number }[]>(() => {
  const monthNames = [
    "Янв","Фев","Мар","Апр","Май","Июн",
    "Июл","Авг","Сен","Окт","Ноя","Дек",
  ];
  const byMonth: Record<number, number[]> = {};

  selectedAnalyticsStudents.value.forEach((student) => {
    relevantJournals.value.forEach((journal) => {
      const marks = marksStore.getStudentMarks(journal.id, student.id);
      if (!marks) return;
      marks
        .filter((m: Mark) => m.type === "date" && m.isoDate)
        .forEach((m: Mark) => {
          const month = new Date(m.isoDate!).getMonth();
          if (!Array.isArray(m.values)) return;
          m.values.forEach((v) => {
            const n =
              typeof v === "number"
                ? v
                : parseFloat(String(v).replace(",", "."));
            if (Number.isFinite(n)) {
              if (!byMonth[month]) byMonth[month] = [];
              byMonth[month].push(n);
            }
          });
        });
    });
  });

  return Object.entries(byMonth)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([monthIdx, values]) => ({
      month: monthNames[Number(monthIdx)],
      avgScore: values.reduce((a, b) => a + b, 0) / values.length,
    }));
});

// Flat list of overall averages for donut chart
const analyticsOverallAverages = computed<(number | null)[]>(() =>
  reportRows.value.map((r) => r.overallAverage)
);

// Props for sub-components
const attendanceStudents = computed(() =>
  selectedAnalyticsStudents.value.map((s) => ({
    id: s.id,
    fullName: s.fullName,
  }))
);

const attendanceJournals = computed(() =>
  relevantJournals.value.map((j) => ({ id: j.id, title: j.title }))
);

const transcriptStudents = computed(() =>
  selectedAnalyticsStudents.value.map((s) => {
    const raw = students.value.find((st) => st.id === s.id);
    const enrollYear = raw?.enrollmentYear
      ? String(raw.enrollmentYear)
      : "—";
    return { id: s.id, fullName: s.fullName, enrollmentYear: enrollYear };
  })
);
```

- [ ] **Step 3: Add new component imports** — in the `<script setup>` import block, after the existing component imports (around line 432), add:

```ts
import AnalyticsStatCards from "@/components/AnalyticsStatCards.vue";
import AnalyticsCharts from "@/components/AnalyticsCharts.vue";
import AnalyticsAttendanceSheet from "@/components/AnalyticsAttendanceSheet.vue";
import AnalyticsTranscriptView from "@/components/AnalyticsTranscriptView.vue";
```

- [ ] **Step 4: Update the template** — replace the existing page header block (the `<div class="flex flex-col md:flex-row ...analytics-page-header">` div, which ends before the `<div class="bg-card...">`card) with the new version that includes the toggle. Then add stat cards + charts + sheet toggle inside the card, and wrap the Транскрипт view. Full diff:

Find this block (lines ~19–43 in the template):
```html
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-3 analytics-page-header"
          >
            <div>
              <h1 class="text-2xl font-semibold">{{ analytics_title() }}</h1>
              <p class="text-sm text-muted-foreground">
                {{ analytics_subtitle() }}
              </p>
            </div>
            <div class="flex items-center gap-3">
              <Select
                v-model="selectedAcademicYearModel"
                :options="academicYearOptions"
                :placeholder="analytics_academic_year()"
                name="academic-year"
                class="w-44"
              />
              <Select
                v-model="selectedSemesterId"
                :options="semesterOptions"
                :placeholder="analytics_semester()"
                name="semester"
                class="w-44"
              />
            </div>
          </div>
```

Replace with:
```html
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-3 analytics-page-header"
          >
            <div class="flex items-center gap-4">
              <div>
                <h1 class="text-2xl font-semibold">{{ analytics_title() }}</h1>
                <p class="text-sm text-muted-foreground">
                  {{ analytics_subtitle() }}
                </p>
              </div>
              <div class="flex items-center bg-muted p-1 rounded-xl">
                <button
                  class="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
                  :class="viewMode === 'ведомость' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                  @click="viewMode = 'ведомость'"
                >
                  Ведомость
                </button>
                <button
                  class="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
                  :class="viewMode === 'транскрипт' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                  @click="viewMode = 'транскрипт'"
                >
                  Транскрипт
                </button>
              </div>
            </div>
            <div v-if="viewMode === 'ведомость'" class="flex items-center gap-3">
              <Select
                v-model="selectedAcademicYearModel"
                :options="academicYearOptions"
                :placeholder="analytics_academic_year()"
                name="academic-year"
                class="w-44"
              />
              <Select
                v-model="selectedSemesterId"
                :options="semesterOptions"
                :placeholder="analytics_semester()"
                name="semester"
                class="w-44"
              />
            </div>
          </div>
```

- [ ] **Step 5: Add stat cards + charts above the filter card** — find the line `<div class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md">` and insert before it (inside the `v-if="viewMode === 'ведомость'"` wrapper we're about to add):

Wrap the existing `<div class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md">` block (from that line through its closing `</div>`) in a `<template v-if="viewMode === 'ведомость'">` block, and prepend the stat cards and charts:

```html
          <template v-if="viewMode === 'ведомость'">
            <AnalyticsStatCards
              :average-score="analyticsAverageScore"
              :student-count="selectedAnalyticsStudents.length"
              :discipline-count="relevantJournals.length"
              :attendance-percent="analyticsAttendancePercent"
            />

            <AnalyticsCharts
              :monthly-data="analyticsMonthlyData"
              :overall-averages="analyticsOverallAverages"
            />

            <!-- existing filter card starts here -->
            <div class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md">
              <!-- ... all existing content unchanged ... -->
```

And after the existing report section (before the closing `</div>` of the outer `<div class="flex flex-col gap-4">`), add the sheet toggle and attendance sheet, and close the template:

```html
              <!-- Sheet type toggle + attendance sheet -->
              <div class="mt-4 flex items-center gap-3">
                <div class="flex items-center bg-muted p-1 rounded-xl">
                  <button
                    class="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
                    :class="sheetType === 'успеваемость' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                    @click="sheetType = 'успеваемость'"
                  >
                    Ведомость успеваемости
                  </button>
                  <button
                    class="px-4 py-1.5 text-sm font-medium rounded-lg transition-all"
                    :class="sheetType === 'посещаемость' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
                    @click="sheetType = 'посещаемость'"
                  >
                    Ведомость посещаемости
                  </button>
                </div>
              </div>

              <AnalyticsAttendanceSheet
                v-if="sheetType === 'посещаемость'"
                :students="attendanceStudents"
                :journals="attendanceJournals"
                :get-student-marks="marksStore.getStudentMarks"
              />
            </div>
            <!-- end of ведомость template -->
          </template>

          <template v-if="viewMode === 'транскрипт'">
            <AnalyticsTranscriptView
              :students="transcriptStudents"
              :journals="attendanceJournals"
              :get-student-marks="marksStore.getStudentMarks"
            />
          </template>
```

> **Note on the existing report preview section:** it should remain inside the `bg-card` filter card div, nested under the existing `v-if="hasGeneratedReport"` guard, and only visible in `sheetType === 'успеваемость'` mode. Add `v-if="hasGeneratedReport && sheetType === 'успеваемость'"` to the report preview div.

- [ ] **Step 6: Check for TypeScript errors**

```bash
cd /home/olge/SOFT/git/MARS/mars-2.0
npx tsc --noEmit 2>&1 | head -40
```

Fix any type errors before committing.

- [ ] **Step 7: Commit**

```bash
cd /home/olge/SOFT/git/MARS/mars-2.0
git add src/pages/analytics.vue
git commit -m "feat: wire analytics sub-components into analytics.vue with viewMode and sheetType"
```

---

## Task 7: Visual Verification

**Files:** none

- [ ] **Step 1: Start dev server**

```bash
cd /home/olge/SOFT/git/MARS/mars-2.0
bun run dev &
```

Wait for "ready" message.

- [ ] **Step 2: Navigate to analytics page and take screenshot**

Using Playwright MCP tools (browser_navigate + browser_take_screenshot):
1. Navigate to the analytics page (typically `http://localhost:5173/analytics` or equivalent dev URL)
2. Take a screenshot of the full page
3. Verify stat cards (4 boxes), charts (2 charts), and the Ведомость/Транскрипт toggle are visible
4. Click "Транскрипт" tab → verify TranscriptView renders (student picker appears)
5. Click "Ведомость посещаемости" tab → verify attendance controls appear

- [ ] **Step 3: Fix any visual regressions**

If any existing content (filters, report table, export button) is missing or broken, fix before declaring done.

- [ ] **Step 4: Stop dev server**

```bash
kill %1
```
