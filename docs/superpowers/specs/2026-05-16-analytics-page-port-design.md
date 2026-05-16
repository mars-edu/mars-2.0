# Analytics Page Port Design

**Date:** 2026-05-16  
**Source:** concept/components/AnalyticsView.tsx + TranscriptView.tsx  
**Target:** mars-2.0/src/pages/analytics.vue

---

## Goal

Port six missing UI sections from the concept's `AnalyticsView` into the mars-2.0 `analytics.vue`, wiring all data to real Convex-backed stores instead of mock data.

---

## Features to Port

1. **View mode toggle** — Ведомость / Транскрипт tab switcher at page header
2. **Stat cards** — 4 summary cards: средний балл, студентов, дисциплин, посещаемость
3. **Charts** — line chart (monthly score dynamics) + donut chart (grade distribution)
4. **Sheet type toggle** — Ведомость успеваемости / посещаемости inside Ведомость mode
5. **Attendance sheet** — per-student per-discipline attendance grid
6. **TranscriptView** — student transcript with letter grades, GPA, credits

---

## Architecture

`analytics.vue` stays the orchestrator. New features are extracted into focused sub-components to keep the file manageable.

```
analytics.vue
├── AnalyticsStatCards.vue       (new)
├── AnalyticsCharts.vue          (new)
├── [existing filters + accordion + AnalyticsReportTable]   ← Ведомость успеваемости
├── AnalyticsAttendanceSheet.vue (new)   ← Ведомость посещаемости
└── AnalyticsTranscriptView.vue  (new)   ← Транскрипт mode
```

### New state in analytics.vue

```ts
const viewMode = ref<'ведомость' | 'транскрипт'>('ведомость')
const sheetType = ref<'успеваемость' | 'посещаемость'>('успеваемость')
```

---

## Dependency

Install `vue3-apexcharts` + `apexcharts` for charts:

```
bun add apexcharts vue3-apexcharts
```

Register globally in `src/main.ts` or locally in `AnalyticsCharts.vue`.

---

## Component Specs

### 1. AnalyticsStatCards.vue

**Props:**
- `averageScore: number | null`
- `studentCount: number`
- `disciplineCount: number`
- `attendancePercent: number | null`

**Computed in analytics.vue then passed down:**

```ts
const analyticsAverageScore = computed(() => {
  const scores = reportRows.value
    .map(r => r.overallAverage)
    .filter((s): s is number => s !== null)
  return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null
})

const analyticsAttendancePercent = computed(() => {
  // iterate selectedAnalyticsStudents × relevantJournals
  // call marksStore.getStudentMarks(journalId, studentId)
  // filter marks where type === 'date'
  // count values that are non-null and not 'н'/'б'/absence markers
  // return present / total * 100
})
```

**UI:** 4 cards in a responsive grid (1 col mobile, 4 col desktop), each with colored icon background + label + value. Colors match concept: emerald (avg), blue (students), purple (disciplines), orange (attendance).

---

### 2. AnalyticsCharts.vue

**Props:**
- `rows: ReportTableRow[]`
- `monthlyData: { month: string; avgScore: number }[]`

**`monthlyData` computed in analytics.vue:**

```ts
const analyticsMonthlyData = computed(() => {
  // For each journal in relevantJournals:
  //   for each student in selectedAnalyticsStudents:
  //     get date-type marks → group by isoDate month (YYYY-MM)
  //     compute average mark value per month
  // Merge across all disciplines, average per month
  // Return sorted array of { month: 'Сен', avgScore: number }
})
```

**Charts (ApexCharts):**
- **Line chart** — X axis: months, Y axis: avg score (0–100). Series: `[{ name: 'Успеваемость', data: [...] }]`. Style: smooth curve, no grid lines on X.
- **Donut chart** — Buckets from `rows[*].overallAverage`: A (≥90), B (75–89), C (50–74), F (<50). Colors: `['#10B981', '#3B82F6', '#F59E0B', '#EF4444']`.

---

### 3. AnalyticsAttendanceSheet.vue

**Props:**
- `students: { id: string; fullName: string }[]`
- `journals: { id: string; title: string }[]`
- `getStudentMarks: (journalId: string, studentId: string) => Mark[] | null`
- `period: string` (month name, e.g. 'Сентябрь')
- `year: string`
- `semester: string`

**State:**
```ts
const attendancePeriod = ref('Сентябрь')
const attendanceYear = ref('2025-2026')
const attendanceSemester = ref('1 семестр')
const isGenerated = ref(false)
const selectedStudentIds = ref<string[]>([])
```

**UI:** Period/year/semester selects + "Сформировать" button. On click: for each selected student, render one card per discipline showing a row of date cells. Date cells extracted from `date`-type marks filtered to the selected month. Cell value: `+` (present), `-` (absent/н/б), blank (no record). Column headers: `dd.MM` formatted from `isoDate`.

**Absence detection:** A mark value counts as absent if it equals `'н'`, `'б'`, `0`, or `'0'`; all other non-null values count as present.

---

### 4. AnalyticsTranscriptView.vue

**Props:**
- `students: { id: string; fullName: string; enrollmentYear: string }[]`
- `journals: { id: string; title: string; studentIds: string[] }[]`
- `getStudentMarks: (journalId: string, studentId: string) => Mark[] | null`

**State:** student multi-select with search, year-from/year-to filters.

**Grade mapping** (score → letter/GPA/traditional):
```
≥95 → A / 4.0 / Отлично
≥90 → A- / 3.67 / Отлично
≥85 → B+ / 3.33 / Хорошо
≥80 → B / 3.0 / Хорошо
≥75 → B- / 2.67 / Хорошо
≥70 → C+ / 2.33 / Удовлетворительно
≥65 → C / 2.0 / Удовлетворительно
≥60 → C- / 1.67 / Удовлетворительно
≥55 → D+ / 1.33 / Удовлетворительно
≥50 → D / 1.0 / Удовлетворительно
<50  → F / 0.0 / Неудовлетворительно
```

**UI per student:** Header card (name, specialty, enrollment year, cumulative GPA). Table with columns: №, Дисциплина, Кредиты, Оценка (%), Буква, Традиционная, GPA. Footer row: cumulative GPA = weighted average of per-discipline GPA × credits.

**Credits:** Use discipline hours from journal/RUP data if available; fall back to 3 credits per discipline.

---

## UI Layout Changes in analytics.vue

```
[Page header]
  <h1>Аналитика</h1>
  [Ведомость | Транскрипт] toggle   ← new
  [year select] [semester select]   ← existing, hide in Транскрипт mode

[if viewMode === 'ведомость']
  <AnalyticsStatCards />            ← new, shown always in Ведомость
  <AnalyticsCharts />               ← new, shown always in Ведомость
  [existing filter card (accordion)]
  [generate + export buttons]
  [Ведомость успеваемости | посещаемости] toggle  ← new
  [if sheetType === 'успеваемость']
    [existing AnalyticsReportTable section]
  [if sheetType === 'посещаемости']
    <AnalyticsAttendanceSheet />    ← new

[if viewMode === 'транскрипт']
  <AnalyticsTranscriptView />       ← new
```

---

## Styling

Follow existing mars-2.0 patterns:
- Cards: `bg-card rounded-xl border border-border shadow-sm`
- Text: `text-foreground`, `text-muted-foreground`
- Primary accent: `text-primary`, `ring-primary`, `bg-primary/10`
- Tailwind utilities only, no scoped CSS unless required by ApexCharts theming

---

## Out of Scope

- Download/export for attendance sheet (UI button can appear disabled or hidden)
- Real credit data from RUP (fall back to 3 per discipline)
- Attendance "generate" triggering a backend query (local computation from already-loaded marks is sufficient)
