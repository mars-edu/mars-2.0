<template>
  <f7-page
    name="analytics"
    class="analytics-page flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 transition-all duration-200"
        :class="contentMargin"
      >
        <div class="flex flex-col gap-4">
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

          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md"
          >
            <!-- Report Configuration Section -->
            <div class="grid grid-cols-1 gap-4 mb-6">
              <Select
                v-model="selectedReportCategory"
                :options="reportCategoryOptions"
                :placeholder="analytics_category()"
                name="report-category"
                class="w-full"
              />
            </div>

            <!-- Expandable Sections -->
            <Accordion>
              <AccordionItem id="specialties" :default-expanded="true">
                <template #title>{{ analytics_specialties() }}</template>
                <template #selected-item>
                  <span
                    v-if="selectedSpecialties.length > 0"
                    class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                  >
                    {{ selectedSpecialties.length }} выбрано
                  </span>
                </template>
                <div class="flex flex-wrap items-center gap-2 md:gap-3">
                  <div
                    class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedSpecialties.length === specialties.length &&
                        specialties.length > 0,
                    }"
                    @click="toggleSelectAllSpecialties"
                  >
                    <span class="font-medium">{{ common_all() }}</span>
                    <IconCircleCheck
                      v-if="
                        selectedSpecialties.length === specialties.length &&
                        specialties.length > 0
                      "
                      class="w-[18px] h-[18px] text-primary"
                    />
                  </div>
                  <div
                    v-for="specialty in specialties"
                    :key="specialty.id"
                    class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedSpecialties.includes(specialty.id),
                    }"
                    @click="toggleSpecialtySelection(specialty.id)"
                  >
                    <span class="font-medium">
                      {{ specialty.codeName || specialty.name }}
                    </span>
                    <IconInfo
                      class="w-[18px] h-[18px] text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      :id="`specialty-item-${specialty.id}`"
                      @click.stop="
                        handleSpecialtyInfoClick(
                          specialty,
                          `#specialty-item-${specialty.id}`
                        )
                      "
                    />
                  </div>
                  <div
                    v-if="specialties.length === 0"
                    class="text-muted-foreground"
                  >
                    {{ rup_no_specialties() }}
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="courses" :default-expanded="true">
                <template #title>{{ analytics_courses() }}</template>
                <template #selected-item>
                  <span
                    v-if="selectedCourses.length > 0"
                    class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                  >
                    {{ selectedCourses.length }} выбрано
                  </span>
                </template>
                <div class="flex flex-wrap items-center gap-2 md:gap-3">
                  <button
                    class="w-fit flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedCourses.length === courseNumbers.length &&
                        courseNumbers.length > 0,
                    }"
                    @click="toggleSelectAllCourses"
                  >
                    <span class="font-medium">{{ common_all() }}</span>
                    <IconCircleCheck
                      v-if="
                        selectedCourses.length === courseNumbers.length &&
                        courseNumbers.length > 0
                      "
                      class="w-[18px] h-[18px] text-primary"
                    />
                  </button>
                  <button
                    v-for="course in courseNumbers"
                    :key="course"
                    @click="toggleCourseSelection(course)"
                    class="w-fit flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedCourses.includes(course),
                    }"
                  >
                    <span class="font-medium">{{ course }} курс</span>
                  </button>
                  <div
                    v-if="courseNumbers.length === 0"
                    class="text-muted-foreground"
                  >
                    {{ settings_no_courses() }}
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="languages" :default-expanded="true">
                <template #title>{{ analytics_languages() }}</template>
                <template #selected-item>
                  <span
                    v-if="selectedLanguageGroups.length > 0"
                    class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                  >
                    {{ selectedLanguageGroups.length }} выбрано
                  </span>
                </template>
                <div class="flex flex-wrap items-center gap-2 md:gap-3">
                  <div
                    class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedLanguageGroups.length === languages.length &&
                        languages.length > 0,
                    }"
                    @click="toggleSelectAllLanguages"
                  >
                    <span class="font-medium">{{ common_all() }}</span>
                    <IconCircleCheck
                      v-if="
                        selectedLanguageGroups.length === languages.length &&
                        languages.length > 0
                      "
                      class="w-[18px] h-[18px] text-primary"
                    />
                  </div>
                  <div
                    v-for="language in languages"
                    :key="language.id"
                    class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedLanguageGroups.includes(language.code),
                    }"
                    @click="toggleLanguageSelection(language.code)"
                  >
                    <span class="font-medium">{{ language.name }}</span>
                    <IconCircleCheck
                      v-if="selectedLanguageGroups.includes(language.code)"
                      class="w-[18px] h-[18px] text-primary"
                    />
                  </div>
                  <div
                    v-if="languages.length === 0"
                    class="text-muted-foreground"
                  >
                    {{ settings_no_languages() }}
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="students" :default-expanded="true">
                <template #title>{{ analytics_students() }}</template>
                <template #selected-item>
                  <span
                    v-if="selectedStudents.length > 0"
                    class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                  >
                    {{ selectedStudents.length }} выбрано
                  </span>
                </template>
                <div class="overflow-y-auto border border-input rounded-lg">
                  <table class="w-full text-sm">
                    <thead class="sticky top-0 bg-card z-10">
                      <tr class="border-b border-input">
                        <th class="p-2 text-left w-12">
                          <f7-checkbox
                            :checked="isAllStudentsSelected"
                            @change="toggleSelectAllStudents"
                          />
                        </th>
                        <th class="p-2 text-left font-medium">{{ analytics_full_name() }}</th>
                        <th class="p-2 text-left font-medium">{{ analytics_course() }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="student in filteredStudentsForAnalytics"
                        :key="student.id"
                        class="border-b border-input last:border-b-0 hover:bg-muted/50"
                      >
                        <td class="p-2">
                          <f7-checkbox
                            :checked="selectedStudents.includes(student.id)"
                            @change="toggleStudentSelection(student.id)"
                          />
                        </td>
                        <td class="p-2">{{ student.fullName }}</td>
                        <td class="p-2 text-center">{{ student.course }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div
                    v-if="filteredStudentsForAnalytics.length === 0"
                    class="p-4 text-center text-muted-foreground"
                  >
                    {{ analytics_no_students_filter() }}
                  </div>
                </div>
              </AccordionItem>
            </Accordion>

            <!-- Action Buttons -->
            <div
              class="flex justify-end gap-3 mt-6 pt-4 border-t border-border"
            >
              <f7-button
                small
                default
                @click="resetFilters"
                class="bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                <IconRotateCw class="w-4 h-4 mr-2" />
                Сбросить
              </f7-button>
              <f7-button
                small
                default
                :disabled="!canGenerateReport"
                @click="generateReport"
                class="bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <IconCopy class="w-4 h-4 mr-2" />
                Экспорт
              </f7-button>
              <f7-button
                small
                default
                :disabled="!canGenerateReport"
                @click="exportToExcel"
                class="bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <IconFileText class="w-4 h-4 mr-2" />
                Экспорт (Excel)
              </f7-button>
            </div>
            <div
              v-if="hasGeneratedReport"
              class="mt-6 space-y-3 border-t border-border pt-4"
            >
              <div
                class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <h2 class="text-lg font-semibold">{{ analytics_report_preview() }}</h2>
                  <p class="text-xs text-muted-foreground">
                    Обучающихся: {{ reportSummary.studentCount }} • Дисциплин:
                    {{ reportSummary.disciplineCount }}
                    <span v-if="reportGeneratedAtLabel">
                      • Обновлено {{ reportGeneratedAtLabel }}
                    </span>
                  </p>
                </div>
                <f7-button
                  small
                  outline
                  @click="clearReportPreview"
                  class="text-muted-foreground hover:text-foreground"
                >
                  <IconEyeOff class="w-4 h-4 mr-2" />
                  Скрыть
                </f7-button>
              </div>
              <Accordion>
                <AccordionItem
                  v-for="courseGroup in reportGroupsByCourse"
                  :key="`course-group-${courseGroup.course}`"
                  :id="`course-${courseGroup.course}`"
                >
                  <template #title>
                    {{
                      courseGroup.course === "—"
                        ? analytics_no_course()
                        : `Курс ${courseGroup.course}`
                    }}
                  </template>
                  <div
                    v-for="specialtyGroup in courseGroup.specialtyGroups"
                    :key="`specialty-group-${courseGroup.course}-${specialtyGroup.specialtyCode}`"
                    class="space-y-2 mb-4"
                  >
                    <div class="text-sm font-medium text-muted-foreground pl-4">
                      {{ analytics_specialty_label() }} {{ specialtyGroup.specialtyName }}
                    </div>
                    <AnalyticsReportTable
                      :rows="specialtyGroup.rows"
                      :disciplines-semester="specialtyGroup.disciplinesSemester"
                      :disciplines-without-final="
                        specialtyGroup.disciplinesWithoutFinal
                      "
                      :disciplines-by-form="specialtyGroup.disciplinesByForm"
                      :final-forms="reportFinalForms"
                      :is-loading="false"
                    />
                  </div>
                </AccordionItem>
              </Accordion>
              <p class="text-xs text-muted-foreground">
                Значения рассчитываются по текущим данным журналов и обновляются
                при изменении фильтров.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <f7-popover
      class="specialty-info-popover"
      :arrow="true"
      style="width: 320px !important"
    >
      <div
        v-if="selectedSpecialtyInfo"
        class="bg-card text-card-foreground p-4"
      >
        <div class="space-y-3">
          <div>
            <h3 class="font-semibold text-lg text-foreground mb-1">
              {{ selectedSpecialtyInfo.name }}
            </h3>
            <p class="text-sm text-muted-foreground font-medium">
              {{ selectedSpecialtyInfo.codeName }}
            </p>
          </div>

          <div class="border-t border-border pt-3">
            <p class="text-sm text-foreground leading-relaxed">
              {{
                selectedSpecialtyInfo.details ||
                analytics_no_extra_info()
              }}
            </p>
          </div>
        </div>
      </div>
    </f7-popover>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import {
  f7Page,
  f7Button,
  f7,
  f7Popover,
  f7Checkbox,
} from "framework7-vue";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconInfo from "~icons/lucide/info";
import IconRotateCw from "~icons/lucide/rotate-cw";
import IconCopy from "~icons/lucide/copy";
import IconFileText from "~icons/lucide/file-text";
import IconEyeOff from "~icons/lucide/eye-off";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import AnalyticsReportTable from "@/components/AnalyticsReportTable.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useCourseStore } from "@/stores/courseStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { storeToRefs } from "pinia";
import { useLanguageStore } from "@/stores/languageStore";
import { useStudentStore } from "@/stores/studentStore";
import { useJournalStore } from "@/stores/journalStore";
import { useMarksStore } from "@/stores/marksStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import type { Mark } from "@/types/marks";
import type { CalendarEvent } from "@/stores/calendarStore";
import type { Journal } from "@/stores/journalStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import {
  exportAnalyticsViaConvex,
  type AnalyticsExportParams,
} from "@/services/convex-excel-export";
import { useSidebar } from "@/composables/useSidebar";
import {
  analytics_title,
  analytics_subtitle,
  analytics_academic_year,
  analytics_semester,
  analytics_category,
  analytics_specialties,
  analytics_courses,
  analytics_languages,
  analytics_students,
  analytics_full_name,
  analytics_course,
  analytics_no_students_filter,
  analytics_report_preview,
  analytics_no_course,
  analytics_specialty_label,
  analytics_no_extra_info,
  analytics_final,
  analytics_no_name,
  analytics_no_students_error,
  analytics_no_disciplines,
  analytics_export_error,
  rup_no_specialties,
  settings_no_courses,
  settings_no_languages,
  common_all,
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
const languageStore = useLanguageStore();
const studentStore = useStudentStore();
const journalStore = useJournalStore();
const marksStore = useMarksStore();
const calendarStore = useCalendarStore();
const scheduledIntermediateControlStore =
  useScheduledIntermediateControlStore();
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
const selectedReportCategory = ref("");
const selectedSemesterId = ref("");

const selectedSpecialties = ref<string[]>([]);
const selectedCourses = ref<string[]>([]);
const selectedLanguageGroups = ref<string[]>([]);
const selectedSpecialtyInfo = ref<any>(null);
const selectedStudents = ref<string[]>([]);
const hasGeneratedReport = ref(false);
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
      scheduledIntermediateControlStore.getScheduledIntermediateControlsByAcademicYear(
        yearId
      );
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
    text: `Семестр ${ays.semesterNumber}`,
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

type ReportJournalEntry = {
  id: string;
  title: string;
  journal: Journal;
  event: CalendarEvent;
};

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

    const journal = journalStore.getJournalById(event.id) as Journal | null;
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


const getDisciplinesForSemester = computed(() => {
  const hasData = new Set<string>();
  selectedAnalyticsStudents.value.forEach((student) => {
    relevantJournals.value.forEach((discipline) => {
      const marks = marksStore.getStudentMarks(discipline.id, student.id);
      if (marks) {
        const hasDateMarks = marks.some((m: Mark) => m.type === "date");
        if (hasDateMarks) hasData.add(discipline.id);
      }
    });
  });
  return relevantJournals.value.filter((d) => hasData.has(d.id));
});

const getDisciplinesForWithoutFinal = computed(() => {
  if (
    selectedReportCategory.value === "final" ||
    !selectedReportCategory.value
  ) {
    return getDisciplinesForSemester.value;
  }
  const categoryName = selectedReportCategory.value;
  const hasData = new Set<string>();
  selectedAnalyticsStudents.value.forEach((student) => {
    relevantJournals.value.forEach((discipline) => {
      const marks = marksStore.getStudentMarks(discipline.id, student.id);
      if (marks) {
        const hasCategory = marks.some(
          (m: Mark) =>
            m.type === "session" &&
            m.controlType === "intermediate" &&
            m.label === categoryName
        );
        if (hasCategory) hasData.add(discipline.id);
      }
    });
  });
  return relevantJournals.value.filter((d) => hasData.has(d.id));
});

const getDisciplinesForFinalForm = (formId: string) => {
  const hasData = new Set<string>();
  selectedAnalyticsStudents.value.forEach((student) => {
    relevantJournals.value.forEach((discipline) => {
      const marks = marksStore.getStudentMarks(discipline.id, student.id);
      if (marks) {
        const hasForm = marks.some(
          (m: Mark) =>
            m.type === "session" &&
            m.controlType === "final" &&
            m.controlId === formId
        );
        if (hasForm) hasData.add(discipline.id);
      }
    });
  });
  return relevantJournals.value.filter((d) => hasData.has(d.id));
};

type ReportTableRow = {
  studentId: string;
  index: number;
  fullName: string;
  courseLabel: string;
  semester: Record<string, number | null>;
  withoutFinal: Record<string, number | null>;
  finals: Record<string, Record<string, number | null>>;
  overallAverage: number | null;
};

const normalizeNumericValue = (
  value: string | number | null | undefined
): number | null => {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (normalized.length === 0) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const computeAverageFromMarks = (marks: Mark[] | null): number | null => {
  if (!marks || !marks.length) return null;
  const numericValues: number[] = [];
  marks.forEach((mark) => {
    if (!Array.isArray(mark.values)) return;
    mark.values.forEach((value) => {
      const numeric = normalizeNumericValue(value as any);
      if (numeric !== null) {
        numericValues.push(numeric);
      }
    });
  });
  if (!numericValues.length) return null;
  const sum = numericValues.reduce((total, current) => total + current, 0);
  const average = sum / numericValues.length;
  return Number.isFinite(average)
    ? Number.parseFloat(average.toFixed(1))
    : null;
};

const reportRows = computed<ReportTableRow[]>(() => {
  const studentsList = selectedAnalyticsStudents.value;
  const disciplines = relevantJournals.value;

  return studentsList.map((student, index) => {
    const disciplineScores: Record<string, number | null> = {};
    const numericScores: number[] = [];
    const disciplineSemesterScores: Record<string, number | null> = {};
    const finalsData: Record<string, Record<string, number | null>> = {};

    disciplines.forEach((discipline) => {
      const participates =
        (discipline.journal.students || []).includes(student.id) ||
        discipline.event.participants?.includes(student.id);

      if (!participates) {
        disciplineScores[discipline.id] = null;
        disciplineSemesterScores[discipline.id] = null;
        return;
      }

      const marks = marksStore.getStudentMarks(discipline.id, student.id) as
        | Mark[]
        | null;
      const average = computeAverageFromMarks(marks);
      if (average !== null) {
        numericScores.push(average);
      }
      disciplineScores[discipline.id] = average;

      if (marks) {
        const semesterMarks = marks.filter((m: Mark) => m.type === "date");
        const semesterAverage = computeAverageFromMarks(semesterMarks);
        disciplineSemesterScores[discipline.id] = semesterAverage;
      }

      sortedFinalControls.value.forEach((finalForm) => {
        if (!finalsData[finalForm.id]) {
          finalsData[finalForm.id] = {};
        }

        if (marks) {
          const sessionMark = marks.find(
            (m: Mark) =>
              m.type === "session" &&
              m.controlType === "final" &&
              m.controlId === finalForm.id
          );
          const value =
            sessionMark && Array.isArray(sessionMark.values)
              ? normalizeNumericValue(sessionMark.values[0])
              : null;
          finalsData[finalForm.id][discipline.id] = value;
        } else {
          finalsData[finalForm.id][discipline.id] = null;
        }
      });
    });

    const computeWithoutFinalValue = (): Record<string, number | null> => {
      const result: Record<string, number | null> = {};

      disciplines.forEach((discipline) => {
        const participates =
          (discipline.journal.students || []).includes(student.id) ||
          discipline.event.participants?.includes(student.id);

        if (!participates) {
          result[discipline.id] = null;
          return;
        }

        const marks = marksStore.getStudentMarks(discipline.id, student.id) as
          | Mark[]
          | null;
        if (!marks) {
          result[discipline.id] = null;
          return;
        }

        if (selectedReportCategory.value === "final") {
          const semesterMarks = marks.filter((m: Mark) => m.type === "date");
          const semesterAverage = computeAverageFromMarks(semesterMarks);
          result[discipline.id] = semesterAverage;
        } else {
          const categoryName = selectedReportCategory.value;
          if (!categoryName) {
            result[discipline.id] = null;
            return;
          }

          const sessionMark = marks.find(
            (m: Mark) =>
              m.type === "session" &&
              m.controlType === "intermediate" &&
              m.label === categoryName
          );

          const value =
            sessionMark && Array.isArray(sessionMark.values)
              ? normalizeNumericValue(sessionMark.values[0])
              : null;
          result[discipline.id] = value;
        }
      });

      return result;
    };

    const overallAverage =
      numericScores.length > 0
        ? Number.parseFloat(
            (
              numericScores.reduce((total, current) => total + current, 0) /
              numericScores.length
            ).toFixed(1)
          )
        : null;

    return {
      studentId: student.id,
      index: index + 1,
      fullName: student.fullName,
      courseLabel: student.course > 0 ? String(student.course) : "—",
      semester: disciplineSemesterScores,
      withoutFinal: computeWithoutFinalValue(),
      finals: finalsData,
      overallAverage,
    };
  });
});

const reportRowsByCourseAndSpecialty = computed(() => {
  const courseGroups = new Map<string, Map<string, ReportTableRow[]>>();

  reportRows.value.forEach((row) => {
    const courseKey = row.courseLabel || "—";
    const student = students.value.find((s) => s.id === row.studentId);
    const specialtyKey = student?.specialty || "—";

    if (!courseGroups.has(courseKey)) {
      courseGroups.set(courseKey, new Map());
    }
    const specialtyGroups = courseGroups.get(courseKey)!;
    if (!specialtyGroups.has(specialtyKey)) {
      specialtyGroups.set(specialtyKey, []);
    }
    specialtyGroups.get(specialtyKey)!.push(row);
  });

  const courseEntries = Array.from(courseGroups.entries()).map(
    ([course, specialtyMap]) => {
      const specialtyEntries = Array.from(specialtyMap.entries()).map(
        ([specialtyId, rows]) => {
          const sorted = rows.slice().sort((a, b) =>
            a.fullName.localeCompare(b.fullName, "ru", {
              sensitivity: "base",
            })
          );
          const reindexed = sorted.map((r, i) => ({ ...r, index: i + 1 }));

          const specialty = specialties.value.find(
            (s) => s.id === specialtyId
          );
          const specialtyName =
            specialty?.codeName || specialty?.name || specialtyId;

          return {
            specialtyCode: specialty?.code || specialtyId,
            specialtyName,
            rows: reindexed,
          };
        }
      );

      specialtyEntries.sort((a, b) =>
        a.specialtyName.localeCompare(b.specialtyName, "ru", {
          sensitivity: "base",
        })
      );

      return { course, specialtyGroups: specialtyEntries };
    }
  );

  courseEntries.sort((a, b) => {
    const an = Number.parseInt(a.course, 10);
    const bn = Number.parseInt(b.course, 10);
    const aValid = Number.isFinite(an);
    const bValid = Number.isFinite(bn);
    if (aValid && bValid) return an - bn;
    if (aValid) return -1;
    if (bValid) return 1;
    return a.course.localeCompare(b.course, "ru", { sensitivity: "base" });
  });

  return courseEntries;
});

const getRelevantJournalsForStudents = (
  studentIds: string[]
): ReportJournalEntry[] => {
  const selectedIds = new Set(studentIds);
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

    const journal = journalStore.getJournalById(event.id) as Journal | null;
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
};

const getDisciplinesForSemesterForGroup = (
  journals: ReportJournalEntry[],
  studentIds: string[]
) => {
  const hasData = new Set<string>();
  studentIds.forEach((studentId) => {
    journals.forEach((discipline) => {
      const marks = marksStore.getStudentMarks(discipline.id, studentId);
      if (marks) {
        const hasDateMarks = (marks as Mark[]).some(
          (m: Mark) => m.type === "date"
        );
        if (hasDateMarks) hasData.add(discipline.id);
      }
    });
  });
  return journals
    .filter((d) => hasData.has(d.id))
    .map((d) => ({ id: d.id, title: d.title }));
};

const getDisciplinesForWithoutFinalForGroup = (
  journals: ReportJournalEntry[],
  studentIds: string[],
  categoryName: string | null
) => {
  if (!categoryName || categoryName === "final") {
    return getDisciplinesForSemesterForGroup(journals, studentIds);
  }
  const hasData = new Set<string>();
  studentIds.forEach((studentId) => {
    journals.forEach((discipline) => {
      const marks = marksStore.getStudentMarks(discipline.id, studentId);
      if (marks) {
        const hasCategory = (marks as Mark[]).some(
          (m: Mark) =>
            m.type === "session" &&
            m.controlType === "intermediate" &&
            m.label === categoryName
        );
        if (hasCategory) hasData.add(discipline.id);
      }
    });
  });
  return journals
    .filter((d) => hasData.has(d.id))
    .map((d) => ({ id: d.id, title: d.title }));
};

const getDisciplinesForFinalFormForGroup = (
  journals: ReportJournalEntry[],
  studentIds: string[],
  formId: string
) => {
  const hasData = new Set<string>();
  studentIds.forEach((studentId) => {
    journals.forEach((discipline) => {
      const marks = marksStore.getStudentMarks(discipline.id, studentId);
      if (marks) {
        const hasForm = (marks as Mark[]).some(
          (m: Mark) =>
            m.type === "session" &&
            m.controlType === "final" &&
            m.controlId === formId
        );
        if (hasForm) hasData.add(discipline.id);
      }
    });
  });
  return journals
    .filter((d) => hasData.has(d.id))
    .map((d) => ({ id: d.id, title: d.title }));
};

const reportGroupsByCourse = computed(() => {
  return reportRowsByCourseAndSpecialty.value.map((courseGroup) => {
    const specialtyGroupsWithDisciplines = courseGroup.specialtyGroups.map(
      (specialtyGroup) => {
        const studentIds = specialtyGroup.rows.map((r) => r.studentId);
        const journals = getRelevantJournalsForStudents(studentIds);
        const disciplinesSemester = getDisciplinesForSemesterForGroup(
          journals,
          studentIds
        );
        const categoryValue = selectedReportCategory.value || null;
        const disciplinesWithoutFinal =
          categoryValue === "final" || !categoryValue
            ? []
            : getDisciplinesForWithoutFinalForGroup(
                journals,
                studentIds,
                categoryValue
              );
        const disciplinesByForm: Record<
          string,
          Array<{ id: string; title: string }>
        > = {};
        sortedFinalControls.value.forEach((form) => {
          disciplinesByForm[form.id] = getDisciplinesForFinalFormForGroup(
            journals,
            studentIds,
            form.id
          );
        });

        return {
          specialtyCode: specialtyGroup.specialtyCode,
          specialtyName: specialtyGroup.specialtyName,
          rows: specialtyGroup.rows,
          disciplinesSemester,
          disciplinesWithoutFinal,
          disciplinesByForm,
        };
      }
    );

    return {
      course: courseGroup.course,
      specialtyGroups: specialtyGroupsWithDisciplines,
    };
  });
});

const reportSummary = computed(() => ({
  studentCount: selectedAnalyticsStudents.value.length,
  disciplineCount: reportDisciplineColumns.value.length,
}));

const reportGeneratedAtLabel = computed(() => {
  if (!reportGeneratedAt.value) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(reportGeneratedAt.value);
});

const canGenerateReport = computed(
  () => selectedAnalyticsStudents.value.length > 0
);

watch(
  () => {
    const disciplineIds = reportDisciplineColumns.value.map((d) => d.id);
    const rowsSignature = reportRows.value
      .map((row) => {
        const disciplineSignature = disciplineIds
          .map((id) => row.semester[id] ?? "")
          .join(",");
        return `${row.studentId}:${disciplineSignature}:${
          row.overallAverage ?? ""
        }`;
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

const isAllStudentsSelected = computed(() => {
  return (
    filteredStudentsForAnalytics.value.length > 0 &&
    selectedStudents.value.length === filteredStudentsForAnalytics.value.length
  );
});

const toggleSelectAllStudents = () => {
  if (isAllStudentsSelected.value) {
    selectedStudents.value = [];
  } else {
    selectedStudents.value = filteredStudentsForAnalytics.value.map(
      (student) => student.id
    );
  }
};

const toggleStudentSelection = (studentId: string) => {
  const index = selectedStudents.value.indexOf(studentId);
  if (index > -1) {
    selectedStudents.value.splice(index, 1);
  } else {
    selectedStudents.value.push(studentId);
  }
};

const toggleCourseSelection = (courseNumber: string) => {
  const index = selectedCourses.value.indexOf(courseNumber);
  if (index > -1) {
    selectedCourses.value.splice(index, 1);
  } else {
    selectedCourses.value.push(courseNumber);
  }
};

const toggleSelectAllCourses = () => {
  if (
    selectedCourses.value.length === courseNumbers.value.length &&
    courseNumbers.value.length > 0
  ) {
    selectedCourses.value = [];
  } else {
    selectedCourses.value = courseNumbers.value;
  }
};

const toggleSpecialtySelection = (specialtyId: string) => {
  const index = selectedSpecialties.value.indexOf(specialtyId);
  if (index > -1) {
    selectedSpecialties.value.splice(index, 1);
  } else {
    selectedSpecialties.value.push(specialtyId);
  }
};

const toggleSelectAllSpecialties = () => {
  if (
    selectedSpecialties.value.length === specialties.value.length &&
    specialties.value.length > 0
  ) {
    selectedSpecialties.value = [];
  } else {
    selectedSpecialties.value = specialties.value.map((s) => s.id);
  }
};

const toggleLanguageSelection = (languageCode: string) => {
  const index = selectedLanguageGroups.value.indexOf(languageCode);
  if (index > -1) {
    selectedLanguageGroups.value.splice(index, 1);
  } else {
    selectedLanguageGroups.value.push(languageCode);
  }
};

const toggleSelectAllLanguages = () => {
  if (
    selectedLanguageGroups.value.length === languages.value.length &&
    languages.value.length > 0
  ) {
    selectedLanguageGroups.value = [];
  } else {
    selectedLanguageGroups.value = languages.value.map((l) => l.code);
  }
};

const handleSpecialtyInfoClick = (specialty: any, iconId: string) => {
  selectedSpecialtyInfo.value = specialty;
  f7.popover.open(".specialty-info-popover", iconId);
};

const resetFilters = () => {
  clearReportPreview();
  selectedReportType.value = "";
  selectedReportCategory.value = "";
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

  const filters = {
    reportType: selectedReportType.value,
    reportCategory: selectedReportCategory.value,
    semester: selectedSemesterId.value,
    academicYear: selectedItemsStore.selectedAcademicYearId,
    specialties: [...selectedSpecialties.value],
    courses: [...selectedCourses.value],
    languageGroups: [...selectedLanguageGroups.value],
    students: [...selectedStudentIds.value],
  };

  console.log("[analytics] Generating report preview with filters:", filters);

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

  f7.on("popoverClosed", (popover) => {
    if (popover.el.classList.contains("specialty-info-popover")) {
      selectedSpecialtyInfo.value = null;
    }
  });
});

const exportToExcel = async () => {
  if (!canGenerateReport.value) return;
  console.debug("[excel] export:start", {
    totalCourses: reportGroupsByCourse.value.length,
  });

  const date = new Date();
  const filename = `Отчёт_успеваемость_${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.xlsx`;

  try {
    // Transform data for Convex export
    const courseGroups = reportGroupsByCourse.value.map((group) => ({
      course: group.course,
      specialtyGroups: group.specialtyGroups.map((spec) => ({
        specialtyName: spec.specialtyName,
        disciplinesSemester: spec.disciplinesSemester.map((d) => ({
          id: d.id,
          title: d.title,
        })),
        disciplinesWithoutFinal: spec.disciplinesWithoutFinal.map((d) => ({
          id: d.id,
          title: d.title,
        })),
        disciplinesByForm: Object.fromEntries(
          Object.entries(spec.disciplinesByForm).map(([formId, disciplines]) => [
            formId,
            (disciplines as { id: string; title: string }[]).map((d) => ({
              id: d.id,
              title: d.title,
            })),
          ])
        ),
        rows: spec.rows.map((r) => ({
          index: r.index,
          fullName: r.fullName,
          semester: r.semester || {},
          withoutFinal: r.withoutFinal || {},
          finals: r.finals || {},
          overallAverage: r.overallAverage,
        })),
      })),
    }));

    const finalForms = sortedFinalControls.value.map((f) => ({
      id: f.id,
      shortName: f.shortName,
    }));

    await exportAnalyticsViaConvex({ courseGroups, finalForms }, filename);
    console.debug("[excel] Convex export success", { filename });
  } catch (e) {
    console.error("[excel] export failed", e);
    f7.dialog.alert(analytics_export_error());
  }
};
</script>
