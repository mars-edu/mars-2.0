<template>
  <f7-page
    name="reports"
    class="reports-page flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />
    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div
      class="flex flex-1 overflow-hidden p-2 md:p-4 transition-all duration-200"
      :class="contentMargin"
    >
      <div class="flex-1 flex flex-col min-h-0 rounded-2xl border border-border/10 overflow-hidden bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">

        <!-- Title row -->
        <div class="flex items-center justify-between px-8 py-6 pb-2 shrink-0">
          <h1 class="text-xl font-bold text-foreground whitespace-nowrap">{{ reports_workload_title() }}</h1>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto p-6 pb-16 md:pb-6">
          <div class="w-full space-y-6 pb-8 max-w-6xl mx-auto">

            <!-- Controls Card -->
            <div class="p-4 rounded-lg shadow-sm border border-border bg-card space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                <div v-if="userStore.isAdmin" class="flex flex-col">
                  <div class="text-xs font-medium text-muted-foreground mb-1">{{ reports_teacher() }}</div>
                  <Select
                    id="reports-teacher-select"
                    v-model="selectedTeacherId"
                    :options="teacherOptions"
                    :placeholder="reports_teacher_placeholder()"
                    :search-placeholder="reports_teacher_search()"
                  />
                </div>

                <Select
                  v-model="selectedAcademicYearId"
                  :options="academicYearOptions"
                  :label="reports_academic_year()"
                  :placeholder="reports_academic_year_placeholder()"
                  name="academic-year"
                />

                <Select
                  v-model="selectedPeriod"
                  :options="periodOptions"
                  :label="reports_period()"
                  :placeholder="reports_period_placeholder()"
                  name="period"
                />

                <div class="flex flex-col gap-2">
                  <button
                    @click="generateWorkloadReport"
                    :disabled="isGenerating || !selectedTeacherId"
                    class="w-auto flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    <span
                      v-if="isGenerating"
                      class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    ></span>
                    <FileText v-else class="w-4 h-4" />
                    <span>{{ isGenerating ? reports_generating() : reports_generate_btn() }}</span>
                  </button>

                  <button
                    v-if="reportData"
                    @click="downloadReport"
                    class="w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm"
                  >
                    <Download class="w-4 h-4" />
                    <span>{{ journal_download() }}</span>
                  </button>
                </div>
              </div>

              <div
                v-if="lastGeneratedReport"
                class="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <p class="text-sm text-green-800 dark:text-green-200">{{ reports_success() }}</p>
                <p class="text-xs text-green-600 dark:text-green-300 mt-1">{{ lastGeneratedReport }}</p>
              </div>
            </div>

            <!-- Report Preview -->
            <Transition name="fade" mode="out-in">
              <div v-if="reportData" class="space-y-6">

                <!-- Report Header Paper -->
                <div class="bg-card p-6 md:p-10 rounded-lg shadow-sm border border-border text-center space-y-6 relative overflow-hidden">
                  <div class="absolute -right-10 -top-10 opacity-5 rotate-12 pointer-events-none">
                    <span class="text-9xl font-black italic tracking-tighter">MARS</span>
                  </div>
                  <div class="space-y-4 max-w-3xl mx-auto">
                    <p class="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold leading-relaxed">
                      {{ institutionName }}
                    </p>
                    <h2 class="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                      Ведомость учета учебного времени педагога за год
                    </h2>
                    <div class="pt-6 flex flex-col items-center gap-2">
                      <p class="font-bold text-lg md:text-xl text-primary">{{ reportData.teacherFullName }}</p>
                      <p class="text-muted-foreground font-medium bg-muted px-4 py-1 rounded-full text-sm">
                        {{ reportData.academicYear }} учебный год
                      </p>
                    </div>
                    <div v-if="subjectsList" class="mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
                      <p class="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Перечисление основных предметов проведенных:</p>
                      <p class="text-xs md:text-sm text-foreground/80 leading-relaxed italic">{{ subjectsList }}</p>
                    </div>
                  </div>
                </div>

                <!-- Table 1: Monthly Breakdown -->
                <div class="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                  <div class="p-5 border-b border-border flex items-center justify-between bg-muted/50">
                    <h3 class="font-bold text-sm md:text-base">Таблица 1. Распределение часов по месяцам</h3>
                    <span class="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">Ф-1</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr class="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                          <th class="px-4 py-4 border-b border-r border-border min-w-[200px]">Группы / Дисциплины</th>
                          <th v-for="m in reportData.months" :key="m.key" class="px-2 py-4 border-b border-r border-border text-center w-14">
                            {{ getShortMonthName(m.month) }}
                          </th>
                          <th class="px-4 py-4 border-b border-border text-center bg-muted/80 w-20">Итого</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border">
                        <tr v-for="(row, idx) in reportData.monthlyDistribution" :key="idx" class="hover:bg-muted/40 transition-colors">
                          <td class="px-4 py-3 border-r border-border">
                            <div class="font-bold text-foreground text-sm">{{ row.groupName }}</div>
                            <div class="text-[11px] text-muted-foreground/70 leading-tight mt-0.5">{{ getSubjectNamesForGroup(row.groupName) }}</div>
                          </td>
                          <td v-for="m in reportData.months" :key="m.key" class="px-2 py-3 border-r border-border text-center font-medium text-sm">
                            {{ row.monthlyHours[m.key] || '-' }}
                          </td>
                          <td class="px-4 py-3 text-center font-bold bg-muted/20 text-sm">{{ row.total }}</td>
                        </tr>
                        <tr class="bg-muted/50 font-bold">
                          <td class="px-4 py-4 border-r border-border uppercase text-[10px]">Всего выполнено:</td>
                          <td v-for="m in reportData.months" :key="m.key" class="px-2 py-4 border-r border-border text-center text-primary text-sm">
                            {{ calculateColumnTotal(m.key) }}
                          </td>
                          <td class="px-4 py-4 text-center text-base text-primary">{{ reportData.monthlyDistribution.reduce((s, r) => s + r.total, 0) }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <!-- Summary Footer -->
                  <div class="p-6 bg-muted/10 border-t border-border">
                    <div class="max-w-2xl space-y-3">
                      <div class="flex justify-between items-center py-2 border-b border-border/50">
                        <span class="text-sm text-muted-foreground">Всего часов по плану:</span>
                        <span class="font-bold text-base">{{ totalPlannedHours }}</span>
                      </div>
                      <div class="flex justify-between items-center py-2 border-b border-border/50">
                        <span class="text-sm text-muted-foreground">Не выполнено часов:</span>
                        <span class="font-bold text-destructive">{{ Math.max(0, totalPlannedHours - totalFactHours) }}</span>
                      </div>
                      <div class="flex justify-between items-center py-2 border-b border-border/50">
                        <span class="text-sm text-muted-foreground">Выполнено часов:</span>
                        <div class="flex items-center gap-2">
                          <span class="font-bold text-base">{{ totalFactHours }}</span>
                          <span v-if="totalFactHours > totalPlannedHours" class="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold">
                            +{{ totalFactHours - totalPlannedHours }}
                          </span>
                        </div>
                      </div>
                      <div class="flex justify-between items-center py-4 bg-card px-6 rounded-lg shadow-sm border border-border mt-4">
                        <span class="font-bold text-foreground">Всего дано за год часов:</span>
                        <span class="text-2xl font-black text-primary">{{ totalFactHours }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Table 2: Additional Details -->
                <div class="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
                  <div class="p-5 border-b border-border flex items-center justify-between bg-muted/50">
                    <h3 class="font-bold text-sm md:text-base">Таблица 2. Дополнительные сведения к годовому учету</h3>
                    <span class="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">Ф-2</span>
                  </div>
                  <div class="overflow-x-auto">
                    <table class="w-full text-sm text-left border-collapse min-w-[800px]">
                      <thead>
                        <tr class="bg-muted/50 text-muted-foreground uppercase text-[10px] font-bold tracking-wider">
                          <th rowspan="2" class="px-4 py-4 border-b border-r border-border min-w-[150px]">Группа / ФИО студента</th>
                          <th rowspan="2" class="px-4 py-4 border-b border-r border-border min-w-[200px]">Дисциплина</th>
                          <th colspan="2" class="px-4 py-2 border-b border-r border-border text-center">Часы</th>
                          <th colspan="2" class="px-4 py-2 border-b border-r border-border text-center">Консультации</th>
                          <th colspan="2" class="px-4 py-2 border-b border-r border-border text-center">Экзамены</th>
                          <th rowspan="2" class="px-4 py-4 border-b border-border text-center bg-muted/80">Общее</th>
                        </tr>
                        <tr class="bg-muted/50 text-muted-foreground text-[9px] font-bold">
                          <th class="px-2 py-2 border-b border-r border-border text-center">План</th>
                          <th class="px-2 py-2 border-b border-r border-border text-center">Факт</th>
                          <th class="px-2 py-2 border-b border-r border-border text-center">План</th>
                          <th class="px-2 py-2 border-b border-r border-border text-center">Факт</th>
                          <th class="px-2 py-2 border-b border-r border-border text-center">План</th>
                          <th class="px-2 py-2 border-b border-r border-border text-center">Факт</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-border">
                        <tr v-for="(row, idx) in reportData.summaryEntries" :key="idx" class="hover:bg-muted/40 transition-colors">
                          <td class="px-4 py-3 border-r border-border font-bold text-sm">{{ row.groupName }}</td>
                          <td class="px-4 py-3 border-r border-border text-[11px] text-muted-foreground/70 leading-snug">{{ row.subjectName }}</td>
                          <td class="px-2 py-3 border-r border-border text-center text-sm">{{ row.plannedHours }}</td>
                          <td class="px-2 py-3 border-r border-border text-center font-bold text-sm">{{ row.actualHours }}</td>
                          <td class="px-2 py-3 border-r border-border text-center text-muted-foreground/50 text-sm">{{ row.consultationsPlanned || '-' }}</td>
                          <td class="px-2 py-3 border-r border-border text-center text-muted-foreground/50 text-sm">{{ row.consultationsActual || '-' }}</td>
                          <td class="px-2 py-3 border-r border-border text-center text-muted-foreground/50 text-sm">{{ row.examsPlanned || '-' }}</td>
                          <td class="px-2 py-3 border-r border-border text-center text-muted-foreground/50 text-sm">{{ row.examsActual || '-' }}</td>
                          <td class="px-4 py-3 text-center font-bold bg-muted/20 text-sm">{{ row.totalHours }}</td>
                        </tr>
                        <tr class="bg-muted/50 font-bold">
                          <td colspan="2" class="px-4 py-4 border-r border-border uppercase text-[10px]">Итого:</td>
                          <td class="px-2 py-4 border-r border-border text-center text-sm">{{ totalPlannedHours }}</td>
                          <td class="px-2 py-4 border-r border-border text-center text-primary text-sm">{{ totalFactHours }}</td>
                          <td class="px-2 py-4 border-r border-border text-center text-muted-foreground text-sm">-</td>
                          <td class="px-2 py-4 border-r border-border text-center text-muted-foreground text-sm">-</td>
                          <td class="px-2 py-4 border-r border-border text-center text-muted-foreground text-sm">-</td>
                          <td class="px-2 py-4 border-r border-border text-center text-muted-foreground text-sm">-</td>
                          <td class="px-4 py-4 text-center text-base text-primary">{{ totalFactHours }}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Footer Signatures -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pt-10 pb-8">
                  <div class="space-y-1">
                    <p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Оқытушы / Преподаватель</p>
                    <div class="border-b-2 border-border/50 flex justify-between items-end pb-1 pt-4">
                      <span class="text-sm font-semibold">{{ reportData.teacherFullName }}</span>
                      <span class="text-[10px] text-muted-foreground/60 italic tracking-wide">қолы / подпись</span>
                    </div>
                  </div>
                  <div class="space-y-1">
                    <p class="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Оқу ісі жөніндегі басшының орынбасары / Заместитель руководителя по учебной работе</p>
                    <div class="border-b-2 border-border/50 flex justify-between items-end pb-1 pt-4">
                      <span class="text-sm font-semibold opacity-30">______________________________________</span>
                      <span class="text-[10px] text-muted-foreground/60 italic tracking-wide">қолы / подпись</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else class="bg-card p-12 md:p-20 rounded-lg shadow-sm border border-border flex flex-col items-center justify-center text-center space-y-6">
                <div class="w-20 h-20 md:w-28 md:h-28 bg-primary/5 rounded-full flex items-center justify-center text-primary/40 ring-1 ring-primary/10">
                  <FileSpreadsheet class="w-10 h-10 md:w-14 md:h-14" />
                </div>
                <div class="space-y-2">
                  <h3 class="text-xl md:text-2xl font-bold text-foreground">Готов к формированию</h3>
                  <p class="text-muted-foreground max-w-sm mx-auto text-sm md:text-base leading-relaxed">
                    {{ reports_select_teacher() }}
                  </p>
                </div>
                <button
                  @click="generateWorkloadReport"
                  :disabled="isGenerating || !selectedTeacherId"
                  class="w-auto flex items-center gap-2 px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText class="w-4 h-4" />
                  {{ reports_generate_btn() }}
                </button>
              </div>
            </Transition>

          </div>
        </div>

      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from "vue";
import { f7Page, f7 } from "framework7-vue";
import { FileText, Download, FileSpreadsheet } from "lucide-vue-next";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import { useTeacherStore } from "@/stores/teacherStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useUserStore } from "@/stores/userStore";
import { useJournalStore } from "@/stores/journalStore";
import { useMarksStore } from "@/stores/marksStore";
import {
  exportTeacherWorkloadViaConvex,
  type WorkloadExportParams,
} from "@/services/convex-excel-export";
import { useSidebar } from "@/composables/useSidebar";
import {
  reports_workload_title,
  reports_teacher,
  reports_teacher_placeholder,
  reports_teacher_search,
  reports_academic_year,
  reports_academic_year_placeholder,
  reports_period,
  reports_period_placeholder,
  reports_generating,
  reports_generate_btn,
  reports_success,
  reports_select_teacher,
  reports_no_schedule,
  reports_full_year,
  reports_semester_period,
  reports_generate_error,
  reports_no_months_error,
  reports_period_full_year_label,
  reports_period_semester_label,
  reports_period_filename_full,
  reports_period_filename_sem,
  reports_period_display_full,
  reports_period_display_sem,
  common_not_specified,
  journal_download,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";
import {
  generateWorkloadSummary,
  generateMonthlyDistribution,
  computeMonthsFromSemesters,
  generateAllMonthsWorkload,
} from "@/services/teacher-workload-calculator";

const { locale } = useI18n();
const { contentMargin } = useSidebar();

type WorkloadEntry = WorkloadExportParams["entries"][number];
type WorkloadSummaryEntry = WorkloadExportParams["summaryEntries"][number];
type MonthlyDistributionEntry = WorkloadExportParams["monthlyDistribution"][number];
type TeacherWorkloadExportPayload = WorkloadExportParams;

const activeNavItem = ref("reports");
const userStore = useUserStore();
const teacherStore = useTeacherStore();
const academicYearStore = useAcademicYearStore();
const calendarStore = useCalendarStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const rupEntryStore = useRupEntryStore();
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const journalStore = useJournalStore();
const marksStore = useMarksStore();

const selectedTeacherId = ref("");
const selectedAcademicYearId = ref("");
const selectedPeriod = ref("full_year");
const isGenerating = ref(false);
const lastGeneratedReport = ref("");
const reportData = ref<TeacherWorkloadExportPayload | null>(null);

const institutionName = '"Музыкалық колледж - дарынды балаларға арналған музыкалық мектеп - интернат" Кешені ММ / ГУ "Комплекс "Музыкальный колледж - музыкальная школа - интернат для одарённых детей"';

const teachers = computed(() => teacherStore.teachers);
const academicYears = computed(() => academicYearStore.academicYears);

const teacherOptions = computed(() =>
  teachers.value.map((teacher) => ({
    value: teacher.id,
    text: teacherStore.getTeacherFullName(teacher),
  }))
);

const selectedTeacher = computed(() => {
  const id = selectedTeacherId.value;
  if (!id) return undefined;
  return (
    teachers.value.find((t) => t.id === id) ??
    teachers.value.find((t) => t.userId === id)
  );
});

const selectedTeacherUserId = computed(() => {
  if (selectedTeacher.value?.userId) return selectedTeacher.value.userId;
  if (userStore.isTeacher) return userStore.currentUser?.id;
  return undefined;
});

const academicYearOptions = computed(() =>
  academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }))
);

const availableSemesters = computed(() => {
  if (!selectedAcademicYearId.value) {
    return [];
  }
  return academicYearSemesterStore
    .getAcademicYearSemestersByAcademicYear(selectedAcademicYearId.value)
    .sort((a, b) => a.semesterNumber - b.semesterNumber);
});

const periodOptions = computed(() => {
  const options = [
    {
      value: "full_year",
      text: reports_full_year(),
    },
  ];

  availableSemesters.value.forEach((semester) => {
    options.push({
      value: semester.id,
      text: reports_semester_period({ number: semester.semesterNumber }),
    });
  });

  return options;
});

const getTeacherFullName = (teacher: any) => {
  return teacherStore.getTeacherFullName(teacher);
};

const subjectsList = computed(() => {
  if (!reportData.value) return "";
  const subjects = [...new Set(reportData.value.summaryEntries.map(e => e.subjectName))];
  return subjects.join(", ");
});

const totalPlannedHours = computed(() => {
  if (!reportData.value) return 0;
  return reportData.value.summaryEntries.reduce((sum, entry) => sum + entry.plannedHours, 0);
});

const totalFactHours = computed(() => {
  if (!reportData.value) return 0;
  return reportData.value.summaryEntries.reduce((sum, entry) => sum + entry.actualHours, 0);
});

function getShortMonthName(month: number) {
  const names = [
    f7_month_jan(), f7_month_feb(), f7_month_mar(), f7_month_apr(),
    f7_month_may(), f7_month_jun(), f7_month_jul(), f7_month_aug(),
    f7_month_sep(), f7_month_oct(), f7_month_nov(), f7_month_dec(),
  ];
  const name = names[month];
  // Return first 3-4 chars or formatted version
  return name.length > 5 ? name.substring(0, 4) + '.' : name;
}

function calculateColumnTotal(monthKey: string) {
  if (!reportData.value) return 0;
  return reportData.value.monthlyDistribution.reduce((sum, row) => sum + (row.monthlyHours[monthKey] || 0), 0);
}

function getSubjectNamesForGroup(groupName: string) {
  if (!reportData.value) return "";
  const entries = reportData.value.summaryEntries.filter(e => e.groupName === groupName);
  return entries.map(e => e.subjectName).join(", ");
}

async function generateWorkloadReport() {
  if (!selectedTeacherId.value) {
    f7.dialog.alert(reports_select_teacher());
    return;
  }

  isGenerating.value = true;
  reportData.value = null;

  try {
    // Wait for required data to load
    let attempts = 0;
    const maxAttempts = 30;

    while (attempts < maxAttempts) {
      const eventsLoaded = calendarStore.events && calendarStore.events.length > 0;
      const rupEntryLoaded = rupEntryStore.items && rupEntryStore.items.length > 0;
      const studentsLoaded = studentStore.students && studentStore.students.length > 0;

      if (eventsLoaded && rupEntryLoaded && studentsLoaded) break;
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!calendarStore.events || calendarStore.events.length === 0) {
      f7.dialog.alert(reports_no_schedule());
      return;
    }

    const teacher = selectedTeacher.value;
    const academicYear = selectedAcademicYearId.value
      ? academicYears.value.find((y) => y.id === selectedAcademicYearId.value)
      : academicYears.value.find((y) => y.isActive);

    if (!academicYear) {
      throw new Error("Academic year is not selected and no active year found");
    }

    // Filter events by teacher
    const teacherIdCandidates = new Set<string>();
    teacherIdCandidates.add(selectedTeacherId.value);
    if (selectedTeacherUserId.value) teacherIdCandidates.add(selectedTeacherUserId.value);
    if (teacher?.id) teacherIdCandidates.add(teacher.id);
    if (teacher?.userId) teacherIdCandidates.add(teacher.userId);

    const teacherEvents = calendarStore.events.filter((e) =>
      teacherIdCandidates.has(e.teacherId || "")
    );

    // Get period date range for filtering
    let filterStartDate: Date | undefined;
    let filterEndDate: Date | undefined;

    if (selectedPeriod.value !== "full_year") {
      const semester = availableSemesters.value.find(
        (s) => s.id === selectedPeriod.value
      );
      if (semester) {
        filterStartDate = new Date(semester.startDate);
        filterEndDate = new Date(semester.endDate);
      }
    } else {
      // full_year: bound the window to the SELECTED academic year's span, else
      // generateWorkloadSummary sums events from ALL academic years (Form-2 bug).
      const sems = availableSemesters.value;
      if (sems.length) {
        filterStartDate = new Date(
          Math.min(...sems.map((s) => new Date(s.startDate).getTime()))
        );
        filterEndDate = new Date(
          Math.max(...sems.map((s) => new Date(s.endDate).getTime()))
        );
      } else {
        // Fallback: academic year Sep 1 (startYear) → Aug 31 (endYear).
        filterStartDate = new Date(academicYear.startYear, 8, 1);
        filterEndDate = new Date(academicYear.endYear, 7, 31);
      }
    }

    // Enrich students with course information
    const enrichedStudents = studentStore.students.map((student) => {
      const specialty = specialtyStore.getSpecialtyById(student.specialty);
      const specialtyLabel =
        specialty?.codeName?.trim() ||
        specialty?.code?.trim() ||
        specialty?.name?.trim() ||
        student.specialty;
      return {
        ...student,
        course: studentStore.getCourseByStudentId(student.id) ?? 1,
        specialty: specialtyLabel,
      };
    });

    const rupEntries = rupEntryStore.rupEntries;
    const semesterMonths = computeMonthsFromSemesters(availableSemesters.value);

    if (semesterMonths.length === 0) {
      throw new Error(reports_no_months_error());
    }

    const allJournals = Object.values(journalStore.journalsByCourse).flat();

    // Legacy single-month `generateDailyWorkload` removed — Form-1 in the
    // Excel exporter reads `allMonthsWorkload` (populateForm1MultiMonth), so
    // building one month here was dead code that also hardcoded September.

    const summaryEntries = generateWorkloadSummary(
      teacherEvents,
      rupEntries,
      enrichedStudents,
      filterStartDate,
      filterEndDate
    );

    const { distributions: monthlyDistribution, months: reportMonths } =
      generateMonthlyDistribution(teacherEvents, rupEntries, enrichedStudents, availableSemesters.value);

    const allMonthsWorkload = generateAllMonthsWorkload(
      teacherEvents,
      rupEntries,
      enrichedStudents,
      availableSemesters.value,
      allJournals,
      marksStore.journalMarks
    );

    reportData.value = {
      institutionName,
      teacherFullName: teacher ? getTeacherFullName(teacher) : userStore.fullName || common_not_specified(),
      academicYear: academicYear
        ? `${academicYear.startYear}/${academicYear.endYear}`
        : "2024/2025",
      // Legacy `month` header + `entries` (single-month) dropped — Form-1 now
      // renders every month via allMonthsWorkload; excel exporter's
      // per-month sections carry the month name in-band.
      summaryEntries,
      monthlyDistribution,
      months: reportMonths,
      allMonthsWorkload,
    };

    let periodForDisplay = reports_period_display_full();
    if (selectedPeriod.value !== "full_year") {
      const semester = availableSemesters.value.find(
        (s) => s.id === selectedPeriod.value
      );
      if (semester) {
        periodForDisplay = reports_period_display_sem({ n: semester.semesterNumber });
      }
    }

    lastGeneratedReport.value = `ООД_${teacher?.surname || "teacher"}_${
      academicYear?.name
    }_${periodForDisplay} - ${new Date().toLocaleString()}`;
  } catch (error) {
    console.error("Error generating report:", error);
    f7.dialog.alert(reports_generate_error());
  } finally {
    isGenerating.value = false;
  }
}

async function downloadReport() {
  if (!reportData.value) return;
  
  const teacher = selectedTeacher.value;
  const academicYear = selectedAcademicYearId.value
      ? academicYears.value.find((y) => y.id === selectedAcademicYearId.value)
      : academicYears.value.find((y) => y.isActive);

  let periodForFilename = reports_period_filename_full();
  if (selectedPeriod.value !== "full_year") {
    const semester = availableSemesters.value.find(
      (s) => s.id === selectedPeriod.value
    );
    if (semester) {
      periodForFilename = reports_period_filename_sem({ n: semester.semesterNumber });
    }
  }

  const academicYearForFilename = (academicYear?.name || reportData.value.academicYear).replace(
    /\//g,
    "-"
  );
  const filename = `ООД_${teacher?.surname || "teacher"}_${academicYearForFilename}_${periodForFilename}.xlsx`;

  await exportTeacherWorkloadViaConvex(reportData.value, filename);
}

onMounted(() => {
  if (academicYears.value.length > 0) {
    const activeYear = academicYears.value.find((y) => y.isActive);
    if (activeYear) {
      selectedAcademicYearId.value = activeYear.id;
    }
  }

  if (userStore.isTeacher && userStore.currentUser?.id) {
    const teacher = teacherStore.getTeacherByUserId(userStore.currentUser.id);
    selectedTeacherId.value = teacher?.id || userStore.currentUser.id;
  }
});

watchEffect(() => {
  if (!userStore.isTeacher || userStore.isAdmin) return;
  const userId = userStore.currentUser?.id;
  if (!userId) return;
  const teacher = teacherStore.getTeacherByUserId(userId);
  if (teacher?.id) {
    if (selectedTeacherId.value !== teacher.id) selectedTeacherId.value = teacher.id;
    return;
  }
  if (!selectedTeacherId.value) selectedTeacherId.value = userId;
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
