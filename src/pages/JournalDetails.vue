<template>
  <f7-page
    name="journal-details"
    class="flex flex-col h-screen bg-background text-foreground"
    @page:afterin="onPageAfterIn"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div class="flex flex-1 overflow-hidden">
      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 transition-all duration-200"
        :class="contentMargin"
      >
        <div class="flex flex-col gap-4">
          <!-- Page Header -->
          <JournalHeader
            :discipline-text="currentRupEntryText"
            :group="currentJournal?.group"
            :group-language="currentJournalGroupLanguage"
            :course="currentJournal?.courseNumber"
            :teacher-name="currentJournalTeacherName"
            :academic-year="currentAcademicYearText"
            :semester="currentSemesterText"
            @back="handleBackClick"
          />

          <!-- Sub-journal card grid (merged/joined journal) -->
          <div
            v-if="isMergedJournal"
            class="p-4 bg-muted/50 rounded-2xl border border-border/50"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              <button
                v-for="child in mergedChildJournals"
                :key="child.id"
                @click="selectedChildJournalId = child.id"
                class="p-4 rounded-2xl border-2 flex flex-col gap-3 transition-all duration-300 text-left group relative overflow-hidden"
                :class="selectedChildJournalId === child.id
                  ? 'border-primary bg-primary/5 shadow-[0_8px_20px_-6px] shadow-primary/20 text-foreground'
                  : 'bg-card border-border hover:border-primary/50 hover:shadow-md text-foreground'"
              >
                <div
                  v-if="selectedChildJournalId === child.id"
                  class="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary shadow-[0_0_10px] shadow-primary/80 animate-pulse"
                />
                <div class="flex items-center gap-3 w-full">
                  <div
                    class="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-500"
                    :class="selectedChildJournalId === child.id
                      ? 'bg-primary scale-110 shadow-[0_0_12px] shadow-primary/60'
                      : 'bg-muted-foreground/40'"
                  />
                  <div
                    class="text-base font-bold truncate tracking-tight leading-tight"
                    :class="selectedChildJournalId === child.id ? 'text-foreground' : 'text-foreground/80'"
                  >
                    {{ child.journal ? journalStore.getDisciplineTitle(child.journal) : child.id }}
                  </div>
                </div>
                <div class="flex flex-col gap-2">
                  <div
                    class="text-[11px] font-bold"
                    :class="selectedChildJournalId === child.id ? 'text-primary' : 'text-muted-foreground'"
                  >
                    {{ child.journal ? journalStore.getJournalSubtitle(child.journal) : '' }}
                  </div>
                  <div class="flex items-center justify-between mt-1">
                    <div
                      class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300"
                      :class="selectedChildJournalId === child.id
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted text-muted-foreground'"
                    >
                      <IconUsers class="w-3.5 h-3.5" />
                      <span>{{ child.journal?.students.length ?? 0 }}</span>
                    </div>
                    <span
                      v-if="child.journal"
                      class="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border"
                      :class="selectedChildJournalId === child.id
                        ? 'bg-card border-primary/20 text-primary'
                        : 'bg-card border-border text-muted-foreground'"
                    >
                      {{ journalStore.getJournalGroupLanguage(child.journal) }}
                    </span>
                  </div>
                </div>
              </button>
            </div>
          </div>


          <!-- Debug Information Panel (dev mode only) -->
          <JournalDebugPanel
            v-if="false && isDev"
            :journal-id="journalId"
            :discipline-id="currentJournal?.disciplineId"
            :group="currentJournal?.group"
            :academic-year="currentAcademicYearText"
            :semester="currentSemesterText"
            :discipline-text="currentRupEntryText"
            :debug-info="debugInfo"
            :table-headers="tableHeaders"
          />

          <!-- Main Content Area with Tabs -->
          <div
            class="bg-card text-card-foreground rounded-xl p-3 md:p-4 shadow-sm"
          >
            <div class="flex overflow-x-auto no-scrollbar border-b border-border mb-3 md:mb-4 -mx-3 md:-mx-4 px-3 md:px-4">
              <div class="flex w-full justify-between gap-2 sm:gap-4 min-w-max">
                <button
                  v-for="tab in tabDefs"
                  :key="tab.id"
                  type="button"
                  @click="activeTab = tab.id"
                  :class="[
                    'pb-3 pt-1 text-[13px] sm:text-[14px] font-bold transition-all relative flex-1 text-center whitespace-nowrap tracking-tight',
                    activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                  ]"
                >
                  <span class="relative z-10">{{ tab.label }}</span>
                  <div
                    v-if="activeTab === tab.id"
                    class="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 sm:w-12 h-[3px] bg-yellow-400 rounded-t-full shadow-[0_-2px_10px_rgba(250,204,21,0.5)]"
                  />
                </button>
              </div>
            </div>

            <f7-tabs v-if="isPageReady">
              <f7-tab
                id="tab-journal"
                class="page-content"
                :tab-active="activeTab === 'journal'"
              >
                <JournalTab
                  ref="journalTabRef"
                  :journal-id="effectiveJournalId"
                  :ktp-id="ktpIdForJournal"
                  :journal-settings="journalSettings"
                  :resolved-participants="resolvedParticipants"
                  :show-individual-journals="isPlainGroupJournal"
                  :has-individual-journals="individualChildJournals.length > 0"
                  @close-journal="handleCloseJournal"
                  @open-journal="handleOpenJournal"
                  @download="onDownloadClick"

                  @show-floating-row="showFloatingRow"
                  @open-date-focus="openDateFocus"
                  @update-students="updateStudents"
                  @open-ktp-details="onOpenKtpDetails"
                  @open-settings="openJournalSettings"
                  @save-journal-settings="saveJournalSettings"
                  @open-rup="openRupDialog"
                  @open-individual-journals="openIndividualConfig"
                />
              </f7-tab>

              <f7-tab
                id="tab-participants"
                class="page-content"
                :tab-active="activeTab === 'participants'"
              >
                <div class="flex flex-col gap-4 p-4">
                  <div
                    class="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-lg shadow-sm p-4"
                  >
                    <div class="flex items-baseline gap-3">
                      <h2 class="text-base font-bold text-foreground">
                        {{ journal_participants_title() }}
                      </h2>
                      <span class="text-sm text-muted-foreground font-medium">
                        {{ journal_participants_count({ filtered: participantsFiltered.length, total: participantsAll.length }) }}
                      </span>
                    </div>
                    <SearchInput
                      v-model="participantsSearch"
                      :placeholder="journal_participants_search()"
                      wrapper-class="w-full sm:w-72"
                    />
                  </div>
                  <StudentTable
                    :students="participantsFiltered"
                    :show-row-number="true"
                    :show-specialty="true"
                    :show-status="true"
                    :show-language="true"
                    :show-course="true"
                    :clickable="true"
                    @row-click="handleStudentClick"
                  />
                </div>
              </f7-tab>

              <f7-tab
                id="tab-planning"
                class="page-content"
                :tab-active="activeTab === 'planning'"
              >
                <div class="p-4 md:p-6 flex flex-col gap-4">
                  <div
                    v-if="currentEvent?.isClosed"
                    class="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex items-center gap-3 text-yellow-800"
                  >
                    <IconCircleAlert class="w-5 h-5 flex-shrink-0" />
                    <span class="text-sm font-medium">
                      {{ journal_planning_view_only() }}
                    </span>
                  </div>
                  <div
                    class="bg-card text-card-foreground rounded-2xl shadow-sm border border-border p-4 md:p-8"
                    :class="currentEvent?.isClosed ? 'pointer-events-none opacity-80' : ''"
                  >
                    <KtpDetailView
                      v-if="ktpIdForJournal"
                      :ktp-id="ktpIdForJournal"
                      embedded
                      show-date
                    />
                    <div
                      v-else
                      class="text-center py-12 text-muted-foreground"
                    >
                      <IconBookOpen class="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p class="text-sm">{{ journal_no_discipline() }}</p>
                    </div>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-assignments"
                class="page-content"
                :tab-active="activeTab === 'assignments'"
              >
                <AssignmentsView :is-view-only="!!currentEvent?.isClosed" />
              </f7-tab>

              <f7-tab
                id="tab-chat"
                class="page-content"
                :tab-active="activeTab === 'chat'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      {{ journal_tab_chat() }}
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      {{ journal_chat_placeholder() }}
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-files"
                class="page-content"
                :tab-active="activeTab === 'files'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      {{ journal_tab_files() }}
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      {{ journal_files_placeholder() }}
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-testing"
                class="page-content"
                :tab-active="activeTab === 'testing'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      {{ journal_tab_testing() }}
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      {{ journal_testing_placeholder() }}
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-services"
                class="page-content"
                :tab-active="activeTab === 'services'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      {{ journal_tab_services() }}
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      {{ journal_services_placeholder() }}
                    </p>
                  </div>
                </div>
              </f7-tab>
            </f7-tabs>

            <div v-else class="flex flex-col items-center justify-center py-32 space-y-4">
              <f7-preloader size="48" color="blue" />
              <div class="text-sm text-muted-foreground font-medium animate-pulse">
                Загрузка журнала...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <FloatingJournalRow
      :journal-id="journalId"
      :student="selectedStudent"
      :student-index="selectedStudentIndex"
      :table-headers="tableHeaders"
      :get-ktp-for-header="journalTabRef?.getKtpForHeader"
      :is-view-only="journalTabRef?.isViewOnly"
      :notify-view-only="journalTabRef?.notifyViewOnly"
      @close="hideFloatingRow"
      @update-student="updateStudent"
      @paperclip-click="(h, i) => journalTabRef?.onPaperclipClick(h, i)"
    />
    <DateColumnFocus
      :visible="isDateFocusVisible"
      :students="students"
      :column-header="focusedColumnHeader"
      :selected-date-index="focusedDateIndex"
      :journal-id="journalId"
      :is-view-only="journalTabRef?.isViewOnly"
      :notify-view-only="journalTabRef?.notifyViewOnly"
      @close="isDateFocusVisible = false"
    />
    <KtpDetailPopup
      v-model:opened="isKtpPopupOpened"
      :ktp-id="ktpParentId"
    />
    
    <!-- RupEntry (RUP) Popup -->
    <RupEntryPopup
      v-if="isRupPopupOpened"
      :specialty-ids="rupSpecialtyIds"
      :academic-year-id="rupAcademicYearId"
      :initial-data="rupInitialData"
      :edit-mode="true"
      @close="closeRupPopup"
      @submit="handleRupSubmit"
    />



    <!-- Student Edit Popover -->
    <div id="student-edit-trigger" style="display: none;"></div>
    <EditStudentButton
      v-if="selectedStudentForEditId"
      :student-id="selectedStudentForEditId"
    />

    <!-- Individual Journals Config Popup -->
    <IndividualJournalsConfigPopup ref="individualConfigRef" />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from "vue";
import {
  f7Page,
  f7,
  f7Navbar,
  f7NavRight,
  f7Toolbar,
  f7Link,
  f7Tabs,
  f7Tab,
  f7Block,
  f7Icon,
  f7Preloader,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useJournalStore } from "@/stores/journalStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useKtpStore } from "@/stores/ktpStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import JournalTab from "@/components/JournalTab.vue";
import JournalHeader from "@/components/JournalHeader.vue";
import JournalDebugPanel from "@/components/JournalDebugPanel.vue";
import FloatingJournalRow from "@/components/FloatingJournalRow.vue";
import DateColumnFocus from "@/components/DateColumnFocus.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
import KtpDetailView from "@/components/KtpDetailView.vue";
import RupEntryPopup from "@/components/RupEntryPopup.vue";
import StudentListTable from "@/components/StudentListTable.vue";
import StudentTable from "@/components/StudentTable.vue";
import AssignmentsView from "@/components/AssignmentsView.vue";
import IconCircleAlert from "~icons/lucide/circle-alert";
import IconBookOpen from "~icons/lucide/book-open";
import IconSearch from "~icons/lucide/search";
import SearchInput from "@/components/ui/SearchInput.vue";
import IconUsers from "~icons/lucide/users";
import { useConvexQuery } from "convex-vue";
import { api } from "@convex/_generated/api";
import EditStudentButton from "@/components/EditStudentButton.vue";
import IndividualJournalsConfigPopup from "@/components/IndividualJournalsConfigPopup.vue";
import { storeToRefs } from "pinia";

import { useJournalOpenClose } from "@/composables/useJournalOpenClose";
import { useJournalExportImport } from "@/composables/useJournalExportImport";
import { useStudentStore } from "@/stores/studentStore";
import { useTeacherStore } from "@/stores/teacherStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useMarksStore } from "@/stores/marksStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { useSidebar } from "@/composables/useSidebar";
import {
  journal_tab_journal,
  journal_tab_participants,
  journal_tab_planning,
  journal_tab_assignments,
  journal_tab_chat,
  journal_tab_files,
  journal_tab_testing,
  journal_participants_title,
  journal_participants_search,
  journal_participants_count,
  journal_planning_view_only,
  journal_tab_services,
  journal_no_discipline,
  journal_assignments_placeholder,
  journal_chat_placeholder,
  journal_files_placeholder,
  journal_testing_placeholder,
  journal_services_placeholder,
  journal_rup_saved,
  journal_settings_saved,
  journal_settings_save_error,
  journal_not_found,
  journal_clipboard_error,
  journal_semester,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();
const { contentMargin } = useSidebar();
const isDev = import.meta.env.DEV;

const journalId = computed(() => {
  return f7.views.main.router.currentRoute.params.id as string;
});

const activeNavItem = ref("journal-details");
const activeTab = ref("journal");

const tabDefs = computed(() => [
  { id: "journal", label: journal_tab_journal() },
  { id: "participants", label: journal_tab_participants() },
  { id: "planning", label: journal_tab_planning() },
  { id: "assignments", label: journal_tab_assignments() },
  { id: "chat", label: journal_tab_chat() },
  { id: "files", label: journal_tab_files() },
  { id: "testing", label: journal_tab_testing() },
  { id: "services", label: journal_tab_services() },
]);

const isPageReady = ref(false);

const onPageAfterIn = () => {
  isPageReady.value = true;
};

onMounted(() => {
  // Fallback in case page:afterin doesn't fire (e.g. direct page reload without transition)
  setTimeout(() => {
    if (!isPageReady.value) {
      isPageReady.value = true;
    }
  }, 350); // Typical F7 transition duration
});

const { confirmCloseJournal, confirmOpenJournal } = useJournalOpenClose();

const handleBackClick = () => {
  const from = f7.views.main.router.currentRoute.query.from as string;
  if (from === "schedule") {
    f7.views.main.router.navigate("/planning");
  } else {
    f7.views.main.router.navigate("/journals/");
  }
};

const handleCloseJournal = () => {
  confirmCloseJournal(journalId.value, {
    context: "JournalDetails",
    onNoop: handleBackClick,
    onSuccess: handleBackClick,
  });
};

const handleOpenJournal = () => {
  confirmOpenJournal(journalId.value, { context: "JournalDetails" });
};

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);

const journalStore = useJournalStore();
const calendarStore = useCalendarStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const rupEntryStore = useRupEntryStore();
const { rupEntryOptions } = storeToRefs(rupEntryStore);
const ktpStore = useKtpStore();
const studentStore = useStudentStore();
const teacherStore = useTeacherStore();
const specialtyStore = useSpecialtyStore();
const selectedItemsStore = useSelectedItemsStore();
const marksStore = useMarksStore();
const { students: studentStoreStudents } = storeToRefs(studentStore);

const currentJournal = computed(() => {
  if (!journalId.value) return null;
  return journalStore.getJournalById(journalId.value);
});

const isMergedJournal = computed(() =>
  (currentJournal.value?.mergedJournalIds?.length ?? 0) > 0
);

const selectedChildJournalId = ref<string | null>(null);

watch(
  () => currentJournal.value?.mergedJournalIds,
  (ids) => {
    if (ids?.length && !selectedChildJournalId.value) {
      selectedChildJournalId.value = ids[0];
    }
    if (!ids?.length) {
      selectedChildJournalId.value = null;
    }
  },
  { immediate: true }
);

const mergedChildJournals = computed(() => {
  if (!isMergedJournal.value) return [];
  return (currentJournal.value!.mergedJournalIds!).map((id) => ({
    id,
    journal: journalStore.getJournalById(id),
  }));
});

const effectiveJournalId = computed(() =>
  selectedChildJournalId.value || journalId.value
);

const participantsSearch = ref("");

const participantsAll = computed(() => {
  const ids = currentJournal.value?.students || [];
  const byId = new Map(studentStoreStudents.value.map((s: any) => [s.id, s]));
  return ids
    .map((id: string) => byId.get(id))
    .filter((s): s is any => Boolean(s));
});

const participantsFiltered = computed(() => {
  const q = participantsSearch.value.trim().toLowerCase();
  if (!q) return participantsAll.value;
  return participantsAll.value.filter((s: any) => {
    const hay = [s.surname, s.firstName, s.patronymic, s.specialty, s.language]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
});

const currentJournalTeacherName = computed(() => {
  const teacherId = currentEvent.value?.teacherId;
  if (!teacherId) return "";
  return teacherStore.getTeacherFullName(teacherId);
});

const currentJournalGroupLanguage = computed(() => {
  if (!currentJournal.value) return "";
  return journalStore.getJournalGroupLanguage(currentJournal.value);
});

const currentRupEntryText = computed(() => {
  const disciplineId = currentJournal.value?.disciplineId;
  if (!disciplineId) return "";
  const option = rupEntryOptions.value.find((o: any) => o.value === disciplineId);
  return option?.text || "";
});

const currentAcademicYearText = computed(() => {
  const activeYear = academicYearStore.getActiveAcademicYear;
  return activeYear?.name || "";
});

const currentSemesterText = computed(() => {
  if (!journalId.value) return "—";
  const event = calendarStore.getEventById(journalId.value);
  if (!event || !event.semester) return "—";
  const ays = (academicYearSemesterStore as any).getAcademicYearSemesterById
    ? (academicYearSemesterStore as any).getAcademicYearSemesterById(
        event.semester
      )
    : academicYearSemesterStore.academicYearSemesters.find(
        (s: any) => s.id === event.semester
      );
  return ays ? `${journal_semester()} ${ays.semesterNumber}` : "—";
});

const selectedStudent = ref<any>(null);
const selectedStudentIndex = ref(0);

const isDateFocusVisible = ref(false);
const focusedColumnHeader = ref<{ type: string; label: string } | null>(null);
const focusedDateIndex = ref(0);

const isKtpPopupOpened = ref(false);
const ktpParentId = ref<string | null>(null);

// Student edit state
const selectedStudentForEditId = ref<string | null>(null);

// RUP Popup state
const isRupPopupOpened = ref(false);
const rupInitialData = ref<any>(null);

const rupSpecialtyIds = computed(() => {
  const disciplineId = currentJournal.value?.disciplineId;
  if (!disciplineId) return [];
  const rupEntryItem = rupEntryStore.getRupEntryById(disciplineId);
  return rupEntryItem?.specialtyIds || [];
});

const rupAcademicYearId = computed(() => {
  return selectedItemsStore.selectedAcademicYearId ||
    academicYearStore.getActiveAcademicYear?.id || "";
});

const ensuredKtpId = ref<string | null>(null);
const isEnsuringKtp = ref(false);
const loadedForKtpId = ref<string | null>(null);

const ktpIdForJournal = computed(() => ensuredKtpId.value);

const getSemesterById = (id: string) => {
  const fn = (academicYearSemesterStore as any).getAcademicYearSemesterById;
  if (typeof fn === "function") return fn(id);
  return academicYearSemesterStore.academicYearSemesters.find(
    (s: any) => s.id === id
  );
};

async function ensureKtpDataLoaded(ktpId: string) {
  // KTP data arrives via the store's reactive Convex subscription;
  // nothing to load imperatively anymore.
  loadedForKtpId.value = ktpId;
}

const currentEvent = computed(() => {
  if (!journalId.value) return null;
  return calendarStore.getEventById(journalId.value) || null;
});

// Immediately initiate background fetching of grades before the grid even renders
watch(
  () => effectiveJournalId.value,
  (newId) => {
    if (newId) {
      marksStore.preloadJournalMarks(newId as string);
    }
  },
  { immediate: true }
);

const eventWithParticipantsResult = useConvexQuery(
  api.calendarEvents.queries.getByIdWithParticipants,
  computed(() =>
    effectiveJournalId.value ? { id: effectiveJournalId.value as any } : "skip",
  ),
) as any;

const resolvedParticipants = computed<
  Array<{
    id: string;
    surname: string;
    firstName: string;
    patronymic: string;
  }>
>(() => eventWithParticipantsResult?.data?.value?.participantsResolved ?? []);

watch(
  () => [
    journalId.value,
    currentEvent.value?.id,
    currentEvent.value?.ktpId,
    currentEvent.value?.rupEntryId,
    currentEvent.value?.semester,
    academicYearSemesterStore.academicYearSemesters.length,
    ktpStore.ktps.length,
  ] as const,
  async ([_jid, _eventId, eventKtpId, eventRupEntryId, eventSemesterId]) => {
    ensuredKtpId.value = eventKtpId || null;
    if (!journalId.value || !currentEvent.value) return;
    if (isEnsuringKtp.value) return;

    // If already linked AND the referenced KTP still exists, just load it.
    // A dangling ktpId (e.g. the KTP was deleted) falls through to re-create.
    if (eventKtpId) {
      if (ktpStore.findKtpById(eventKtpId)) {
        try {
          await ensureKtpDataLoaded(eventKtpId);
        } catch (e) {
          console.error("[JournalDetails] load KTP failed:", e);
        }
        return;
      }
      // Store not hydrated yet — wait; watcher re-runs on ktps.length change.
      if (ktpStore.loading) return;
      // Otherwise the reference is dangling — fall through to re-create/link.
    }

    // Otherwise, create/link an event-specific KTP.
    const semester = eventSemesterId ? getSemesterById(eventSemesterId) : null;
    const academicYearId = semester?.academicYearId;
    if (!academicYearId || !eventRupEntryId || !eventSemesterId) return;

    isEnsuringKtp.value = true;
    try {
      const event = currentEvent.value;
      if (!event) return;
      const ktp = await ktpStore.ensureKtpForRupEntry(
        event.rupEntryId,
        academicYearId,
        event.semester,
        event.id
      );
      ensuredKtpId.value = ktp.id;
      await calendarStore.updateEvent(event.id, { ktpId: ktp.id });
      await ensureKtpDataLoaded(ktp.id);
    } catch (e) {
      console.error("[JournalDetails] ensure KTP failed:", e);
    } finally {
      isEnsuringKtp.value = false;
    }
  },
  { immediate: true }
);

const journalTabRef = ref<InstanceType<typeof JournalTab> | null>(null);

// Journal settings state
const journalSettings = ref({
  calculationType: "calculated" as "calculated" | "manual",
  calculationMethod: "only-assigned" as "only-assigned" | "all-days",
  finalControlForm: "written" as "written" | "oral" | "mixed" | undefined,
  finalGradeFormula: { intermediateWeight: 0.6, finalWeight: 0.4 } as { intermediateWeight: number; finalWeight: number } | undefined,
});

// Load journal settings from the event
// Watch both the journal AND the events array to handle race conditions
watch(
  () => [currentJournal.value, calendarStore.events] as const,
  ([journal, events]) => {
    if (journal && events.length > 0) {
      const event = calendarStore.getEventById(journal.id);
      console.log("[JournalDetails] Loading journal settings:", {
        journalId: journal.id,
        eventsCount: events.length,
        event,
        hasSettings: !!event?.journalSettings,
        settings: event?.journalSettings,
      });
      if (event?.journalSettings) {
        journalSettings.value = { ...event.journalSettings };
      } else {
        // Default settings if not set
        journalSettings.value = {
          calculationType: "calculated",
          calculationMethod: "only-assigned",
          finalControlForm: "written",
          finalGradeFormula: { intermediateWeight: 0.6, finalWeight: 0.4 },
        };
      }
    }
  },
  { immediate: true }
);

// Debug copy state
const debugCopied = ref(false);

// Export/Import composable
const {
  onDownloadClick,
} = useJournalExportImport(journalId, currentJournal, journalTabRef);

const openDateFocus = (
  header: { type: string; label: string },
  index: number
) => {
  if (header.type !== "date") return;
  focusedColumnHeader.value = header;
  focusedDateIndex.value = index;
  isDateFocusVisible.value = true;
};

const showFloatingRow = (student: any, index: number) => {
  selectedStudent.value = student;
  selectedStudentIndex.value = index;
};

const hideFloatingRow = () => {
  selectedStudent.value = null;
};

const updateStudent = (updatedStudent: any) => {
  if (journalTabRef.value) {
    journalTabRef.value.updateStudent(updatedStudent);
  }
};

const updateStudents = (updatedStudents: any[]) => {
  if (!Array.isArray(updatedStudents) || updatedStudents.length === 0) return;

  if (selectedStudent.value) {
    const selectedId = String(
      selectedStudent.value.studentId ?? selectedStudent.value.id ?? ""
    );
    const nextIndex = updatedStudents.findIndex(
      (student) => String(student?.studentId ?? student?.id ?? "") === selectedId
    );
    if (nextIndex >= 0) {
      selectedStudent.value = updatedStudents[nextIndex];
      selectedStudentIndex.value = nextIndex;
    }
  }
};

const copyDebugInfo = async () => {
  try {
    const debugData = {
      timestamp: new Date().toISOString(),
      journal: {
        id: journalId.value,
        disciplineId: currentJournal.value?.disciplineId,
        group: currentJournal.value?.group,
        discipline: currentRupEntryText.value,
        academicYear: currentAcademicYearText.value,
        semester: currentSemesterText.value,
      },
      debugInfo: debugInfo.value,
    };
    
    const jsonString = JSON.stringify(debugData, null, 2);
    await navigator.clipboard.writeText(jsonString);
    
    debugCopied.value = true;
    setTimeout(() => {
      debugCopied.value = false;
    }, 2000);
  } catch (error) {
    console.error("Failed to copy debug info:", error);
    f7.dialog.alert(journal_clipboard_error());
  }
};

const onOpenKtpDetails = (
  header: { type: string; label: string },
  index: number
) => {
  if (!currentJournal.value) return;
  // Map to KTP parent id using disciplineId; keep mock mapping consistent with KtpPage
  if (
    currentJournal.value.disciplineId ===
    (journalStore.mixedGroupJournals[0]?.disciplineId || "")
  ) {
    ktpParentId.value = "mock-rupEntry-id-1";
  } else {
    ktpParentId.value = currentJournal.value.disciplineId;
  }
  isKtpPopupOpened.value = true;
};

// Open RUP dialog
const openRupDialog = () => {
  const disciplineId = currentJournal.value?.disciplineId;
  if (!disciplineId) {
    f7.dialog.alert(journal_no_discipline());
    return;
  }
  
  // Load the rupEntry data for editing
  const rupEntryItem = rupEntryStore.getRupEntryById(disciplineId);
  if (rupEntryItem) {
    rupInitialData.value = rupEntryItem;
  }
  
  isRupPopupOpened.value = true;
  nextTick(() => {
    f7.popover.open("#rup-entry-popover");
  });
};

const closeRupPopup = () => {
  isRupPopupOpened.value = false;
  rupInitialData.value = null;
  f7.popover.close("#rup-entry-popover");
};

const handleRupSubmit = () => {
  closeRupPopup();
  // Optionally refresh the debug info or journal data
  f7.toast.create({
    text: journal_rup_saved(),
    position: "center",
    closeTimeout: 2000,
  }).open();
};

// Journal settings functions
const openJournalSettings = () => {
  f7.popup.open("#journal-settings-popover");
};

const closeJournalSettings = () => {
  f7.popup.close("#journal-settings-popover");
};

const saveJournalSettings = async (
  nextSettings?: {
    calculationType: "calculated" | "manual";
    calculationMethod: "only-assigned" | "all-days";
    finalControlForm?: "written" | "oral" | "mixed";
    finalGradeFormula?: { intermediateWeight: number; finalWeight: number };
  }
) => {
  if (!currentJournal.value) {
    f7.dialog.alert(journal_not_found());
    return;
  }

  if (nextSettings) {
    journalSettings.value = { ...nextSettings };
  }

  console.log("[JournalDetails] Saving journal settings:", {
    journalId: currentJournal.value.id,
    settings: journalSettings.value,
  });

  try {
    f7.preloader.show();

    // Update the calendar event with new journal settings
    const result = await calendarStore.updateEvent(currentJournal.value.id, {
      journalSettings: journalSettings.value,
    });

    console.log("[JournalDetails] Journal settings saved successfully:", result);

    f7.preloader.hide();
    closeJournalSettings();

    f7.toast.create({
      text: journal_settings_saved(),
      position: "center",
      closeTimeout: 2000,
    }).open();
  } catch (error) {
    f7.preloader.hide();
    console.error("[JournalDetails] Failed to save journal settings:", error);
    f7.dialog.alert(journal_settings_save_error());
  }
};

// Handle student click from StudentListTable
const handleStudentClick = (student: any) => {
  selectedStudentForEditId.value = student.id;
  nextTick(() => {
    f7.popover.open(`#edit-student-popover-${student.id}`, `#student-edit-trigger`);
  });
};

// Get computed properties from JournalTab component
const tableHeaders = computed(() => {
  return journalTabRef.value?.tableHeaders || [];
});

const students = computed(() => {
  return journalTabRef.value?.students || [];
});

// Individual journals config popup
const individualConfigRef = ref<InstanceType<typeof IndividualJournalsConfigPopup> | null>(null);

const individualChildJournals = computed(() =>
  calendarStore.events.filter((e) => e.sourceGroupEventId === journalId.value)
);

const isPlainGroupJournal = computed(() => {
  const e = currentEvent.value;
  if (!e) return false;
  return !e.isIndividualJournal && !e.sourceGroupEventId && !(e.mergedJournalIds?.length);
});

function openIndividualConfig() {
  individualConfigRef.value?.open(journalId.value);
}

// Initialize control stores
const intermediateControlStore = useIntermediateControlStore();
const finalControlStore = useFinalControlStore();
const scheduledIntermediateControlStore = useScheduledIntermediateControlStore();
const scheduledFinalControlStore = useScheduledFinalControlStore();

const { 
  intermediateControls,
  getIntermediateControlById 
} = storeToRefs(intermediateControlStore);

const { 
  finalControls,
  getFinalControlById 
} = storeToRefs(finalControlStore);

const { 
  scheduledIntermediateControls,
  getScheduledIntermediateControlsByAcademicYear 
} = storeToRefs(scheduledIntermediateControlStore);

const { 
  scheduledFinalControls,
  getScheduledFinalControlsByAcademicYear 
} = storeToRefs(scheduledFinalControlStore);

// Debug information computed property
const debugInfo = computed(() => {
  const journal = currentJournal.value;
  const event = journal ? calendarStore.getEventById(journal.id) : null;
  const academicYearId = selectedItemsStore.selectedAcademicYearId || 
    academicYearStore.getActiveAcademicYear?.id;
  const semesterId = event?.semester;

  // Get distribution entries for this discipline from rupEntry
  const disciplineId = journal?.disciplineId;
  const rupEntryItem = disciplineId 
    ? rupEntryStore.getRupEntryById(disciplineId) 
    : null;
  
  const relevantDistributionEntries = (rupEntryItem?.distributionEntries || [])
    .filter((entry: any) => {
      if (!semesterId) return true;
      if (entry?.semesterId == null) return false;
      
      // Match by UUID only
      return String(entry.semesterId) === String(semesterId);
    })
    .filter((entry: any) => {
      if (!academicYearId) return true;
      return String(entry?.academicYearId ?? "") === String(academicYearId);
    });

  // Debug: Log distribution entries filtering
  console.log('[JournalDetails] Distribution Entries Filtering:', {
    totalDistributionEntries: rupEntryItem?.distributionEntries?.length || 0,
    allDistributionEntries: rupEntryItem?.distributionEntries,
    currentSemesterId: semesterId,
    currentAcademicYearId: academicYearId,
    matching: {
      info: 'Entries match only by UUID: entry.semesterId === semesterUUID',
      byUUID: 'entry.semesterId === ' + semesterId,
    },
    afterSemesterFilter: (rupEntryItem?.distributionEntries || []).filter((entry: any) => {
      if (!semesterId) return true;
      if (entry?.semesterId == null) return false;
      return String(entry.semesterId) === String(semesterId);
    }).length,
    afterBothFilters: relevantDistributionEntries.length,
    relevantDistributionEntries,
  });

  // Extract control IDs from distribution
  const distributionIntermediateControlIds = Array.from(
    new Set(
      relevantDistributionEntries
        .map((entry: any) => entry.intermediateControlId)
        .filter((id: any): id is string => typeof id === "string" && id.length > 0)
    )
  );

  const distributionFinalControlIds = Array.from(
    new Set(
      relevantDistributionEntries
        .map((entry: any) => entry.finalControlId)
        .filter((id: any): id is string => typeof id === "string" && id.length > 0)
    )
  );

  // Get scheduled controls for the academic year
  const scheduledIntermediateForYear = academicYearId && 
    typeof getScheduledIntermediateControlsByAcademicYear.value === "function"
      ? getScheduledIntermediateControlsByAcademicYear.value(academicYearId) || []
      : [];

  const scheduledFinalForYear = academicYearId && 
    typeof getScheduledFinalControlsByAcademicYear.value === "function"
      ? getScheduledFinalControlsByAcademicYear.value(academicYearId) || []
      : [];

  // ALWAYS show intermediate controls (РК1, РК2) regardless of distribution
  const filteredScheduledIntermediate = scheduledIntermediateForYear;

  // Only show final controls that are specified in distribution
  const finalControlFilteringLog: any[] = [];
  const filteredScheduledFinal = scheduledFinalForYear.filter(
    (control: any) => {
      const log = {
        controlId: control.finalControlId,
        controlName: finalControls.value?.find((fc: any) => fc.id === control.finalControlId)?.name || "Unknown",
        distributionIdsCount: distributionFinalControlIds.length,
        distributionIds: [...distributionFinalControlIds],
        isInDistribution: distributionFinalControlIds.includes(control.finalControlId),
        decision: "",
      };

      if (distributionFinalControlIds.length === 0) {
        log.decision = "HIDDEN: No final controls in distribution (empty РУП)";
        finalControlFilteringLog.push(log);
        return false;
      }

      const isIncluded = distributionFinalControlIds.includes(control.finalControlId);
      log.decision = isIncluded 
        ? "SHOWN: Control ID matches distribution" 
        : "HIDDEN: Control ID not found in distribution";
      finalControlFilteringLog.push(log);
      
      return isIncluded;
    }
  );

  // Build intermediate controls details
  const intermediateControlsDetails = (intermediateControls.value || []).map((control: any) => {
    const inDistribution = distributionIntermediateControlIds.includes(control.id);
    const scheduledControl = scheduledIntermediateForYear.find(
      (sc: any) => sc.intermediateControlId === control.id
    );
    return {
      id: control.id,
      name: control.name || "—",
      shortName: control.shortName || "—",
      inDistribution,
      scheduledForYear: !!scheduledControl,
      startDate: scheduledControl?.startDate || "—",
      endDate: scheduledControl?.endDate || "—",
    };
  });

  // Build final controls details
  const finalControlsDetails = (finalControls.value || []).map((control: any) => {
    const inDistribution = distributionFinalControlIds.includes(control.id);
    const scheduledControl = scheduledFinalForYear.find(
      (sc: any) => sc.finalControlId === control.id
    );
    const filterLog = finalControlFilteringLog.find((log: any) => log.controlId === control.id);
    
    return {
      id: control.id,
      name: control.name || "—",
      shortName: control.shortName || "—",
      inDistribution,
      scheduledForYear: !!scheduledControl,
      startDate: scheduledControl?.startDate || "—",
      endDate: scheduledControl?.endDate || "—",
      filterDecision: filterLog?.decision || "Not scheduled for this year",
      willBeShown: !!scheduledControl && (distributionFinalControlIds.length === 0 ? false : inDistribution),
    };
  });

  // Build headers summary
  const headers = tableHeaders.value || [];
  const sessionHeaders = headers.filter((h: any) => h.type === "session");
  const headersSummary = headers.map((h: any, idx: number) => ({
    index: idx,
    type: h.type,
    label: h.label,
  }));

  return {
    academicYearId: academicYearId || "—",
    semesterId: semesterId || "—",
    distributionEntriesCount: relevantDistributionEntries.length,
    totalDistributionEntries: rupEntryItem?.distributionEntries?.length || 0,
    allDistributionEntries: (rupEntryItem?.distributionEntries || []).map((e: any) => ({
      id: e.id,
      academicYearId: e.academicYearId,
      semesterId: e.semesterId,
      intermediateControlId: e.intermediateControlId,
      finalControlId: e.finalControlId,
    })),
    distributionIntermediateControlIds,
    distributionFinalControlIds,
    scheduledIntermediateCount: scheduledIntermediateForYear.length,
    scheduledFinalCount: scheduledFinalForYear.length,
    filteredIntermediateCount: filteredScheduledIntermediate.length,
    filteredFinalCount: filteredScheduledFinal.length,
    intermediateControlsDetails,
    finalControlsDetails,
    finalControlFilteringLog,
    sessionHeadersCount: sessionHeaders.length,
    headersSummary,
  };
});
</script>

<style lang="postcss">
.tab-link {
  @apply px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200;
  @apply text-muted-foreground hover:text-foreground hover:bg-muted;
}

.tab-link.tab-link-active {
  @apply bg-primary text-primary-foreground;
}

.toolbar.tabbar {
  @apply bg-transparent border-b border-border mb-4;
  --f7-toolbar-inner-padding-left: 0;
  --f7-toolbar-inner-padding-right: 0;
}

.toolbar.tabbar .toolbar-inner {
  @apply gap-2 p-1 bg-muted rounded-lg;
}

.page-content {
  padding: 0;
}

</style>

