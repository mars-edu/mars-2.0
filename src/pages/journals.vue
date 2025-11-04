<template>
  <f7-page
    name="journals"
    class="journals-page flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-32"
      >
        <div class="flex flex-col gap-4">
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-3 journals-page-header"
          >
            <h1 class="text-2xl font-semibold">Журналы</h1>
            <div
              class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto"
            >
              <Select
                v-model="selectedAcademicYearModel"
                :options="academicYearOptions"
                placeholder="Учебный год:"
                name="academic-year"
                class="w-full sm:w-44"
              />
              <Select
                v-model="selectedSemesterId"
                :options="semesterOptions"
                placeholder="Семестр:"
                name="semester"
                class="w-full sm:w-44"
              />
              <Select
                v-if="userStore.isAdmin"
                v-model="selectedTeacherId"
                :options="teacherOptions"
                placeholder="Преподаватель:"
                name="teacher"
                class="w-full sm:w-44"
              />
            </div>
          </div>

          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md"
          >
            <div class="flex flex-wrap gap-4 mb-6">
              <Select
                v-model="selectedDiscipline"
                :options="disciplineOptions"
                placeholder="Дисциплина"
                name="discipline"
                class="flex-1 min-w-[150px] sm:min-w-[200px]"
              />
              <Select
                v-model="selectedTerm"
                :options="termOptions"
                placeholder="Срок обучения"
                name="term"
                class="flex-1 min-w-[150px] sm:min-w-[200px]"
              />
              <Select
                v-model="selectedStatus"
                :options="statusOptions"
                placeholder="Статус"
                name="status"
                class="flex-1 min-w-[150px] sm:min-w-[200px]"
              />
              <Select
                v-model="selectedGroup"
                :options="groupOptions"
                placeholder="Группа"
                name="group"
                class="flex-1 min-w-[150px] sm:min-w-[200px]"
              />
              <Select
                v-model="selectedRole"
                :options="roleOptions"
                placeholder="Роль"
                name="role"
                class="flex-1 min-w-[150px] sm:min-w-[200px]"
              />
            </div>
            <div class="mb-3 flex flex-wrap gap-2 items-center justify-end">
              <template v-if="isSelectionMode">
                <f7-button
                  small
                  default
                  @click="selectAll"
                  class="bg-blue-500 text-white hover:bg-blue-600 transition-colors flex-1 sm:flex-none"
                >
                  <f7-icon
                    ios="f7:checkmark_circle"
                    md="material:check_circle"
                    size="16px"
                    class="mr-2"
                  />
                  Выбрать все
                </f7-button>
                <f7-button
                  small
                  default
                  @click="deselectAll"
                  class="bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors flex-1 sm:flex-none"
                >
                  <f7-icon
                    ios="f7:xmark_circle"
                    md="material:cancel"
                    size="16px"
                    class="mr-2"
                  />
                  Снять все
                </f7-button>
                <f7-button
                  small
                  default
                  @click="onDownloadClick"
                  class="bg-primary text-white hover:bg-primary-dark transition-colors flex-1 sm:flex-none"
                  :disabled="selectedJournalIds.size === 0"
                >
                  <f7-icon
                    ios="f7:checkmark"
                    md="material:check"
                    size="16px"
                    class="mr-2"
                  />
                  Готово ({{ selectedJournalIds.size }})
                </f7-button>
              </template>
              <template v-else>
                <f7-button
                  id="journal-settings-button"
                  small
                  default
                  @click="onSettingsClick"
                  class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors flex-1 sm:flex-none"
                >
                  <f7-icon
                    ios="f7:gear"
                    md="material:settings"
                    size="16px"
                    class="mr-2"
                  />
                  Настройки
                </f7-button>
                <f7-button
                  small
                  default
                  @click="onCloseJournalClick"
                  class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors flex-1 sm:flex-none"
                >
                  <f7-icon
                    ios="f7:xmark_circle"
                    md="material:cancel"
                    size="16px"
                    class="mr-2"
                  />
                  Закрыть журнал
                </f7-button>
                <f7-button
                  small
                  default
                  @click="onDownloadClick"
                  class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors flex-1 sm:flex-none"
                >
                  <f7-icon
                    ios="f7:arrow_down_to_line"
                    md="material:file_download"
                    size="16px"
                    class="mr-2"
                  />
                  Скачать
                </f7-button>
                <f7-button
                  small
                  default
                  @click="onUploadClick"
                  class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors flex-1 sm:flex-none"
                >
                  <f7-icon
                    ios="f7:arrow_up_to_line"
                    md="material:file_upload"
                    size="16px"
                    class="mr-2"
                  />
                  Загрузить
                </f7-button>
                <f7-button
                  small
                  default
                  @click="onShareClick"
                  class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors flex-1 sm:flex-none"
                >
                  <f7-icon
                    ios="f7:share"
                    md="material:share"
                    size="16px"
                    class="mr-2"
                  />
                  Поделится
                </f7-button>
              </template>
            </div>
            <div class="overflow-x-auto">
              <div class="flex gap-5 w-full">
                <template v-for="(course, idx) in courses" :key="course.id">
                  <div class="flex flex-col gap-3 w-full">
                    <h2
                      class="font-semibold text-sm text-center py-1 bg-muted rounded-md text-muted-foreground"
                    >
                      {{ course.number }} курс
                    </h2>
                    <div
                      v-for="journal in filteredJournalsByCourse[
                        parseInt(course.number)
                      ]"
                      :key="journal.id"
                    >
                      <JournalCard
                        :title="journalStore.getDisciplineTitle(journal)"
                        :subtitle="journalStore.getJournalSubtitle(journal)"
                        :schedule="journalStore.getJournalScheduleText(journal)"
                        :percent="journalStore.getJournalPercent(journal)"
                        :selection-mode="isSelectionMode"
                        :selected="selectedJournalIds.has(journal.id)"
                        @click="goToJournalDetails(journal.id)"
                        @toggle-select="toggleJournalSelection(journal.id)"
                      />
                    </div>
                    <div
                      v-if="
                        filteredJournalsByCourse[parseInt(course.number)].length === 0
                      "
                      class="rounded-lg p-4 text-gray-500 shadow-sm min-h-[90px] flex items-center justify-center bg-gray-50 border border-gray-100"
                    >
                      <p class="text-sm">Нет доступных журналов</p>
                    </div>
                  </div>
                  <div v-if="idx === 3" class="flex flex-col gap-3 w-full">
                    <h2
                      class="font-semibold text-sm text-center py-1 bg-muted rounded-md text-muted-foreground"
                    >
                      смешанные группы
                    </h2>
                    <div
                      v-for="journal in filteredMixedGroupJournals"
                      :key="journal.id"
                    >
                      <JournalCard
                        :title="journalStore.getDisciplineTitle(journal)"
                        :subtitle="journalStore.getJournalSubtitle(journal)"
                        :schedule="journalStore.getJournalScheduleText(journal)"
                        :percent="journalStore.getJournalPercent(journal)"
                        :selection-mode="isSelectionMode"
                        :selected="selectedJournalIds.has(journal.id)"
                        @click="goToJournalDetails(journal.id)"
                        @toggle-select="toggleJournalSelection(journal.id)"
                      />
                    </div>
                    <div
                      v-if="filteredMixedGroupJournals.length === 0"
                      class="rounded-lg p-4 text-gray-500 shadow-sm min-h-[90px] flex items-center justify-center bg-gray-50 border border-gray-100"
                    >
                      <p class="text-sm">Нет доступных журналов</p>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { f7Page, f7Input, f7, f7Icon, f7Button } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import JournalCard from "@/components/Cards/JournalCard.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useJournalStore, type Journal } from "@/stores/journalStore";
import { useCourseStore } from "@/stores/courseStore";
import { storeToRefs } from "pinia";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useUserStore } from "@/stores/userStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useTeacherStore } from "@/stores/teacherStore";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import {
  exportJournalToExcel,
  type JournalStudentRow,
} from "@/services/journal-export";
import { importJournalFromExcel } from "@/services/excel-parser";

const activeNavItem = ref("journals");

const journalStore = useJournalStore();
const userStore = useUserStore();
const calendarStore = useCalendarStore();
const teacherStore = useTeacherStore();
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const { journalsByCourse, mixedGroupJournals } = storeToRefs(journalStore);
const { students } = storeToRefs(studentStore);

const courseStore = useCourseStore();
const { courses } = storeToRefs(courseStore);

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);
const semesterStore = useSemesterStore();
const { sortedSemesters } = storeToRefs(semesterStore);

const academicYearSemesterStore = useAcademicYearSemesterStore();
const selectedItemsStore = useSelectedItemsStore();

const selectedSemesterId = ref("");
const { getActiveAcademicYearSemester } = storeToRefs(
  academicYearSemesterStore
);

const selectedAcademicYearModel = computed({
  get: () => selectedItemsStore.selectedAcademicYearId ?? "",
  set: (v: string) => {
    selectedItemsStore.setSelectedAcademicYear(v || null);
    if (v !== (selectedItemsStore.selectedAcademicYearId ?? "")) {
      selectedSemesterId.value = "";
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

const selectedTeacherId = computed({
  get: () => calendarStore.selectedTeacherId || "",
  set: (value: string) => calendarStore.setSelectedTeacher(value || null),
});

const teacherOptions = computed(() => teacherStore.teacherSelectOptions);

onMounted(async () => {
  console.log("\n\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              🔍 JOURNALS PAGE MOUNTED                      ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const activeYear = academicYearStore.getActiveAcademicYear;
  console.log("\n📅 Active Year:", activeYear);
  if (activeYear) {
    selectedItemsStore.setSelectedAcademicYear(activeYear.id);
    console.log("   ✅ Set selected year to:", activeYear.name);
  }

  const activeSemesters =
    academicYearSemesterStore.getActiveAcademicYearSemesters;
  console.log("\n📚 Active Semesters:", activeSemesters);

  if (activeSemesters.length > 0) {
    selectedSemesterId.value = activeSemesters[0].id;
    console.log(`   ✅ Auto-selected semester "${activeSemesters[0].semesterNumber}" with ID: ${activeSemesters[0].id}`);
  } else {
    console.warn("   ⚠️  No active semesters found!");
  }

  if (userStore.isTeacher && userStore.currentUser?.id) {
    calendarStore.setSelectedTeacher(userStore.currentUser.id);
    console.log("\n👨‍🏫 Teacher mode - filtered by:", userStore.currentUser.id);
  }

  console.log("\n📊 Total journals by course:", Object.keys(journalsByCourse.value).length);

  // Debug: Show all calendar events and their semester values
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           📋 ALL CALENDAR EVENTS & SEMESTERS               ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const allEvents = calendarStore.filteredEvents || [];
  console.log(`\nTotal events: ${allEvents.length}`);

  allEvents.forEach((event: any, idx: number) => {
    const actualEvent = event._custom?.value || event;
    const semesterValue = actualEvent.semester;
    const disciplineId = actualEvent.class9Id;
    const hasWeeklySchedules = actualEvent.weeklySchedules && actualEvent.weeklySchedules.length > 0;

    console.log(`\n${idx + 1}. Event ID: ${actualEvent.id}`);
    console.log(`   📌 Semester: "${semesterValue || "(empty)"}" ${!semesterValue ? '⚠️' : '✅'}`);
    console.log(`   📅 Start Date: ${actualEvent.startDate}`);
    console.log(`   📅 End Date: ${actualEvent.endDate}`);
    console.log(`   📆 Weekly Schedules: ${hasWeeklySchedules ? actualEvent.weeklySchedules.length + ' schedule(s)' : 'None'}`);
    if (hasWeeklySchedules) {
      const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const scheduledDays = actualEvent.weeklySchedules.map((ws: any) => weekDays[ws.weekId] || ws.weekId).join(', ');
      console.log(`      Days: ${scheduledDays}`);
    }
    console.log(`   👥 Students: ${actualEvent.participants?.length || 0}`);
    console.log(`   📖 Discipline ID: ${disciplineId || 'N/A'}`);
  });

  console.log("\n" + "═".repeat(60));
  console.log("\n\n");
});

// Watch for semester changes
watch(selectedSemesterId, (newVal, oldVal) => {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              🔄 SEMESTER FILTER CHANGED                    ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n   Old: "${oldVal || "(none)"}"`);
  console.log(`   New: "${newVal || "(none)"}"`);
  console.log("\n" + "─".repeat(60));
});

// Watch for academicYearSemester data to arrive and auto-select
watch(
  () => academicYearSemesterStore.academicYearSemesters,
  (semesters) => {
    console.log("\n🔔 AcademicYearSemesters changed, count:", semesters.length);

    // Only auto-select if no semester is currently selected and we have data
    if (!selectedSemesterId.value && semesters.length > 0) {
      const activeSemesters = academicYearSemesterStore.getActiveAcademicYearSemesters;
      console.log("   Active semesters available:", activeSemesters.length);

      if (activeSemesters.length > 0) {
        selectedSemesterId.value = activeSemesters[0].id;
        console.log(`   ✅ Auto-selected semester: ${activeSemesters[0].semesterNumber} (ID: ${activeSemesters[0].id})`);
      }
    }
  },
  { deep: true }
);

// Filtering journals by selected year/semester/teacher
const filteredJournalsByCourse = computed(() => {
  const result: Record<number, Journal[]> = {};
  courses.value.forEach((course) => {
    result[parseInt(course.number)] = [];
  });

  const yearId = selectedItemsStore.selectedAcademicYearId;
  const semId = selectedSemesterId.value;
  const teacherId = calendarStore.selectedTeacherId;

  // DEBUG: Show filter state
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║              🔍 FILTERING JOURNALS                         ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log(`\n🎯 Filter Criteria:`);
  console.log(`   Semester ID: "${semId || "(none)"}"`);
  console.log(`   Year ID: "${yearId || "(none)"}"`);
  console.log(`   Teacher ID: "${teacherId || "(none)"}"`);

  Object.keys(journalsByCourse.value).forEach((courseNumberStr) => {
    const courseNumber = parseInt(courseNumberStr);
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📚 COURSE ${courseNumber}`);
    console.log("─".repeat(60));

    result[courseNumber] = journalsByCourse.value[courseNumber].filter(
      (journal) => {
        const event = calendarStore.getEventById(journal.id);
        const disciplineTitle = journalStore.getDisciplineTitle(journal);

        console.log(`\n   📖 ${disciplineTitle}`);
        console.log(`      ID: ${journal.id}`);
        console.log(`      🔀 Is Mixed Group: ${journal.isMixedGroup ? 'Yes' : 'No'}`);

        // Skip mixed group journals - they should only appear in the mixed groups column
        if (journal.isMixedGroup) {
          console.log(`      ⏭️  SKIPPED: Mixed group journal (will show in mixed groups column)`);
          return false;
        }

        if (!event) {
          console.log(`      ❌ FILTERED: Event not found`);
          return false;
        }

        console.log(`      📌 Event Semester: "${event.semester || "(empty)"}"`);
        console.log(`      📅 Date Range: ${event.startDate} to ${event.endDate}`);
        console.log(`      📆 Weekly Schedules: ${event.weeklySchedules?.length || 0}`);
        console.log(`      👨‍🏫 Event Teacher: ${event.teacherId || "(none)"}`);

        if (teacherId && event.teacherId !== teacherId) {
          console.log(`      ❌ FILTERED: Teacher mismatch`);
          return false;
        }

        if (yearId && event.startDate) {
          // If events carry academic year id separately, prefer it; otherwise fallback to active year
          // Here we simply allow all; refine if academicYearId exists in event shape later
        }

        // Strict filtering: hide events with empty semesters when any semester is selected
        if (semId && (!event.semester || event.semester !== semId)) {
          if (!event.semester) {
            console.log(`      ❌ FILTERED: No semester assigned (empty) - strict filtering applied`);
          } else {
            console.log(`      ❌ FILTERED: Semester mismatch (has "${event.semester}", need "${semId}")`);
          }
          return false;
        }

        console.log(`      ✅ PASSED: Will be displayed`);
        return true;
      }
    );

    console.log(`\n   📊 Course ${courseNumber} Result: ${result[courseNumber].length} journal(s)`);
  });

  console.log("\n" + "═".repeat(60));

  // Summary
  const totalDisplayed = Object.values(result).reduce(
    (sum, journals) => sum + journals.length,
    0
  );

  console.log("\n📊 FINAL SUMMARY:");
  console.log(`   Total Journals Displayed: ${totalDisplayed}`);

  const courseSummary = Object.entries(result)
    .filter(([_, journals]) => journals.length > 0)
    .map(([course, journals]) => `      • Course ${course}: ${journals.length} journal(s)`)
    .join("\n");

  if (courseSummary) {
    console.log(courseSummary);
  } else {
    console.log("      • No journals passed filters");
  }

  console.log("\n" + "═".repeat(60));
  console.log("\n");

  return result;
});

const filteredMixedGroupJournals = computed(() => {
  const yearId = selectedItemsStore.selectedAcademicYearId;
  const semId = selectedSemesterId.value;
  const teacherId = calendarStore.selectedTeacherId;

  console.log("\n");
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           🔀 FILTERING MIXED GROUP JOURNALS                ║");
  console.log("╚════════════════════════════════════════════════════════════╝");

  const filtered = mixedGroupJournals.value.filter((journal) => {
    const event = calendarStore.getEventById(journal.id);
    const disciplineTitle = journalStore.getDisciplineTitle(journal);

    console.log(`\n   📖 ${disciplineTitle}`);
    console.log(`      ID: ${journal.id}`);
    console.log(`      🔀 Is Mixed Group: ${journal.isMixedGroup ? 'Yes ✅' : 'No'}`);

    if (!event) {
      console.log(`      ❌ FILTERED: Event not found`);
      return false;
    }

    console.log(`      📌 Event Semester: "${event.semester || "(empty)"}"`);
    console.log(`      📅 Date Range: ${event.startDate} to ${event.endDate}`);
    console.log(`      📆 Weekly Schedules: ${event.weeklySchedules?.length || 0}`);
    console.log(`      👨‍🏫 Event Teacher: ${event.teacherId || "(none)"}`);

    if (teacherId && event.teacherId !== teacherId) {
      console.log(`      ❌ FILTERED: Teacher mismatch`);
      return false;
    }

    if (yearId && event.startDate) {
      // Same note as above
    }

    // Strict filtering: hide events with empty semesters when any semester is selected
    if (semId && (!event.semester || event.semester !== semId)) {
      if (!event.semester) {
        console.log(`      ❌ FILTERED: No semester assigned (empty) - strict filtering applied`);
      } else {
        console.log(`      ❌ FILTERED: Semester mismatch (has "${event.semester}", need "${semId}")`);
      }
      return false;
    }

    console.log(`      ✅ PASSED: Will be displayed`);
    return true;
  });

  console.log(`\n📊 Mixed Groups Result: ${filtered.length} journal(s)`);
  console.log("\n" + "═".repeat(60));
  console.log("\n");

  return filtered;
});

const goToJournalDetails = (id: number | string) => {
  f7.views.main.router.navigate(`/journals/${id}?from=journals`);
};

const selectedDiscipline = ref("");
const disciplineOptions = [{ value: "philosophy", text: "Философия" }];

const selectedTerm = ref("");
const termOptions = ref([{ value: "1y", text: "1 год" }]);

const selectedStatus = ref("");
const statusOptions = ref([{ value: "active", text: "Активный" }]);

const selectedGroup = ref("");
const groupOptions = ref([{ value: "pi-1-21", text: "ПИ-1-21" }]);

const selectedRole = ref("");
const roleOptions = ref([{ value: "student", text: "Студент" }]);

const isSelectionMode = ref(false);
const selectedJournalIds = ref(new Set<string>());

function selectAll() {
  const allJournalIds: string[] = [];

  Object.values(journalsByCourse.value).forEach((courseJournals) => {
    courseJournals.forEach((journal) => {
      allJournalIds.push(journal.id);
    });
  });

  mixedGroupJournals.value.forEach((journal) => {
    allJournalIds.push(journal.id);
  });

  selectedJournalIds.value = new Set(allJournalIds);
}

function deselectAll() {
  selectedJournalIds.value.clear();
}

function toggleJournalSelection(id: string) {
  if (selectedJournalIds.value.has(id)) {
    selectedJournalIds.value.delete(id);
  } else {
    selectedJournalIds.value.add(id);
  }
}

async function downloadSelectedJournals() {
  try {
    const JSZip = (await import("jszip")).default;
    const { saveAs } = await import("file-saver");

    const zip = new JSZip();
    const templateUrl = encodeURI(
      "/journal_templates/1_семестр_РО_4_1_ВА22_академическое_рус_яз_,_ВЭ22_эстрадное_рус.xlsx"
    );

    const exportTasks: Promise<void>[] = [];

    selectedJournalIds.value.forEach((journalId) => {
      let journal: Journal | null = null;

      for (const courseNumber in journalsByCourse.value) {
        const found = journalsByCourse.value[courseNumber].find(
          (j) => j.id === journalId
        );
        if (found) {
          journal = found;
          break;
        }
      }

      if (!journal) {
        journal = mixedGroupJournals.value.find((j) => j.id === journalId) ?? null;
      }

      if (!journal) return;

      const event = calendarStore.getEventById(journal.id);

      const studentRows: JournalStudentRow[] = (journal.students || []).map(
        (studentId) => ({
          id: studentId,
          fullName: studentStore.getStudentFullName(studentId),
        })
      );

      const primaryStudentId = journal.students?.[0];
      const primaryStudent = primaryStudentId
        ? students.value.find((s) => s.id === primaryStudentId)
        : undefined;
      const specialty = primaryStudent?.specialty
        ? specialtyStore.getSpecialtyByCode(primaryStudent.specialty)
        : undefined;

      const academicYearId = selectedItemsStore.selectedAcademicYearId;
      const academicYear = academicYearId
        ? academicYearStore.getAcademicYearById(academicYearId)
        : academicYearStore.getActiveAcademicYear;

      const academicYearLabel = academicYear
        ? `${academicYear.startYear}/${academicYear.endYear}`
        : "";

      const teacherName = event?.teacherId
        ? teacherStore.getTeacherFullName(event.teacherId)
        : "";

      const disciplineTitle = journalStore.getDisciplineTitle(journal);
      const groupTitle = journalStore.getJournalTitle(journal);

      const filename = `${disciplineTitle}_${groupTitle}`
        .replace(/[^a-zA-Zа-яА-Я0-9_\-\.]/g, "_")
        .concat(".xlsx");

      exportTasks.push(
        exportJournalToExcel({
          templateUrl,
          groupName: groupTitle,
          courseLabel: journal.courseNumber.toString(),
          specialtyLabel: specialty
            ? `${specialty.code} - ${specialty.name}`
            : undefined,
          academicYearLabel,
          disciplineTitle,
          teacherFullName: teacherName,
          students: studentRows,
          calendarEvent: event ?? undefined,
        }).then((buffer) => {
          zip.file(filename, buffer);
        })
      );
    });

    await Promise.all(exportTasks);

    const content = await zip.generateAsync({ type: "blob" });
    const date = new Date().toISOString().split("T")[0];
    saveAs(content, `journals-${date}.zip`);

    isSelectionMode.value = false;
    selectedJournalIds.value.clear();
  } catch (error) {
    console.error("Failed to export journals", error);
    f7.dialog.alert("Не удалось сформировать журналы. Попробуйте еще раз.");
  }
}

function onSettingsClick() {
  f7.dialog.alert("Откроются настройки журнала");
}

function onCloseJournalClick() {
  f7.dialog.alert("Журнал будет закрыт");
}

function onDownloadClick() {
  if (!isSelectionMode.value) {
    isSelectionMode.value = true;
  } else {
    if (selectedJournalIds.value.size > 0) {
      downloadSelectedJournals();
    } else {
      f7.dialog.alert("Выберите хотя бы один журнал");
    }
  }
}

function onUploadClick() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx,.xls";
  input.multiple = false;

  input.onchange = async (event) => {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    try {
      f7.preloader.show();
      const summary = await importJournalFromExcel(file);
      f7.preloader.hide();

      if (summary.issues.some((issue) => issue.type === "error")) {
        const errorText = summary.issues
          .filter((issue) => issue.type === "error")
          .map((issue) => `• ${issue.message}`)
          .join("\n");
        f7.dialog.alert(errorText || "Не удалось импортировать журнал");
        return;
      }

      const warnings = summary.issues
        .filter((issue) => issue.type === "warning")
        .map((issue) => `• ${issue.message}`)
        .join("\n");

      const result = summary.result;
      if (!result) {
        f7.dialog.alert("Файл обработан, но данные журнала не получены");
        return;
      }

      const messageParts = [
        `<b>Группа:</b> ${result.metadata.groupName || "не указана"}`,
        `<b>Курс:</b> ${result.metadata.courseLabel || "-"}`,
        `<b>Специальность:</b> ${result.metadata.specialtyLabel || "-"}`,
        `<b>Учебный год:</b> ${result.metadata.academicYearLabel || "-"}`,
        `<b>Дисциплина:</b> ${result.metadata.disciplineTitle || "-"}`,
        `<b>Преподаватель:</b> ${result.metadata.teacherFullName || "-"}`,
        `<b>Студентов:</b> ${result.students.length}`,
        `<b>Дата столбцов:</b> ${result.metadata.lessonDates.join(", ") || "-"}`,
      ];

      if (warnings) {
        messageParts.push(`<br/><b>Предупреждения:</b><br/>${warnings.replace(/\n/g, "<br/>")}`);
      }

      f7.dialog.alert(messageParts.join("<br/>") || "Импорт завершён");
    } catch (error) {
      f7.preloader.hide();
      const message =
        error instanceof Error ? error.message : "Не удалось импортировать журнал";
      f7.dialog.alert(message);
    }
  };

  input.click();
}

function onShareClick() {
  f7.dialog.alert("Поделиться журналами");
}
</script>

<style>
.journals-page-header .smart-select-list-container {
  background-color: hsl(var(--card)) !important;
}

.journals-page-header .smart-select-list-container .item-inner {
  background-color: hsl(var(--card)) !important;
}

.smart-select-list-container .item-after {
  white-space: nowrap;
  word-break: normal;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.popover.smart-select-popover {
  max-width: calc(100vw - 20px);
}

.popover.smart-select-popover .list {
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}

@media (max-width: 640px) {
  .journals-page-header {
    gap: 0.75rem;
  }

  .journals-page-header .smart-select-list-container {
    flex: 1 1 auto;
    min-width: 0;
  }
}
</style>
