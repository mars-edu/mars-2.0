<template>
  <f7-page
    name="analytics"
    class="analytics-page flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div class="flex-1 overflow-y-auto p-4 md:p-6 bg-background pb-16 md:pb-6" :class="contentMargin">
      <div class="flex flex-col gap-6 max-w-7xl mx-auto">
        <div class="flex flex-col gap-6">
          <div class="analytics-page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div class="flex flex-col md:flex-row md:items-center gap-4">
              <div>
                <h1 class="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                  {{ analytics_title() }}
                </h1>
                <p class="text-sm text-muted-foreground mt-1">
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

            <AnalyticsFilterSection
              v-model:selectedReportCategory="selectedReportCategory"
              v-model:selectedSpecialties="selectedSpecialties"
              v-model:selectedCourses="selectedCourses"
              v-model:selectedLanguageGroups="selectedLanguageGroups"
              v-model:selectedStudents="selectedStudents"
              :report-category-options="reportCategoryOptions"
              :specialties="specialties"
              :course-numbers="courseNumbers"
              :languages="languages"
              :filtered-students-for-analytics="filteredStudentsForAnalytics"
              :can-generate-report="canGenerateReport"
              @reset="resetFilters"
              @generate="generateReport"
              @export-excel="exportToExcel"
            />

            <AnalyticsReportPreview
              :has-generated-report="hasGeneratedReport"
              :sheet-type="sheetType"
              :report-summary="reportSummary"
              :report-generated-at-label="reportGeneratedAtLabel"
              :report-groups-by-course="reportGroupsByCourse"
              :report-final-forms="reportFinalForms"
              @hide="clearReportPreview"
            />

            <!-- Sheet type toggle -->
            <div class="flex items-center gap-3">
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
          </template>

          <template v-if="viewMode === 'транскрипт'">
            <AnalyticsTranscriptView
              :students="transcriptStudents"
              :journals="attendanceJournals"
              :get-student-marks="marksStore.getStudentMarks"
            />
          </template>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, defineAsyncComponent } from "vue";
import { f7Page, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import AnalyticsStatCards from "@/components/AnalyticsStatCards.vue";
const AnalyticsCharts = defineAsyncComponent(() => import("@/components/AnalyticsCharts.vue"));
import AnalyticsAttendanceSheet from "@/components/AnalyticsAttendanceSheet.vue";
import AnalyticsTranscriptView from "@/components/AnalyticsTranscriptView.vue";
import AnalyticsFilterSection from "@/components/analytics/AnalyticsFilterSection.vue";
import AnalyticsReportPreview from "@/components/analytics/AnalyticsReportPreview.vue";
import { useAnalyticsReportState, type ReportJournalEntry } from "@/composables/useAnalyticsReportState";

import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useCourseStore } from "@/stores/courseStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { storeToRefs } from "pinia";
import { useStudyLanguageStore } from "@/stores/studyLanguageStore";
import { useStudentStore } from "@/stores/studentStore";
import { useJournalStore } from "@/stores/journalStore";
import { useMarksStore } from "@/stores/marksStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useSidebar } from "@/composables/useSidebar";
import {
  analytics_title,
  analytics_subtitle,
  analytics_academic_year,
  analytics_semester,
  analytics_category,
  analytics_semester_option,
  analytics_final,
  analytics_no_name,
  analytics_no_students_error,
  analytics_no_disciplines,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();
const { contentMargin } = useSidebar();
const activeNavItem = ref("analytics");

const academicYearStore = useAcademicYearStore();
const semesterStore = useSemesterStore();
const courseStore = useCourseStore();
const specialtyStore = useSpecialtyStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const selectedItemsStore = useSelectedItemsStore();
const languageStore = useStudyLanguageStore();
const studentStore = useStudentStore();
const journalStore = useJournalStore();
const marksStore = useMarksStore();
const calendarStore = useCalendarStore();
const scheduledIntermediateControlStore = useScheduledIntermediateControlStore();
const finalControlStore = useFinalControlStore();

const { academicYears } = storeToRefs(academicYearStore);
const { sortedSemesters } = storeToRefs(semesterStore);
const { courses } = storeToRefs(courseStore);
const { specialties } = storeToRefs(specialtyStore);
const { languages } = storeToRefs(languageStore);
const { students } = storeToRefs(studentStore);
const { events } = storeToRefs(calendarStore);
const { sortedFinalControls } = storeToRefs(finalControlStore);

const selectedReportType = ref("");
const selectedReportCategory = ref("final");
const selectedSemesterId = ref("");

const selectedSpecialties = ref<string[]>([]);
const selectedCourses = ref<string[]>([]);
const selectedLanguageGroups = ref<string[]>([]);
const selectedStudents = ref<string[]>([]);
const hasGeneratedReport = ref(false);
const viewMode = ref<"ведомость" | "транскрипт">("ведомость");
const sheetType = ref<"успеваемость" | "посещаемость">("успеваемость");
const reportGeneratedAt = ref<Date | null>(null);

let emptyDisciplineToast: any = null;

const clearReportPreview = () => {
  hasGeneratedReport.value = false;
  reportGeneratedAt.value = null;
  emptyDisciplineToast?.close?.();
  emptyDisciplineToast = null;
};

const reportCategoryOptions = computed(() => {
  const options: Array<{ value: string; text: string }> = [
    { value: "final", text: analytics_final() },
  ];

  const yearId = selectedItemsStore.selectedAcademicYearId;
  if (yearId) {
    const intermediateControls =
      scheduledIntermediateControlStore.getScheduledIntermediateControlsByAcademicYear(yearId);
    intermediateControls.forEach((control) => {
      options.push({
        value: control.shortName,
        text: control.shortName,
      });
    });
  }

  return options;
});

const selectedAcademicYearModel = computed({
  get: () => selectedItemsStore.selectedAcademicYearId ?? "",
  set: (v: string) => {
    selectedItemsStore.setSelectedAcademicYear(v || null);
    if (v !== (selectedItemsStore.selectedAcademicYearId ?? "")) {
      selectedSemesterId.value = "";
      selectedReportCategory.value = "final";
    }
  },
});

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

const semesterOptions = computed(() => {
  const yearId = selectedItemsStore.selectedAcademicYearId;
  const list = yearId
    ? academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(yearId)
    : [];
  return list.map((ays) => ({
    value: ays.id,
    text: analytics_semester_option({ semester: ays.semesterNumber }),
  }));
});

const courseNumbers = computed(() => {
  return courses.value.map((course) => course.number).sort();
});

const filteredStudentsForAnalytics = computed(() => {
  return students.value
    .map((s) => ({
      id: s.id,
      fullName: studentStore.getStudentFullName(s.id),
      course: studentStore.getCourseByStudentId(s.id) ?? 0,
    }))
    .filter((s) => {
      if (selectedSpecialties.value.length === 0) return true;
      const student = students.value.find((st) => st.id === s.id);
      return student && selectedSpecialties.value.includes(student.specialty);
    })
    .filter((s) => {
      if (selectedCourses.value.length === 0) return true;
      return selectedCourses.value.includes(String(s.course));
    })
    .filter((s) => {
      if (selectedLanguageGroups.value.length === 0) return true;
      const student = students.value.find((st) => st.id === s.id);
      return student && selectedLanguageGroups.value.includes(student.language);
    });
});

const selectedStudentIds = computed(() => {
  if (selectedStudents.value.length > 0) {
    return Array.from(new Set(selectedStudents.value));
  }
  return filteredStudentsForAnalytics.value.map((student) => student.id);
});

const selectedAnalyticsStudents = computed(() => {
  const ids = new Set(selectedStudentIds.value);
  return filteredStudentsForAnalytics.value.filter((student) =>
    ids.has(student.id)
  );
});

const relevantJournals = computed<ReportJournalEntry[]>(() => {
  const selectedIds = new Set(selectedStudentIds.value);
  if (!selectedIds.size) return [];

  const academicYearId = selectedItemsStore.selectedAcademicYearId ?? null;
  const semesterFilter = selectedSemesterId.value || null;
  const map = new Map<string, ReportJournalEntry>();
  const eventList = events.value ?? [];

  eventList.forEach((event) => {
    if (!event) return;
    if (!event.participants?.some((id) => selectedIds.has(id))) return;

    if (semesterFilter) {
      if (event.semester !== semesterFilter) return;
    } else if (academicYearId) {
      if (!event.semester) return;
      const semester = academicYearSemesterStore.getAcademicYearSemesterById(
        event.semester
      );
      if (!semester || semester.academicYearId !== academicYearId) {
        return;
      }
    }

    const journal = journalStore.getJournalById(event.id) as any;
    if (!journal) return;

    const title =
      journalStore.getDisciplineTitle(journal) ||
      calendarStore.getEventTitle(event) ||
      analytics_no_name();

    map.set(event.id, {
      id: event.id,
      title,
      journal,
      event,
    });
  });

  return Array.from(map.values()).sort((a, b) =>
    a.title.localeCompare(b.title, "ru", { sensitivity: "base" })
  );
});

const canGenerateReport = computed(
  () => selectedAnalyticsStudents.value.length > 0
);

const {
  reportRows,
  reportGroupsByCourse,
  analyticsAverageScore,
  analyticsAttendancePercent,
  analyticsMonthlyData,
  analyticsOverallAverages,
  exportToExcel,
} = useAnalyticsReportState({
  selectedAnalyticsStudents,
  relevantJournals,
  selectedReportCategory,
  sortedFinalControls,
  students,
  specialties,
  selectedStudentIds,
  canGenerateReport,
});

const reportDisciplineColumns = computed(() =>
  relevantJournals.value.map((entry) => ({
    id: entry.id,
    title: entry.title,
  }))
);

const reportFinalForms = computed(() =>
  sortedFinalControls.value.map((form) => ({
    id: form.id,
    title: form.shortName,
  }))
);

const attendanceStudents = computed(() =>
  selectedAnalyticsStudents.value.map((s) => ({
    id: s.id,
    fullName: s.fullName,
  }))
);

const attendanceJournals = computed(() =>
  relevantJournals.value.map((j) => ({
    id: j.id,
    title: j.title,
    disciplineId: j.journal.disciplineId,
  }))
);

const transcriptStudents = computed(() =>
  students.value.map((s) => ({
    id: s.id,
    fullName: studentStore.getStudentFullName(s.id),
    enrollmentYear: "—",
  }))
);

const reportSummary = computed(() => ({
  studentCount: selectedAnalyticsStudents.value.length,
  disciplineCount: reportDisciplineColumns.value.length,
}));

const reportGeneratedAtLabel = computed(() => {
  if (!reportGeneratedAt.value) return "";
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(reportGeneratedAt.value);
});

watch(viewMode, async (mode) => {
  if (mode === "транскрипт") {
    for (const journal of relevantJournals.value) {
      await marksStore.loadJournalMarks(journal.id);
    }
  }
});

watch(
  () => {
    const disciplineIds = reportDisciplineColumns.value.map((d) => d.id);
    const rowsSignature = reportRows.value
      .map((row) => {
        const disciplineSignature = disciplineIds
          .map((id) => row.semester[id] ?? "")
          .join(",");
        return `${row.studentId}:${disciplineSignature}:${row.overallAverage ?? ""}`;
      })
      .join("|");

    return {
      students: selectedStudentIds.value.join(","),
      disciplines: disciplineIds.join(","),
      rowsSignature,
    };
  },
  () => {
    if (selectedStudents.value.length > 0 && !hasGeneratedReport.value) {
      hasGeneratedReport.value = true;
    }
    if (hasGeneratedReport.value) {
      reportGeneratedAt.value = new Date();
    }
  }
);

const resetFilters = () => {
  clearReportPreview();
  selectedReportType.value = "";
  selectedReportCategory.value = "final";
  selectedItemsStore.setSelectedAcademicYear(null);
  selectedSemesterId.value = "";
  selectedSpecialties.value = [];
  selectedCourses.value = [];
  selectedLanguageGroups.value = [];
  selectedStudents.value = [];
};

const generateReport = () => {
  if (!canGenerateReport.value) {
    f7.dialog.alert(analytics_no_students_error());
    return;
  }

  hasGeneratedReport.value = true;
  reportGeneratedAt.value = new Date();

  if (reportDisciplineColumns.value.length === 0) {
    emptyDisciplineToast?.close?.();
    emptyDisciplineToast = f7.toast.create({
      text: analytics_no_disciplines(),
      closeTimeout: 2500,
    });
    emptyDisciplineToast.open();
  }
};

onMounted(async () => {
  const activeYear = academicYearStore.getActiveAcademicYear;
  if (activeYear) {
    selectedItemsStore.setSelectedAcademicYear(activeYear.id);
  }

  selectedReportType.value = "student-performance";
  selectedReportCategory.value = "final";
});
</script>
