<template>
  <f7-page
    name="journals"
    class="journals-page flex flex-col h-screen bg-background text-foreground"
    :data-page-id="`journals-${pageId}`"
    data-page-name="journals"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div class="flex flex-1 overflow-hidden">
      <div
        class="flex-1 overflow-y-auto p-6 md:p-8 bg-muted/40 pb-16 md:pb-6 transition-all duration-200"
        :class="contentMargin"
      >
        <div class="flex flex-col gap-6">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h1 class="text-4xl font-bold tracking-tight text-foreground">{{ journal_title() }}</h1>
              <div class="flex flex-wrap items-center gap-2 text-muted-foreground font-medium mt-2 text-[15px]">
                <span>Выберите журнал для работы</span>
                <span class="text-border">•</span>

                <!-- Year pill -->
                <div class="relative">
                  <button
                    class="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition-all shadow-sm"
                    @click="isYearPillOpen = !isYearPillOpen; isSemesterPillOpen = false; isTeacherPillOpen = false"
                  >
                    <span>{{ currentYearLabel }}</span>
                    <IconChevronDown class="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200" :class="{ 'rotate-180': isYearPillOpen }" />
                  </button>
                  <div v-if="isYearPillOpen" class="fixed inset-0 z-40" @click="isYearPillOpen = false" />
                  <div v-if="isYearPillOpen" class="absolute left-0 top-full mt-2 w-44 bg-card rounded-xl shadow-xl border border-border py-2 z-50">
                    <button
                      v-for="opt in academicYearOptions"
                      :key="opt.value"
                      class="w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted flex items-center justify-between"
                      @click="selectedAcademicYearModel = opt.value; isYearPillOpen = false"
                    >
                      <span>{{ opt.text }}</span>
                      <IconCheck v-if="selectedAcademicYearModel === opt.value" class="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>
                </div>

                <span class="text-border">•</span>

                <!-- Semester pill -->
                <div class="relative">
                  <button
                    class="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition-all shadow-sm"
                    @click="isSemesterPillOpen = !isSemesterPillOpen; isYearPillOpen = false; isTeacherPillOpen = false"
                  >
                    <span>{{ currentSemesterLabel }}</span>
                    <IconChevronDown class="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200" :class="{ 'rotate-180': isSemesterPillOpen }" />
                  </button>
                  <div v-if="isSemesterPillOpen" class="fixed inset-0 z-40" @click="isSemesterPillOpen = false" />
                  <div v-if="isSemesterPillOpen" class="absolute left-0 top-full mt-2 w-44 bg-card rounded-xl shadow-xl border border-border py-2 z-50">
                    <button
                      v-for="opt in semesterOptions"
                      :key="opt.value"
                      class="w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted flex items-center justify-between"
                      @click="selectedSemesterId = opt.value; isSemesterPillOpen = false"
                    >
                      <span>{{ opt.text }}</span>
                      <IconCheck v-if="selectedSemesterId === opt.value" class="w-3.5 h-3.5 text-primary" />
                    </button>
                  </div>
                </div>

                <template v-if="userStore.isAdmin">
                  <span class="text-border">•</span>

                  <!-- Teacher pill -->
                  <div class="relative">
                    <button
                      class="flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-xl text-sm font-bold hover:border-primary hover:text-primary transition-all shadow-sm"
                      @click="isTeacherPillOpen = !isTeacherPillOpen; isYearPillOpen = false; isSemesterPillOpen = false"
                    >
                      <span>{{ currentTeacherLabel }}</span>
                      <IconChevronDown class="w-3.5 h-3.5 text-muted-foreground transition-transform duration-200" :class="{ 'rotate-180': isTeacherPillOpen }" />
                    </button>
                    <div v-if="isTeacherPillOpen" class="fixed inset-0 z-40" @click="isTeacherPillOpen = false" />
                    <div v-if="isTeacherPillOpen" class="absolute left-0 top-full mt-2 w-64 bg-card rounded-xl shadow-xl border border-border py-2 z-50 max-h-72 overflow-y-auto">
                      <button
                        v-for="opt in teacherOptions"
                        :key="opt.value"
                        class="w-full text-left px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted flex items-center justify-between"
                        @click="selectedTeacherId = opt.value; isTeacherPillOpen = false"
                      >
                        <span class="truncate">{{ opt.text }}</span>
                        <IconCheck v-if="selectedTeacherId === opt.value" class="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      </button>
                    </div>
                  </div>
                </template>
              </div>
            </div>

            <!-- Action menu -->
            <div class="relative flex-shrink-0 mt-1">
              <button
                class="p-2.5 bg-card rounded-xl shadow-sm border border-border hover:border-primary hover:text-primary transition-all flex items-center justify-center"
                @click="isActionMenuOpen = !isActionMenuOpen"
              >
                <IconMoreVertical class="w-5 h-5" />
              </button>
              <div v-if="isActionMenuOpen" class="fixed inset-0 z-40" @click="isActionMenuOpen = false" />
              <div v-if="isActionMenuOpen" class="absolute right-0 top-full mt-2 w-64 bg-card rounded-2xl shadow-2xl border border-border py-2 z-50">
                <button class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                  @click="onDownloadClick(); isActionMenuOpen = false">
                  <IconArrowDownToLine class="w-4 h-4 flex-shrink-0" />
                  {{ journal_download() }}
                </button>
                <button class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                  @click="onMergeClick(); isActionMenuOpen = false">
                  <IconGitMerge class="w-4 h-4 flex-shrink-0" />
                  {{ journal_merge() }}
                </button>
                <button class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                  @click="onSplitClick(); isActionMenuOpen = false">
                  <IconUngroup class="w-4 h-4 flex-shrink-0" />
                  {{ journal_split() }}
                </button>
                <button class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                  @click="onCloseJournalClick(); isActionMenuOpen = false">
                  <IconCircleX class="w-4 h-4 flex-shrink-0" />
                  {{ journal_close() }}
                </button>
                <button class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                  @click="onOpenJournalClick(); isActionMenuOpen = false">
                  <IconLockOpen class="w-4 h-4 flex-shrink-0" />
                  {{ journal_open() }}
                </button>
                <button class="w-full text-left px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-3"
                  @click="onDeleteClick(); isActionMenuOpen = false">
                  <IconTrash2 class="w-4 h-4 flex-shrink-0" />
                  {{ journal_delete() }}
                </button>
                <div class="h-px bg-border my-1" />
                <button class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                  @click="onReplaceClick(); isActionMenuOpen = false">
                  <IconRefreshCw class="w-4 h-4 flex-shrink-0" />
                  {{ journal_replace() }}
                </button>
                <button class="w-full text-left px-4 py-2.5 text-sm text-foreground hover:bg-primary/10 hover:text-primary transition-colors flex items-center gap-3"
                  @click="onSettingsClick(); isActionMenuOpen = false">
                  <IconSettings2 class="w-4 h-4 flex-shrink-0" />
                  {{ journal_settings() }}
                </button>
              </div>
            </div>
          </div>

          <!-- Filter selects commented out — not in concept design
          <div class="flex flex-wrap gap-4 mb-6">
              <Select
                v-model="selectedDiscipline"
                :options="disciplineOptions"
                :placeholder="journal_discipline()"
                name="discipline"
                class="flex-1 min-w-[150px] sm:min-w-[200px]"
              />
              <Select
                v-model="selectedTerm"
                :options="termOptions"
                :placeholder="journal_term()"
                name="term"
                class="flex-1 min-w-[150px] sm:min-w-[200px]"
              />
              <Select
                v-model="selectedStatus"
                :options="statusOptions"
                :placeholder="journal_status()"
                name="status"
                class="flex-1 min-w-[150px] sm:min-w-[200px]"
              />
              <Select
                v-model="selectedGroup"
                :options="groupOptions"
                :placeholder="journal_group()"
                name="group"
                class="flex-1 min-w-[150px] sm:min-w-[200px]"
              />
              <Select
                v-model="selectedRole"
                :options="roleOptions"
                :placeholder="journal_role()"
                name="role"
                class="flex-1 min-w-[150px] sm:min-w-[200px]"
              />
            </div>
          -->
            <div v-if="isSelectionMode" class="mb-3 flex items-center gap-3 bg-card p-2 rounded-xl border border-primary/20 shadow-sm">
              <div class="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg text-primary font-bold text-sm whitespace-nowrap flex-shrink-0">
                <IconCircleCheck class="w-4 h-4 flex-shrink-0" />
                <span class="whitespace-nowrap">Выбрано: {{ selectedJournalIds.size }}</span>
              </div>
              <div class="h-6 w-px bg-border mx-1" />
              <button
                @click="selectAll"
                class="px-4 py-1.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              >
                {{ journal_select_all() }}
              </button>
              <button
                @click="deselectAll"
                class="px-4 py-1.5 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition-colors"
              >
                {{ journal_deselect_all() }}
              </button>
              <div class="flex-1" />
              <button
                @click="exitSelectionMode"
                class="px-4 py-1.5 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                {{ common_cancel() }}
              </button>
              <button
                @click="onSelectionDone"
                :disabled="selectedJournalIds.size === 0"
                :class="[
                  'px-6 py-1.5 text-sm font-bold rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                  selectionAction === 'delete' || selectionAction === 'close'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : selectionAction === 'open'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                ]"
              >
                {{ selectionDoneText }}
              </button>
            </div>
            <!-- Замещаемые журналы -->
            <div v-if="activeSubstitutions.length > 0" class="flex flex-col gap-3 mb-2">
              <div class="flex items-center gap-2">
                <h2 class="text-base font-bold text-foreground">Замещаемые журналы</h2>
                <span class="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-700 rounded-full">{{ activeSubstitutions.length }}</span>
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                <JournalGridCard
                  v-for="sub in activeSubstitutions"
                  :key="sub._id"
                  :title="sub.journalSnapshot?.disciplineName ?? 'Неизвестная дисциплина'"
                  :subtitle="[sub.fromTeacher ? `${sub.fromTeacher.surname} ${sub.fromTeacher.firstName}` : '', sub.journalSnapshot?.groupName].filter(Boolean).join(' · ')"
                  :accent-color="{ bg: 'bg-amber-100', text: 'text-amber-700' }"
                  :student-count="0"
                  :selection-mode="false"
                  @click="sub.journal?.calendarEventId && goToJournalDetails(sub.journal.calendarEventId)"
                />
              </div>
            </div>

            <!-- Filter bar -->
            <div class="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-xl overflow-x-auto max-w-full mb-5">
              <button
                v-for="f in JOURNAL_FILTERS"
                :key="f.id"
                type="button"
                :aria-pressed="activeFilter === f.id"
                @click="activeFilter = f.id"
                class="px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 whitespace-nowrap"
                :class="activeFilter === f.id
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'"
              >
                {{ f.label }}
              </button>
            </div>

            <!-- Journal grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              <!-- Loading skeleton (shown until disciplines and active year are ready) -->
              <template v-if="!isDataReady">
                <div
                  v-for="i in 8"
                  :key="`skeleton-${i}`"
                  class="rounded-[20px] bg-card border border-transparent shadow-sm p-4 flex flex-col gap-3 animate-pulse"
                >
                  <div class="flex justify-between items-start">
                    <div class="w-12 h-12 rounded-xl bg-muted" />
                  </div>
                  <div class="flex-1 space-y-2">
                    <div class="h-5 bg-muted rounded w-3/4" />
                    <div class="h-3 bg-muted rounded w-1/2" />
                  </div>
                  <div class="flex gap-2">
                    <div class="h-6 w-16 bg-muted rounded-md" />
                    <div class="h-6 w-14 bg-muted rounded-md" />
                  </div>
                </div>
              </template>
              <JournalGridCard
                v-for="journal in (isDataReady ? filteredByTab : [])"
                :key="journal.id"
                :title="journalStore.getDisciplineTitle(journal)"
                :subtitle="journalStore.getJournalSubtitle(journal)"
                :accent-color="getJournalAccentColor(journal.id)"
                :course-number="(!journal.isMixedGroup && !journal.isIndividualJournal) ? journal.courseNumber : undefined"
                :student-count="journal.students?.length ?? 0"
                :selection-mode="isSelectionMode"
                :selected="selectedJournalIds.has(journal.id)"
                :is-merged="!!journal.mergedJournalIds?.length"
                :disabled="isSelectionMode && selectionAction === 'split' && !journal.mergedJournalIds?.length"
                @click="goToJournalDetails(journal.id)"
                @toggle-select="toggleJournalSelection(journal.id)"
                @download="handleCardDownload(journal.id)"
                @delete="handleCardDelete(journal.id)"
                @edit="onEditJournal(journal.id)"
                @split="onSplitJournal(journal.id)"
                @substitute="handleCardSubstitute(journal.id)"
              />
              <div
                v-if="isDataReady && filteredByTab.length === 0"
                class="col-span-full rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground"
              >
                <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <IconInbox class="w-6 h-6 opacity-40" />
                </div>
                <span class="text-sm font-medium opacity-60">{{ journal_empty() }}</span>
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
      :excluded-teacher-ids="selectedJournalTeacherIds"
      @save="handleReplaceJournals"
      @cancel="handleReplaceCancel"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { f7Page, f7, f7Button } from "framework7-vue";
import IconX from "~icons/lucide/x";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconCircleX from "~icons/lucide/circle-x";
import IconArrowDownToLine from "~icons/lucide/arrow-down-to-line";
import IconArrowUpToLine from "~icons/lucide/arrow-up-to-line";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import IconLockOpen from "~icons/lucide/lock-open";
import IconGitMerge from "~icons/lucide/git-merge";
import IconUngroup from "~icons/lucide/ungroup";
import IconTrash2 from "~icons/lucide/trash-2";
import IconSettings2 from "~icons/lucide/settings-2";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconCheck from "~icons/lucide/check";
import IconInbox from "~icons/lucide/inbox";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import IndividualJournalPopup from "@/components/IndividualJournalPopup.vue";
import ReplaceJournalPopover from "@/components/ReplaceJournalPopover.vue";
import type { ReplaceJournalData } from "@/components/ReplaceJournalPopover.vue";
import JournalGridCard from '@/components/Cards/JournalGridCard.vue'
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
import { useSubstitutionStore } from "@/stores/substitutionStore";
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
import { useSidebar } from "@/composables/useSidebar";
import {
  journal_title,
  journal_academic_year,
  journal_semester,
  journal_teacher,
  journal_discipline,
  journal_term,
  journal_status,
  journal_group,
  journal_role,
  journal_settings,
  journal_open,
  journal_close,
  journal_download,
  journal_replace,
  journal_select_all,
  journal_deselect_all,
  journal_empty,
  journal_merge,
  journal_split,
  journal_merge_confirm_title,
  journal_merge_confirm_message,
  journal_split_confirm_title,
  journal_split_confirm_message,
  journal_filter_all,
  journal_filter_course_1,
  journal_filter_course_2,
  journal_filter_course_3,
  journal_filter_course_4,
  journal_filter_mixed,
  journal_filter_individual,
  journal_action_close,
  journal_action_open,
  journal_action_merge,
  journal_action_replace,
  journal_action_download,
  journal_action_delete,
  journal_delete,
  journal_delete_confirm_title,
  journal_delete_confirm_message,
  journal_select_one,
  journal_already_closed,
  journal_already_open,
  journal_export_error,
  journal_settings_dialog,
  journal_replaced_success,
  journal_replace_error,
  common_cancel,
  common_all,
  common_menu,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();
const { contentMargin, openMobile } = useSidebar();

const handleTabClick = (item: any) => {
  activeNavItem.value = item.id;
  f7.views.main.router.navigate(item.route);
};

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
    text: `${journal_semester()} ${ays.semesterNumber}`,
  }));
});

const selectedTeacherId = computed({
  get: () => calendarStore.selectedTeacherId || "all",
  set: (value: string) => calendarStore.setSelectedTeacher(value === "all" ? null : value),
});

const teacherOptions = computed(() => {
  void locale;
  return [
    { value: "all", text: common_all() },
    ...teacherStore.teacherSelectOptions,
  ];
});

const currentYearLabel = computed(() => {
  const found = academicYearOptions.value.find(o => o.value === selectedAcademicYearModel.value)
  return found?.text ?? journal_academic_year()
})

const currentSemesterLabel = computed(() => {
  const found = semesterOptions.value.find(o => o.value === selectedSemesterId.value)
  return found?.text ?? journal_semester()
})

const currentTeacherLabel = computed(() => {
  const found = teacherOptions.value.find(o => o.value === selectedTeacherId.value)
  return found?.text ?? journal_teacher()
})

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

  if (userStore.currentUser?.id) {
    substitutionStore.loadForUser(userStore.currentUser.id as Id<"users">);
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

  pageReady.value = true;
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
  activeFilter.value = 'all'
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

// ─── Journal grid redesign ────────────────────────────────────────────────

const JOURNAL_CARD_PALETTE = [
  { bg: '#EFF6FF', text: '#3b82f6' },
  { bg: '#F0FDF4', text: '#10b981' },
  { bg: '#FFF7ED', text: '#f59e0b' },
  { bg: '#F5F3FF', text: '#8b5cf6' },
  { bg: '#FFF1F2', text: '#f43f5e' },
  { bg: '#ECFDF5', text: '#059669' },
] as const

function getJournalAccentColor(id: string): { bg: string; text: string } {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) & 0xfffffff
  }
  return JOURNAL_CARD_PALETTE[hash % JOURNAL_CARD_PALETTE.length]
}

const pageReady = ref(false)
const isDataReady = computed(() => pageReady.value && class9Store.class9Items.length > 0)

type JournalFilter = 'all' | 'course-1' | 'course-2' | 'course-3' | 'course-4' | 'mixed' | 'individual'
const activeFilter = ref<JournalFilter>('all')

const isYearPillOpen = ref(false)
const isSemesterPillOpen = ref(false)
const isTeacherPillOpen = ref(false)
const isActionMenuOpen = ref(false)

const JOURNAL_FILTERS: ReadonlyArray<{ id: JournalFilter; label: string }> = [
  { id: 'all',        label: journal_filter_all() },
  { id: 'course-1',   label: journal_filter_course_1() },
  { id: 'course-2',   label: journal_filter_course_2() },
  { id: 'course-3',   label: journal_filter_course_3() },
  { id: 'course-4',   label: journal_filter_course_4() },
  { id: 'mixed',      label: journal_filter_mixed() },
  { id: 'individual', label: journal_filter_individual() },
]

const filteredByTab = computed(() => {
  if (activeFilter.value === 'all') {
    const flat: Journal[] = []
    Object.values(filteredJournalsByCourse.value).forEach((list) => flat.push(...list))
    flat.push(...filteredMixedGroupJournals.value)
    flat.push(...filteredIndividualJournals.value)
    return flat
  }
  if (activeFilter.value === 'mixed')      return filteredMixedGroupJournals.value
  if (activeFilter.value === 'individual') return filteredIndividualJournals.value
  const num = parseInt(activeFilter.value.split('-')[1])
  return filteredJournalsByCourse.value[num] ?? []
})

// ─────────────────────────────────────────────────────────────────────────────

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

type SelectionAction = "download" | "close" | "open" | "replace" | "delete" | "merge" | "split";

const isSelectionMode = ref(false);
const selectionAction = ref<SelectionAction>("download");
const selectedJournalIds = ref(new Set<string>());

const substitutionStore = useSubstitutionStore();
const { activeSubstitutions } = storeToRefs(substitutionStore);

const selectedJournalTeacherIds = computed(() => {
  const ids: string[] = [];
  for (const id of selectedJournalIds.value) {
    const event = calendarStore.getEventById(id);
    if (event?.teacherId) ids.push(event.teacherId);
  }
  return [...new Set(ids)];
});

const selectionDoneText = computed(() => {
  if (selectionAction.value === "close") return journal_action_close();
  if (selectionAction.value === "open") return journal_action_open();
  if (selectionAction.value === "replace") return journal_action_replace();
  if (selectionAction.value === "delete") return journal_action_delete();
  if (selectionAction.value === "merge") return journal_action_merge();
  if (selectionAction.value === "split") return "Разъединить";
  return journal_action_download();
});

const selectionDoneButtonClass = computed(() => {
  const base = "text-white transition-colors flex-1 sm:flex-none";
  if (selectionAction.value === "close") return `bg-red-500 hover:bg-red-600 ${base}`;
  if (selectionAction.value === "open") return `bg-green-500 hover:bg-green-600 ${base}`;
  if (selectionAction.value === "replace") return `bg-orange-500 hover:bg-orange-600 ${base}`;
  if (selectionAction.value === "delete") return `bg-red-500 hover:bg-red-600 ${base}`;
  if (selectionAction.value === "merge") return `bg-primary hover:bg-primary-dark ${base}`;
  if (selectionAction.value === "split") return `bg-yellow-500 hover:bg-yellow-600 ${base}`;
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
  if (selectionAction.value === "split") {
    const journal = journalStore.getJournalById(id);
    if (!journal?.mergedJournalIds?.length) {
      f7.toast.create({ text: "Можно выбрать только объединенные журналы", position: "center", closeTimeout: 1000 }).open();
      return;
    }
  }

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
    f7.dialog.alert(journal_export_error());
  }
}

function onSettingsClick() {
  f7.dialog.alert(journal_settings_dialog());
}

function onOpenJournalClick() {
  startSelectionMode("open");
}

function onCloseJournalClick() {
  startSelectionMode("close");
}

function onDeleteClick() {
  startSelectionMode("delete");
}

function onDownloadClick() {
  startSelectionMode("download");
}

function onMergeClick() {
  startSelectionMode("merge");
}

function onSplitClick() {
  startSelectionMode("split");
}

function onReplaceClick() {
  startSelectionMode("replace");
}

function handleCardDownload(journalId: string) {
  selectedJournalIds.value = new Set([journalId])
  selectionAction.value = 'download'
  onSelectionDone()
}

function handleCardDelete(journalId: string) {
  selectedJournalIds.value = new Set([journalId])
  selectionAction.value = 'delete'
  onSelectionDone()
}

function handleCardSubstitute(journalId: string) {
  selectedJournalIds.value = new Set([journalId])
  selectionAction.value = 'replace'
  f7.popover.open("#replace-journal-popover")
}

function onSelectionDone() {
  if (selectedJournalIds.value.size === 0) {
    f7.dialog.alert(journal_select_one());
    return;
  }

  const ids = Array.from(selectedJournalIds.value);

  if (selectionAction.value === "download") {
    void downloadSelectedJournals();
    return;
  }

  if (selectionAction.value === "merge") {
    f7.dialog.confirm(
      `${journal_merge_confirm_message({ count: ids.length })}`,
      journal_merge_confirm_title(),
      async () => {
        try {
          f7.preloader.show();
          await journalStore.mergeJournals(ids);
          f7.toast
            .create({
              text: `${journal_merge_confirm_title()}: ${ids.length}`,
              position: "center",
              closeTimeout: 2000,
            })
            .open();
        } catch (err) {
          f7.dialog.alert(
            err instanceof Error ? err.message : String(err),
            journal_merge_confirm_title()
          );
        } finally {
          f7.preloader.hide();
          exitSelectionMode();
        }
      }
    );
    return;
  }

  if (selectionAction.value === "split") {
    f7.dialog.confirm(
      journal_split_confirm_message(),
      journal_split_confirm_title(),
      async () => {
        try {
          f7.preloader.show();
          await Promise.all(ids.map((id) => journalStore.splitJournal(id)));
          f7.toast
            .create({
              text: `${journal_split_confirm_title()}: ${ids.length}`,
              position: "center",
              closeTimeout: 2000,
            })
            .open();
        } catch (err) {
          f7.dialog.alert(
            err instanceof Error ? err.message : String(err),
            journal_split_confirm_title()
          );
        } finally {
          f7.preloader.hide();
          exitSelectionMode();
        }
      }
    );
    return;
  }

  if (selectionAction.value === "replace") {
    f7.popover.open("#replace-journal-popover");
    return;
  }

  if (selectionAction.value === "delete") {
    f7.dialog.confirm(
      `${journal_delete_confirm_message()} (${ids.length})`,
      journal_delete_confirm_title(),
      async () => {
        try {
          await Promise.all(ids.map((id) => journalStore.deleteJournal(id)));
          f7.toast
            .create({
              text: `${journal_delete_confirm_title()}: ${ids.length}`,
              position: "center",
              closeTimeout: 2000,
            })
            .open();
        } catch (err) {
          f7.dialog.alert(
            err instanceof Error ? err.message : String(err),
            journal_delete_confirm_title()
          );
        } finally {
          exitSelectionMode();
        }
      }
    );
    return;
  }

  if (selectionAction.value === "close") {
    confirmCloseJournals(ids, {
      context: "Journals",
      onSuccess: exitSelectionMode,
      onNoop: () => {
        f7.toast
          .create({
            text: journal_already_closed(),
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
          text: journal_already_open(),
          position: "center",
          closeTimeout: 2000,
        })
        .open();
      exitSelectionMode();
    },
  });
}

function onEditJournal(journalId: string) {
  const journal = journalStore.getJournalById(journalId);
  if (!journal) return;

  if (journal.isIndividualJournal) {
    onEditIndividualJournal(journalId);
  } else {
    f7.dialog.alert("Редактирование обычных журналов будет доступно в следующем обновлении. Используйте РУП/КТП для изменения программы.");
  }
}

function onSplitJournal(journalId: string) {
  f7.dialog.confirm(
    journal_split_confirm_message(),
    journal_split_confirm_title(),
    async () => {
      try {
        f7.preloader.show();
        await journalStore.splitJournal(journalId);
        f7.toast
          .create({
            text: journal_split_confirm_title(),
            position: "center",
            closeTimeout: 2000,
          })
          .open();
      } catch (err) {
        f7.dialog.alert(
          err instanceof Error ? err.message : String(err),
          journal_split_confirm_title()
        );
      } finally {
        f7.preloader.hide();
      }
    }
  );
}

const isReplacingJournals = ref(false);

async function handleReplaceJournals(data: ReplaceJournalData) {
  try {
    isReplacingJournals.value = true;

    const ids = Array.from(selectedJournalIds.value);
    const currentUserId = userStore.currentUser?.id;
    if (!currentUserId) throw new Error("Пользователь не авторизован");

    const toTeacher = teacherStore.getTeacherById(data.teacherId);
    if (!toTeacher?.userId) throw new Error("Преподаватель на замену не найден");

    await convex.mutation(api.substitutions.mutations.createBulkSubstitutions, {
      calendarEventIds: ids as Id<"calendarEvents">[],
      toTeacherId: data.teacherId,
      toUserId: toTeacher.userId as Id<"users">,
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime,
      endTime: data.endTime,
      isPrimary: data.isPrimary,
      reason: data.reason || undefined,
      createdBy: currentUserId as Id<"users">,
    });

    isReplacingJournals.value = false;
    f7.popover.close("#replace-journal-popover");

    f7.toast.create({
      text: journal_replaced_success({ count: ids.length }),
      position: 'center',
      closeTimeout: 2000,
    }).open();

    exitSelectionMode();
  } catch (error) {
    isReplacingJournals.value = false;
    console.error('Failed to replace journals', error);
    f7.dialog.alert(journal_replace_error());
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
