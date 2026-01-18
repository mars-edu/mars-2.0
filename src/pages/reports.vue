<template>
  <f7-page
    name="reports"
    class="reports-page flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-32"
      >
        <div class="flex flex-col gap-4">
          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md"
          >
            <h2 class="text-lg font-semibold mb-4">
              Отчеты по нагрузке преподавателей
            </h2>

            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  v-if="userStore.isAdmin"
                  v-model="selectedTeacherId"
                  :options="teacherOptions"
                  label="Преподаватель"
                  placeholder="Выберите преподавателя"
                  name="teacher"
                  searchable
                  search-placeholder="Поиск преподавателя..."
                />

                <Select
                  v-model="selectedAcademicYearId"
                  :options="academicYearOptions"
                  label="Академический год"
                  placeholder="Выберите учебный год"
                  name="academic-year"
                />

                <Select
                  v-model="selectedPeriod"
                  :options="periodOptions"
                  label="Период"
                  placeholder="Выберите период"
                  name="period"
                />
              </div>

              <div class="flex gap-3">
                <button
                  @click="generateWorkloadReport"
                  :disabled="isGenerating || !selectedTeacherId"
                  class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span
                    v-if="isGenerating"
                    class="animate-spin inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  ></span>
                  <span>{{
                    isGenerating
                      ? "Генерация..."
                      : "Сгенерировать отчет ООД (Формы 1-3)"
                  }}</span>
                </button>
              </div>

              <div
                v-if="lastGeneratedReport"
                class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
              >
                <p class="text-sm text-green-800 dark:text-green-200">
                  ✓ Отчет успешно сгенерирован и скачан
                </p>
                <p class="text-xs text-green-600 dark:text-green-300 mt-1">
                  {{ lastGeneratedReport }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watchEffect } from "vue";
import { f7Page, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import { useTeacherStore } from "@/stores/teacherStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useClass9Store } from "@/stores/class9Store";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useUserStore } from "@/stores/userStore";
import { useJournalStore } from "@/stores/journalStore";
import { useMarksStore } from "@/stores/marksStore";
import {
  exportTeacherWorkloadViaConvex,
  type WorkloadExportParams,
} from "@/services/convex-excel-export";

type WorkloadEntry = WorkloadExportParams["entries"][number];
type WorkloadSummaryEntry = WorkloadExportParams["summaryEntries"][number];
type MonthlyDistributionEntry = WorkloadExportParams["monthlyDistribution"][number];
type TeacherWorkloadExportPayload = WorkloadExportParams;
import {
  generateDailyWorkload,
  generateWorkloadSummary,
  generateMonthlyDistribution,
  computeMonthsFromSemesters,
  generateAllMonthsWorkload,
} from "@/services/teacher-workload-calculator";

const activeNavItem = ref("reports");
const userStore = useUserStore();
const teacherStore = useTeacherStore();
const academicYearStore = useAcademicYearStore();
const calendarStore = useCalendarStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const class9Store = useClass9Store();
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const journalStore = useJournalStore();
const marksStore = useMarksStore();

const selectedTeacherId = ref("");
const selectedAcademicYearId = ref("");
const selectedPeriod = ref("full_year");
const isGenerating = ref(false);
const lastGeneratedReport = ref("");

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
      text: "За весь учебный год",
    },
  ];

  availableSemesters.value.forEach((semester) => {
    options.push({
      value: semester.id,
      text: `За ${semester.semesterNumber} семестр`,
    });
  });

  return options;
});

const getTeacherFullName = (teacher: any) => {
  return teacherStore.getTeacherFullName(teacher);
};

async function generateWorkloadReport() {
  if (!selectedTeacherId.value) {
    f7.dialog.alert("Пожалуйста, выберите преподавателя");
    return;
  }

  isGenerating.value = true;

  try {
    // Ensure all required stores are loaded
    console.log('[Reports] Checking data availability before export...');
    console.log('[Reports] Calendar events:', calendarStore.events?.length ?? 0);
    console.log('[Reports] Class9 items:', class9Store.items?.length ?? 0);
    console.log('[Reports] Students:', studentStore.students?.length ?? 0);

    // Wait for required data to load
    let attempts = 0;
    const maxAttempts = 30; // 30 * 100ms = 3 seconds

    while (attempts < maxAttempts) {
      const eventsLoaded = calendarStore.events && calendarStore.events.length > 0;
      const class9Loaded = class9Store.items && class9Store.items.length > 0;
      const studentsLoaded = studentStore.students && studentStore.students.length > 0;

      if (eventsLoaded && class9Loaded && studentsLoaded) {
        console.log('[Reports] All required data loaded successfully');
        break;
      }

      if (attempts === 0) {
        console.log('[Reports] Waiting for data to load...', {
          events: eventsLoaded,
          class9: class9Loaded,
          students: studentsLoaded
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    // Final check
    if (!calendarStore.events || calendarStore.events.length === 0) {
      console.warn('[Reports] No calendar events found after waiting');
      f7.dialog.alert('Нет данных о расписании преподавателя. Пожалуйста, убедитесь, что у преподавателя есть занятия в календаре.');
      return;
    }

    if (!class9Store.items || class9Store.items.length === 0) {
      console.warn('[Reports] No class9 items found');
    }

    if (!studentStore.students || studentStore.students.length === 0) {
      console.warn('[Reports] No students found');
    }

    console.log('[Reports] Final data counts:', {
      events: calendarStore.events.length,
      class9: class9Store.items?.length ?? 0,
      students: studentStore.students?.length ?? 0
    });

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

    // Get all class9 items
    const class9Items = class9Store.class9Items;

    // Compute months from semester date ranges first
    const semesterMonths = computeMonthsFromSemesters(availableSemesters.value);

    console.log('[Reports] Semester selection:', selectedPeriod.value);
    console.log('[Reports] Academic year:', academicYear?.name);
    console.log('[Reports] Computed semester months:', semesterMonths.map(m => `${m.key}(${m.year})`).join(', '));

    if (semesterMonths.length === 0) {
      throw new Error("Не удалось вычислить месяцы из семестров. Проверьте настройки дат семестров для учебного года.");
    }

    // For Form 1 (daily workload), use the first month from semester date ranges
    const firstMonth = semesterMonths[0];
    const reportMonth = firstMonth.month;
    const reportYear = firstMonth.year;
    console.log(`[Reports] Using first semester month: ${firstMonth.key} (month=${reportMonth}, year=${reportYear})`);

    const monthNamesEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    console.log(`[Reports] Report month selected: ${reportMonth} (${monthNamesEn[reportMonth]}), year: ${reportYear}`);
    console.log('[Reports] Teacher events count:', teacherEvents.length);
    console.log('[Reports] Class9 items count:', class9Items.length);

    // Flatten journals from computed property
    const allJournals = Object.values(journalStore.journalsByCourse).flat();
    console.log('[Reports] Total journals available:', allJournals.length);
    console.log('[Reports] JournalMarks keys count:', Object.keys(marksStore.journalMarks).length);

    // Generate real data using calculator service
    const entries: WorkloadEntry[] = generateDailyWorkload(
      teacherEvents,
      class9Items,
      enrichedStudents,
      reportMonth,
      reportYear,
      academicYear?.startYear || new Date().getFullYear(), // Academic year start for cumulative calculation
      allJournals,
      marksStore.journalMarks
    );

    console.log('[Reports] Form 1 entries generated:', entries.length);
    if (entries.length > 0) {
      console.log('[Reports] First entry sample:', {
        subject: entries[0].subjectName,
        group: entries[0].groupName,
        monthTotal: entries[0].monthTotal,
        actualHours: entries[0].actualHours,
        dailyHoursCount: entries[0].dailyHours.filter(h => h !== null).length
      });
    }

    const summaryEntries: WorkloadSummaryEntry[] = generateWorkloadSummary(
      teacherEvents,
      class9Items,
      enrichedStudents,
      filterStartDate,
      filterEndDate
    );

    const { distributions: monthlyDistribution, months: reportMonths } =
      generateMonthlyDistribution(teacherEvents, class9Items, enrichedStudents, availableSemesters.value);

    // Generate workload data for all months (Form 1 multi-month structure)
    const allMonthsWorkload = generateAllMonthsWorkload(
      teacherEvents,
      class9Items,
      enrichedStudents,
      availableSemesters.value,
      allJournals,
      marksStore.journalMarks
    );

    console.log('[Reports] All months workload generated:', allMonthsWorkload.length, 'months');

    let periodLabel = "за весь учебный год";
    if (selectedPeriod.value !== "full_year") {
      const semester = availableSemesters.value.find(
        (s) => s.id === selectedPeriod.value
      );
      if (semester) {
        periodLabel = `за ${semester.semesterNumber} семестр`;
      }
    }

    // Get month name for Form 1 (0-indexed)
    const monthNames = [
      'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
      'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'
    ];
    const reportMonthName = monthNames[reportMonth];

    const payload: TeacherWorkloadExportPayload = {
      institutionName:
        `"Музыкалық колледж  - дарынды балаларға арналған музыкалық мектеп - интернат" Кешені ММ/ ГУ "Комплекс "Музыкальный колледж - музыкальная школа - интернат для одарённых детей"`,
      teacherFullName: teacher ? getTeacherFullName(teacher) : userStore.fullName || "Не указан",
      academicYear: academicYear
        ? `${academicYear.startYear}/${academicYear.endYear}`
        : "2024/2025",
      month: reportMonthName,
      entries: entries,
      summaryEntries: summaryEntries,
      monthlyDistribution: monthlyDistribution,
      months: reportMonths,
      allMonthsWorkload: allMonthsWorkload,
    };

    let periodForFilename = "весь_год";
    let periodForDisplay = "весь учебный год";

    if (selectedPeriod.value !== "full_year") {
      const semester = availableSemesters.value.find(
        (s) => s.id === selectedPeriod.value
      );
      if (semester) {
        periodForFilename = `${semester.semesterNumber}_семестр`;
        periodForDisplay = `${semester.semesterNumber} семестр`;
      }
    }

    const academicYearForFilename = (academicYear?.name || payload.academicYear).replace(
      /\//g,
      "-"
    );
    const filename = `ООД_${teacher?.surname || "teacher"}_${academicYearForFilename}_${periodForFilename}.xlsx`;

    await exportTeacherWorkloadViaConvex(payload, filename);

    lastGeneratedReport.value = `ООД_${teacher?.surname || "teacher"}_${
      academicYear?.name
    }_${periodForDisplay} - ${new Date().toLocaleString()}`;
  } catch (error) {
    console.error("Error generating report:", error);
    f7.dialog.alert("Ошибка при генерации отчета");
  } finally {
    isGenerating.value = false;
  }
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
.reports-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}
</style>
