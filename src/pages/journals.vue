<template>
  <f7-page
    name="journals"
    class="journals-page flex flex-col h-screen bg-background text-foreground"
    :data-page-id="`journals-${pageId}`"
    data-page-name="journals"
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
                class="w-full sm:w-[250px]"
                :searchable="true"
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
                  @click="exitSelectionMode"
                  class="bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors flex-1 sm:flex-none"
                >
                  <f7-icon
                    ios="f7:xmark"
                    md="material:close"
                    size="16px"
                    class="mr-2"
                  />
                  Отмена
                </f7-button>
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
                  @click="onSelectionDone"
                  :class="selectionDoneButtonClass"
                  :disabled="selectedJournalIds.size === 0"
                >
                  <f7-icon
                    v-if="selectionAction === 'download'"
                    ios="f7:arrow_down_to_line"
                    md="material:file_download"
                    size="16px"
                    class="mr-2"
                  />
                  <f7-icon
                    v-else-if="selectionAction === 'close'"
                    ios="f7:xmark_circle"
                    md="material:cancel"
                    size="16px"
                    class="mr-2"
                  />
                  <f7-icon
                    v-else-if="selectionAction === 'replace'"
                    ios="f7:arrow_2_squarepath"
                    md="material:swap_horiz"
                    size="16px"
                    class="mr-2"
                  />
                  <f7-icon
                    v-else
                    ios="f7:lock_open"
                    md="material:lock_open"
                    size="16px"
                    class="mr-2"
                  />
                  {{ selectionDoneText }} ({{ selectedJournalIds.size }})
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
                  @click="onOpenJournalClick"
                  class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors flex-1 sm:flex-none"
                >
                  <f7-icon
                    ios="f7:lock_open"
                    md="material:lock_open"
                    size="16px"
                    class="mr-2"
                  />
                  Открыть журнал
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
                  id="replace-journal-button"
                  small
                  default
                  @click="onReplaceClick"
                  class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors flex-1 sm:flex-none"
                >
                  <f7-icon
                    ios="f7:arrow_2_squarepath"
                    md="material:swap_horiz"
                    size="16px"
                    class="mr-2"
                  />
                  Заменить
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
                        :group-language="journalStore.getJournalGroupLanguage(journal)"
                        :schedule="journalStore.getJournalScheduleText(journal)"
                        :percent="journalStore.getJournalPercent(journal)"
                        :selection-mode="isSelectionMode"
                        :selected="selectedJournalIds.has(journal.id)"
                        :show-edit-button="false"
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
                        :group-language="journalStore.getJournalGroupLanguage(journal)"
                        :schedule="journalStore.getJournalScheduleText(journal)"
                        :percent="journalStore.getJournalPercent(journal)"
                        :selection-mode="isSelectionMode"
                        :selected="selectedJournalIds.has(journal.id)"
                        :show-edit-button="false"
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
                  <div v-if="idx === 3" class="flex flex-col gap-3 w-full">
                    <h2
                      class="font-semibold text-sm text-center py-1 bg-primary/10 rounded-md text-primary flex items-center justify-between px-2"
                    >
                      <span>индивидуальный журнал</span>
                      <button
                        @click="onAddIndividualJournal"
                        class="w-6 h-6 rounded-md bg-primary hover:bg-primary-dark transition-colors flex items-center justify-center"
                      >
                        <f7-icon
                          ios="f7:plus"
                          md="material:add"
                          size="16px"
                          class="text-white"
                        />
                      </button>
                    </h2>
                    <div
                      v-for="journal in filteredIndividualJournals"
                      :key="journal.id"
                    >
                      <JournalCard
                        :title="journalStore.getDisciplineTitle(journal)"
                        :subtitle="journalStore.getJournalSubtitle(journal)"
                        :group-language="journalStore.getJournalGroupLanguage(journal)"
                        :schedule="journalStore.getJournalScheduleText(journal)"
                        :percent="journalStore.getJournalPercent(journal)"
                        :selection-mode="isSelectionMode"
                        :selected="selectedJournalIds.has(journal.id)"
                        :show-edit-button="true"
                        @click="goToJournalDetails(journal.id)"
                        @toggle-select="toggleJournalSelection(journal.id)"
                        @edit="onEditIndividualJournal(journal.id)"
                      />
                    </div>
                    <div
                      v-if="filteredIndividualJournals.length === 0"
                      class="rounded-lg p-4 text-gray-500 shadow-sm min-h-[90px] flex items-center justify-center bg-gray-50 border border-gray-100"
                    >
                      <p class="text-sm">Нет индивидуальных журналов</p>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <IndividualJournalPopup
      ref="individualJournalPopupRef"
      @save="onIndividualJournalSave"
      @close="onIndividualJournalClose"
    />

    <ReplaceJournalPopover
      :is-loading="isReplacingJournals"
      @save="handleReplaceJournals"
      @cancel="handleReplaceCancel"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { useSidebar } from "@/composables/useSidebar";
const { contentMargin } = useSidebar();
import { ref, computed, onMounted, watch } from "vue";
import { f7Page, f7Input, f7, f7Icon, f7Button } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import JournalCard from "@/components/Cards/JournalCard.vue";
import IndividualJournalPopup from "@/components/IndividualJournalPopup.vue";
import ReplaceJournalPopover from "@/components/ReplaceJournalPopover.vue";
import type { ReplaceJournalData } from "@/components/ReplaceJournalPopover.vue";
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
import { useClass9Store, type DistributionEntry } from "@/stores/class9Store";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { useMarksStore } from "@/stores/marksStore";
import type { Id } from "@convex/_generated/dataModel";
import { useJournalOpenClose } from "@/composables/useJournalOpenClose";
import { saveAs } from "file-saver";
import {
  exportJournalViaConvex,
  importJournalViaConvex,
  type JournalExportParams,
} from "@/services/convex-excel-export";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import {
  extractLessonDates,
  formatAttendanceValue,
  extractFinalGrade,
  prepareJournalExportMetadata,
} from "@/utils/journalExport";

type JournalStudentRow = JournalExportParams["students"][number];

// Unique page ID that changes on each mount to track navigation
const pageId = ref(Date.now());

const activeNavItem = ref("journals");

const journalStore = useJournalStore();
const userStore = useUserStore();
const calendarStore = useCalendarStore();
const { confirmCloseJournals, confirmOpenJournals } = useJournalOpenClose();
const teacherStore = useTeacherStore();
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const class9Store = useClass9Store();
const finalControlStore = useFinalControlStore();
const scheduledFinalControlStore = useScheduledFinalControlStore();
const marksStore = useMarksStore();
const { journalsByCourse, mixedGroupJournals, individualJournals } = storeToRefs(journalStore);
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
  get: () => calendarStore.selectedTeacherId || "all",
  set: (value: string) => calendarStore.setSelectedTeacher(value === "all" ? null : value),
});

const teacherOptions = computed(() => [
  { value: "all", text: "Все" },
  ...teacherStore.teacherSelectOptions,
]);

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

        // Check teacher match - event.teacherId could be either teacher record ID or user ID
        if (teacherId) {
          const selectedTeacher = teacherStore.getTeacherById(teacherId);
          const teacherUserId = selectedTeacher?.userId;
          const isTeacherMatch = event.teacherId === teacherId || event.teacherId === teacherUserId;
          if (!isTeacherMatch) {
            console.log(`      ❌ FILTERED: Teacher mismatch`);
            return false;
          }
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

    // Check teacher match - event.teacherId could be either teacher record ID or user ID
    if (teacherId) {
      const selectedTeacher = teacherStore.getTeacherById(teacherId);
      const teacherUserId = selectedTeacher?.userId;
      const isTeacherMatch = event.teacherId === teacherId || event.teacherId === teacherUserId;
      if (!isTeacherMatch) {
        console.log(`      ❌ FILTERED: Teacher mismatch`);
        return false;
      }
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

const filteredIndividualJournals = computed(() => {
  const yearId = selectedItemsStore.selectedAcademicYearId;
  const semId = selectedSemesterId.value;
  const teacherId = calendarStore.selectedTeacherId;

  return individualJournals.value.filter((journal) => {
    const event = calendarStore.getEventById(journal.id);

    if (!event) return false;

    // Check teacher match - event.teacherId could be either teacher record ID or user ID
    if (teacherId) {
      const selectedTeacher = teacherStore.getTeacherById(teacherId);
      const teacherUserId = selectedTeacher?.userId;
      const isTeacherMatch = event.teacherId === teacherId || event.teacherId === teacherUserId;
      if (!isTeacherMatch) return false;
    }

    if (semId && (!event.semester || event.semester !== semId)) return false;

    return true;
  });
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

type SelectionAction = "download" | "close" | "open" | "replace";

const isSelectionMode = ref(false);
const selectionAction = ref<SelectionAction>("download");
const selectedJournalIds = ref(new Set<string>());

const selectionDoneText = computed(() => {
  if (selectionAction.value === "close") return "Закрыть";
  if (selectionAction.value === "open") return "Открыть";
  if (selectionAction.value === "replace") return "Заменить";
  return "Скачать";
});

const selectionDoneButtonClass = computed(() => {
  const base = "text-white transition-colors flex-1 sm:flex-none";
  if (selectionAction.value === "close") return `bg-red-500 hover:bg-red-600 ${base}`;
  if (selectionAction.value === "open") return `bg-green-500 hover:bg-green-600 ${base}`;
  if (selectionAction.value === "replace") return `bg-orange-500 hover:bg-orange-600 ${base}`;
  return `bg-primary hover:bg-primary-dark ${base}`;
});

function startSelectionMode(action: SelectionAction) {
  selectionAction.value = action;
  isSelectionMode.value = true;
  selectedJournalIds.value.clear();
}

function exitSelectionMode() {
  isSelectionMode.value = false;
  selectedJournalIds.value.clear();
}

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
    f7.preloader.show();

    const journalsData: Array<{
      filename: string;
      groupName: string;
      courseLabel: string;
      specialtyLabel?: string;
      academicYearLabel?: string;
      disciplineTitle: string;
      teacherFullName?: string;
      finalControlForm?: string | null;
      students: JournalStudentRow[];
      lessonDates?: string[];
    }> = [];

    // Process journals sequentially to load marks for each
    for (const journalId of selectedJournalIds.value) {
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

      if (!journal) {
        journal = individualJournals.value.find((j) => j.id === journalId) ?? null;
      }

      if (!journal) continue;

      const event = calendarStore.getEventById(journal.id);

      // Load marks for this journal from backend
      await marksStore.loadJournalMarks(journalId);
      const journalMarks = marksStore.getJournalMarks(journalId);

      // Get marks structure from first student to determine columns (export ALL columns like JournalDetails)
      const firstStudentMarks = journalMarks?.studentMarks?.[0]?.marks || [];

      // Use utility to extract lesson dates from marks template
      const lessonDates = extractLessonDates(firstStudentMarks);

      // Build student rows with attendance data for ALL columns
      const studentRows: JournalStudentRow[] = (journal.students || []).map(
        (studentId) => {
          const studentMarks = marksStore.getStudentMarks(journalId, studentId) || [];

          // Build attendance array from ALL marks using utility function
          const attendance: (string | number | null)[] = firstStudentMarks.map((_, markIndex) => {
            const mark = studentMarks[markIndex];
            return formatAttendanceValue(mark);
          });

          // Extract final grade using utility function
          const finalGrade = extractFinalGrade(studentMarks);

          return {
            id: studentId,
            fullName: studentStore.getStudentFullName(studentId),
            attendance,
            finalGrade,
          };
        }
      );

      // Prepare export metadata using shared utility
      const academicYearId = selectedItemsStore.selectedAcademicYearId;
      const academicYear = academicYearId
        ? academicYearStore.getAcademicYearById(academicYearId)
        : academicYearStore.getActiveAcademicYear;

      const semesters = academicYear
        ? academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(academicYear.id)
        : [];

      const metadata = prepareJournalExportMetadata({
        journal,
        event,
        students: students.value,
        academicYear,
        selectedAcademicYearId: academicYearId,
        class9Items: class9Store.class9Items,
        academicYearSemesters: semesters,
        scheduledFinalControls: scheduledFinalControlStore.scheduledFinalControls,
        finalControls: finalControlStore.finalControls,
        getSpecialtyByCode: (code: string) => specialtyStore.getSpecialtyByCode(code),
        getTeacherFullName: (id: string) => teacherStore.getTeacherFullName(id),
        getDisciplineTitle: (j) => journalStore.getDisciplineTitle(j),
        getJournalTitle: (j) => journalStore.getJournalTitle(j),
      });

      journalsData.push({
        filename: metadata.filename,
        groupName: metadata.groupName,
        courseLabel: metadata.courseLabel,
        specialtyLabel: metadata.specialtyLabel,
        academicYearLabel: metadata.academicYearLabel,
        disciplineTitle: metadata.disciplineTitle,
        teacherFullName: metadata.teacherFullName,
        finalControlForm: metadata.finalControlForm,
        students: studentRows,
        lessonDates,
      });
    }

    // Call backend to generate zip file
    const storageId = await convex.action(api.excel.actions.exportJournalsZip, {
      journals: journalsData,
    });

    // Get download URL from storage
    const downloadUrl = await convex.query(api.files.queries.getFileUrl, {
      storageId: storageId as Id<"_storage">,
    });

    if (!downloadUrl) {
      throw new Error("Failed to get download URL");
    }

    // Download the file using file-saver
    const date = new Date().toISOString().split("T")[0];
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    saveAs(blob, `journals-${date}.zip`);

    f7.preloader.hide();
    exitSelectionMode();
  } catch (error) {
    f7.preloader.hide();
    console.error("Failed to export journals", error);
    f7.dialog.alert("Не удалось сформировать журналы. Попробуйте еще раз.");
  }
}

function onSettingsClick() {
  f7.dialog.alert("Откроются настройки журнала");
}

function onOpenJournalClick() {
  startSelectionMode("open");
}

function onCloseJournalClick() {
  startSelectionMode("close");
}

function onDownloadClick() {
  startSelectionMode("download");
}

function onReplaceClick() {
  startSelectionMode("replace");
}

function onSelectionDone() {
  if (selectedJournalIds.value.size === 0) {
    f7.dialog.alert("Выберите хотя бы один журнал");
    return;
  }

  const ids = Array.from(selectedJournalIds.value);

  if (selectionAction.value === "download") {
    void downloadSelectedJournals();
    return;
  }

  if (selectionAction.value === "replace") {
    f7.popover.open("#replace-journal-popover");
    return;
  }

  if (selectionAction.value === "close") {
    confirmCloseJournals(ids, {
      context: "Journals",
      onSuccess: exitSelectionMode,
      onNoop: () => {
        f7.toast
          .create({
            text: "Выбранные журналы уже закрыты",
            position: "center",
            closeTimeout: 2000,
          })
          .open();
        exitSelectionMode();
      },
    });
    return;
  }

  confirmOpenJournals(ids, {
    context: "Journals",
    onSuccess: exitSelectionMode,
    onNoop: () => {
      f7.toast
        .create({
          text: "Выбранные журналы уже открыты",
          position: "center",
          closeTimeout: 2000,
        })
        .open();
      exitSelectionMode();
    },
  });
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
      const summary = await importJournalViaConvex(file);
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

const isReplacingJournals = ref(false);

async function handleReplaceJournals(data: ReplaceJournalData) {
  try {
    isReplacingJournals.value = true;

    // Get selected journal IDs
    const ids = Array.from(selectedJournalIds.value);

    // TODO: Implement the actual replace logic here
    // This would typically involve calling a backend API to replace journals
    // with the specified teacher, period, and reason

    console.log('Replacing journals:', {
      journalIds: ids,
      teacherId: data.teacherId,
      startDate: data.startDate,
      endDate: data.endDate,
      reason: data.reason
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    isReplacingJournals.value = false;

    // Close the popover
    f7.popover.close("#replace-journal-popover");

    f7.toast.create({
      text: `Успешно заменено ${ids.length} журнал(ов)`,
      position: 'center',
      closeTimeout: 2000,
    }).open();

    exitSelectionMode();
  } catch (error) {
    isReplacingJournals.value = false;
    console.error('Failed to replace journals', error);
    f7.dialog.alert('Не удалось заменить журналы. Попробуйте еще раз.');
  }
}

function handleReplaceCancel() {
  f7.popover.close("#replace-journal-popover");
}

const individualJournalPopupRef = ref<InstanceType<typeof IndividualJournalPopup>>();

function onAddIndividualJournal() {
  individualJournalPopupRef.value?.open();
}

function onEditIndividualJournal(journalId: string) {
  individualJournalPopupRef.value?.open(journalId);
}

function onIndividualJournalSave() {
  console.log("Individual journal saved");
}

function onIndividualJournalClose() {
  console.log("Individual journal popup closed");
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
