<template>
  <f7-page
    name="journal-details"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-32"
      >
        <div class="flex flex-col gap-4">
          <!-- Page Header -->
          <JournalHeader
            :discipline-text="currentClass9Text"
            :group="currentJournal?.group"
            :group-language="currentJournalGroupLanguage"
            :academic-year="currentAcademicYearText"
            :semester="currentSemesterText"
            @back="handleBackClick"
          />

          <!-- Debug Information Panel (dev mode only) -->
          <JournalDebugPanel
            v-if="isDev"
            :journal-id="journalId"
            :discipline-id="currentJournal?.disciplineId"
            :group="currentJournal?.group"
            :academic-year="currentAcademicYearText"
            :semester="currentSemesterText"
            :discipline-text="currentClass9Text"
            :debug-info="debugInfo"
            :table-headers="tableHeaders"
          />

          <!-- Main Content Area with Tabs -->
          <div
            class="bg-card text-card-foreground rounded-xl p-3 md:p-4 shadow-sm"
          >
            <f7-toolbar tabbar>
              <f7-link
                tab-link="#tab-journal"
                :tab-link-active="activeTab === 'journal'"
                @click="activeTab = 'journal'"
                class="tab-link"
              >
                Журнал
              </f7-link>
              <f7-link
                tab-link="#tab-participants"
                :tab-link-active="activeTab === 'participants'"
                @click="activeTab = 'participants'"
                class="tab-link"
              >
                Участники
              </f7-link>
              <f7-link
                tab-link="#tab-planning"
                :tab-link-active="activeTab === 'planning'"
                @click="activeTab = 'planning'"
                class="tab-link"
              >
                Тематическое<br />планирование
              </f7-link>
              <f7-link
                tab-link="#tab-assignments"
                :tab-link-active="activeTab === 'assignments'"
                @click="activeTab = 'assignments'"
                class="tab-link"
              >
                Задания
              </f7-link>
              <f7-link
                tab-link="#tab-chat"
                :tab-link-active="activeTab === 'chat'"
                @click="activeTab = 'chat'"
                class="tab-link"
              >
                Чат
              </f7-link>
              <f7-link
                tab-link="#tab-files"
                :tab-link-active="activeTab === 'files'"
                @click="activeTab = 'files'"
                class="tab-link"
              >
                Файлы
              </f7-link>
              <f7-link
                tab-link="#tab-testing"
                :tab-link-active="activeTab === 'testing'"
                @click="activeTab = 'testing'"
                class="tab-link"
              >
                Тестирование
              </f7-link>
              <f7-link
                tab-link="#tab-services"
                :tab-link-active="activeTab === 'services'"
                @click="activeTab = 'services'"
                class="tab-link"
              >
                Сервисы
              </f7-link>
            </f7-toolbar>

            <f7-tabs>
              <f7-tab
                id="tab-journal"
                class="page-content"
                :tab-active="activeTab === 'journal'"
              >
                <JournalTab
                  ref="journalTabRef"
                  :journal-id="journalId"
                  :ktp-id="ktpIdForJournal"
                  :journal-settings="journalSettings"
                  @close-journal="handleCloseJournal"
                  @open-journal="handleOpenJournal"
                  @download="onDownloadClick"
                  @upload="onUploadClick"
                  @show-floating-row="showFloatingRow"
                  @open-date-focus="openDateFocus"
                  @update-students="updateStudents"
                  @open-ktp-details="onOpenKtpDetails"
                  @open-settings="openJournalSettings"
                  @save-journal-settings="saveJournalSettings"
                  @open-rup="openRupDialog"
                />
              </f7-tab>

              <f7-tab
                id="tab-participants"
                class="page-content"
                :tab-active="activeTab === 'participants'"
              >
                <div class="flex flex-col gap-4 p-4">
                  <StudentListTable
                    :student-ids="currentJournal?.students || []"
                    :show-filters="true"
                    :show-row-number="true"
                    :show-course="true"
                    :show-specialty="true"
                    :show-language="true"
                    :clickable="true"
                    @student-click="handleStudentClick"
                  />
                </div>
              </f7-tab>

              <f7-tab
                id="tab-planning"
                class="page-content"
                :tab-active="activeTab === 'planning'"
              >
                <div class="h-full">
                  <KtpDetailPopupBody
                    v-if="ktpIdForJournal"
                    :ktp-id="ktpIdForJournal"
                  />
                  <div v-else class="text-center py-8">
                    <p class="text-sm text-muted-foreground">
                      Дисциплина не найдена
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-assignments"
                class="page-content"
                :tab-active="activeTab === 'assignments'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Задания
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будут отображаться задания
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-chat"
                class="page-content"
                :tab-active="activeTab === 'chat'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Чат
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будет чат
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
                      Файлы
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будут отображаться файлы
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
                      Тестирование
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будет тестирование
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
                      Сервисы
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будут отображаться сервисы
                    </p>
                  </div>
                </div>
              </f7-tab>
            </f7-tabs>
          </div>
        </div>
      </div>
    </div>
    <FloatingJournalRow
      :journal-id="journalId"
      :student="selectedStudent"
      :student-index="selectedStudentIndex"
      :table-headers="tableHeaders"
      @close="hideFloatingRow"
      @update-student="updateStudent"
    />
    <DateColumnFocus
      :visible="isDateFocusVisible"
      :students="students"
      :column-header="focusedColumnHeader"
      :selected-date-index="focusedDateIndex"
      :journal-id="journalId"
      @close="isDateFocusVisible = false"
    />
    <KtpDetailPopup
      v-model:opened="isKtpPopupOpened"
      :ktp-id="ktpParentId"
    />
    
    <!-- Class9 (RUP) Popup -->
    <Class9Popup
      v-if="isRupPopupOpened"
      :specialty-ids="rupSpecialtyIds"
      :academic-year-id="rupAcademicYearId"
      :initial-data="rupInitialData"
      :edit-mode="true"
      @close="closeRupPopup"
      @submit="handleRupSubmit"
    />

    <!-- Journal Import Confirmation Dialog -->
    <JournalImportConfirmDialog
      v-if="isImportDialogOpened && importPreparedData && importMapping"
      v-model:opened="isImportDialogOpened"
      v-model:overwrite-mode="importOverwriteMode"
      :stats="importPreparedData.stats"
      :warnings="importPreparedData.warnings"
      :unmatched-students="importMapping.unmatchedStudents"
      :unmatched-dates="importMapping.unmatchedDates"
      @confirm="onImportConfirm"
      @cancel="onImportCancel"
    />


    <!-- Student Edit Popover -->
    <div id="student-edit-trigger" style="display: none;"></div>
    <EditStudentButton
      v-if="selectedStudentForEditId"
      :student-id="selectedStudentForEditId"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from "vue";
import {
  f7Page,
  f7,
  f7Toolbar,
  f7Link,
  f7Tabs,
  f7Tab,
  f7Icon,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useJournalStore } from "@/stores/journalStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useClass9Store } from "@/stores/class9Store";
import { useKtpStore } from "@/stores/ktpStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import JournalTab from "@/components/JournalTab.vue";
import JournalHeader from "@/components/JournalHeader.vue";
import JournalDebugPanel from "@/components/JournalDebugPanel.vue";
import FloatingJournalRow from "@/components/FloatingJournalRow.vue";
import DateColumnFocus from "@/components/DateColumnFocus.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
import KtpDetailPopupBody from "@/components/KtpDetailPopupBody.vue";
import Class9Popup from "@/components/Class9Popup.vue";
import StudentListTable from "@/components/StudentListTable.vue";
import EditStudentButton from "@/components/EditStudentButton.vue";
import { storeToRefs } from "pinia";
import JournalImportConfirmDialog from "@/components/JournalImportConfirmDialog.vue";
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

const isDev = import.meta.env.DEV;

const journalId = computed(() => {
  return f7.views.main.router.currentRoute.params.id as string;
});

const activeNavItem = ref("journal-details");
const activeTab = ref("journal");

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
const class9Store = useClass9Store();
const { class9Options } = storeToRefs(class9Store);
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

const currentJournalGroupLanguage = computed(() => {
  if (!currentJournal.value) return "";
  return journalStore.getJournalGroupLanguage(currentJournal.value);
});

const currentClass9Text = computed(() => {
  const disciplineId = currentJournal.value?.disciplineId;
  if (!disciplineId) return "";
  const option = class9Options.value.find((o: any) => o.value === disciplineId);
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
  return ays ? `Семестр ${ays.semesterNumber}` : "—";
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
  const class9Item = class9Store.getClass9ById(disciplineId);
  return class9Item?.specialtyIds || [];
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
  if (loadedForKtpId.value === ktpId) return;
  await ktpStore.loadFromBackend();
  loadedForKtpId.value = ktpId;
}

const currentEvent = computed(() => {
  if (!journalId.value) return null;
  return calendarStore.getEventById(journalId.value) || null;
});

watch(
  () => [
    journalId.value,
    currentEvent.value?.id,
    currentEvent.value?.ktpId,
    currentEvent.value?.class9Id,
    currentEvent.value?.semester,
    academicYearSemesterStore.academicYearSemesters.length,
  ] as const,
  async ([_jid, _eventId, eventKtpId, eventClass9Id, eventSemesterId]) => {
    ensuredKtpId.value = eventKtpId || null;
    if (!journalId.value || !currentEvent.value) return;
    if (isEnsuringKtp.value) return;

    // If already linked, just ensure store data is present.
    if (eventKtpId) {
      try {
        await ensureKtpDataLoaded(eventKtpId);
      } catch (e) {
        console.error("[JournalDetails] load KTP failed:", e);
      }
      return;
    }

    // Otherwise, create/link an event-specific KTP.
    const semester = eventSemesterId ? getSemesterById(eventSemesterId) : null;
    const academicYearId = semester?.academicYearId;
    if (!academicYearId || !eventClass9Id || !eventSemesterId) return;

    isEnsuringKtp.value = true;
    try {
      const event = currentEvent.value;
      if (!event) return;
      const ktp = await ktpStore.ensureKtpForClass9(
        event.class9Id,
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
  isImportDialogOpened,
  importOverwriteMode,
  importPreparedData,
  importMapping,
  importResult,
  onDownloadClick,
  onUploadClick,
  onImportConfirm,
  onImportCancel,
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
        discipline: currentClass9Text.value,
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
    f7.dialog.alert("Не удалось скопировать информацию в буфер обмена");
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
    ktpParentId.value = "mock-class9-id-1";
  } else {
    ktpParentId.value = currentJournal.value.disciplineId;
  }
  isKtpPopupOpened.value = true;
};

// Open RUP dialog
const openRupDialog = () => {
  const disciplineId = currentJournal.value?.disciplineId;
  if (!disciplineId) {
    f7.dialog.alert("Дисциплина не найдена");
    return;
  }
  
  // Load the class9 data for editing
  const class9Item = class9Store.getClass9ById(disciplineId);
  if (class9Item) {
    rupInitialData.value = class9Item;
  }
  
  isRupPopupOpened.value = true;
  nextTick(() => {
    f7.popover.open("#class9-popover");
  });
};

const closeRupPopup = () => {
  isRupPopupOpened.value = false;
  rupInitialData.value = null;
  f7.popover.close("#class9-popover");
};

const handleRupSubmit = () => {
  closeRupPopup();
  // Optionally refresh the debug info or journal data
  f7.toast.create({
    text: "РУП успешно сохранен",
    position: "center",
    closeTimeout: 2000,
  }).open();
};

// Journal settings functions
const openJournalSettings = () => {
  f7.popover.open("#journal-settings-popover", "#journal-settings-button");
};

const closeJournalSettings = () => {
  f7.popover.close("#journal-settings-popover");
};

const saveJournalSettings = async (
  nextSettings?: {
    calculationType: "calculated" | "manual";
    calculationMethod: "only-assigned" | "all-days";
  }
) => {
  if (!currentJournal.value) {
    f7.dialog.alert("Журнал не найден");
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
      text: "Настройки сохранены",
      position: "center",
      closeTimeout: 2000,
    }).open();
  } catch (error) {
    f7.preloader.hide();
    console.error("[JournalDetails] Failed to save journal settings:", error);
    f7.dialog.alert("Не удалось сохранить настройки");
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

  // Get distribution entries for this discipline from class9
  const disciplineId = journal?.disciplineId;
  const class9Item = disciplineId 
    ? class9Store.getClass9ById(disciplineId) 
    : null;
  
  const relevantDistributionEntries = (class9Item?.distributionEntries || [])
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
    totalDistributionEntries: class9Item?.distributionEntries?.length || 0,
    allDistributionEntries: class9Item?.distributionEntries,
    currentSemesterId: semesterId,
    currentAcademicYearId: academicYearId,
    matching: {
      info: 'Entries match only by UUID: entry.semesterId === semesterUUID',
      byUUID: 'entry.semesterId === ' + semesterId,
    },
    afterSemesterFilter: (class9Item?.distributionEntries || []).filter((entry: any) => {
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
    totalDistributionEntries: class9Item?.distributionEntries?.length || 0,
    allDistributionEntries: (class9Item?.distributionEntries || []).map((e: any) => ({
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
