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
            :academic-year="currentAcademicYearText"
            :semester="currentSemesterText"
            @back="handleBackClick"
          />

          <!-- Debug Information Panel -->
          <JournalDebugPanel
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
                  :journal-settings="journalSettings"
                  @download="onDownloadClick"
                  @upload="onUploadClick"
                  @show-floating-row="showFloatingRow"
                  @open-date-focus="openDateFocus"
                  @update-students="updateStudents"
                  @open-ktp-details="onOpenKtpDetails"
                  @open-settings="openJournalSettings"
                  @open-rup="openRupDialog"
                />
              </f7-tab>

              <f7-tab
                id="tab-participants"
                class="page-content"
                :tab-active="activeTab === 'participants'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Участники
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будут отображаться участники журнала
                    </p>
                  </div>
                </div>
              </f7-tab>

              <f7-tab
                id="tab-planning"
                class="page-content"
                :tab-active="activeTab === 'planning'"
              >
                <div class="flex flex-col gap-4">
                  <div class="text-center py-8">
                    <h3 class="text-lg font-medium text-muted-foreground">
                      Тематическое планирование
                    </h3>
                    <p class="text-sm text-muted-foreground mt-2">
                      Здесь будет тематическое планирование
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
      @close="isDateFocusVisible = false"
      @update-students="updateStudents"
    />
    <KtpDetailPopup v-model:opened="isKtpPopupOpened" :ktp-id="ktpParentId" />
    
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

    <!-- Journal Settings Popup -->
    <f7-popover
      id="journal-settings-popover"
      style="width: 500px !important"
      close-on-escape
      target="#journal-settings-button"
    >
      <div class="journal-settings-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Настройки журнала"
          :disabled="false"
          :is-loading="false"
          :on-cancel="closeJournalSettings"
          :on-save="saveJournalSettings"
        />

        <div class="p-4 space-y-6">
          <!-- Calculation Type Section -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-foreground">
              Тип расчета сессии
            </h3>

            <div class="space-y-3">
              <!-- Calculated Option -->
              <div class="space-y-2">
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="calculation-type"
                    value="calculated"
                    v-model="journalSettings.calculationType"
                    class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                  />
                  <span class="text-sm text-foreground">Расчитываемая</span>
                </label>

                <!-- Sub-options for Calculated -->
                <div
                  v-if="journalSettings.calculationType === 'calculated'"
                  class="ml-7 space-y-2"
                >
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="calculation-method"
                      value="only-assigned"
                      v-model="journalSettings.calculationMethod"
                      class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                    />
                    <span class="text-sm text-muted-foreground"
                      >Только выставленных дней</span
                    >
                  </label>

                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="calculation-method"
                      value="all-days"
                      v-model="journalSettings.calculationMethod"
                      class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                    />
                    <span class="text-sm text-muted-foreground">Всех дней</span>
                  </label>
                </div>
              </div>

              <!-- Manual Option -->
              <div>
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="calculation-type"
                    value="manual"
                    v-model="journalSettings.calculationType"
                    class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                  />
                  <span class="text-sm text-foreground">Выставляемая</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </f7-popover>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import {
  f7Page,
  f7,
  f7Toolbar,
  f7Link,
  f7Tabs,
  f7Tab,
  f7Icon,
  f7Popover,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useJournalStore } from "@/stores/journalStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useClass9Store } from "@/stores/class9Store";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import JournalTab from "@/components/JournalTab.vue";
import JournalHeader from "@/components/JournalHeader.vue";
import JournalDebugPanel from "@/components/JournalDebugPanel.vue";
import FloatingJournalRow from "@/components/FloatingJournalRow.vue";
import DateColumnFocus from "@/components/DateColumnFocus.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
import Class9Popup from "@/components/Class9Popup.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import { storeToRefs } from "pinia";
import { importJournalFromExcel } from "@/services/excel-parser";
import {
  exportJournalToExcel,
  type JournalStudentRow,
} from "@/services/journal-export";
import { useStudentStore } from "@/stores/studentStore";
import { useTeacherStore } from "@/stores/teacherStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";

const journalId = computed(() => {
  return f7.views.main.router.currentRoute.params.id as string;
});

const activeNavItem = ref("journal-details");
const activeTab = ref("journal");

const handleBackClick = () => {
  const from = f7.views.main.router.currentRoute.query.from as string;
  if (from === "schedule") {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    f7.views.main.router.navigate(`/planning/${currentYear}/${currentMonth}/`);
  } else {
    f7.views.main.router.navigate("/journals/");
  }
};

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);

const journalStore = useJournalStore();
const calendarStore = useCalendarStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const class9Store = useClass9Store();
const { class9Options } = storeToRefs(class9Store);
const studentStore = useStudentStore();
const teacherStore = useTeacherStore();
const specialtyStore = useSpecialtyStore();
const selectedItemsStore = useSelectedItemsStore();
const { students: studentStoreStudents } = storeToRefs(studentStore);

const currentJournal = computed(() => {
  if (!journalId.value) return null;
  return journalStore.getJournalById(journalId.value);
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

const journalTabRef = ref<InstanceType<typeof JournalTab> | null>(null);

// Journal settings state
const journalSettings = ref({
  calculationType: "calculated" as "calculated" | "manual",
  calculationMethod: "only-assigned" as "only-assigned" | "all-days",
});

// Debug copy state
const debugCopied = ref(false);

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

const updateStudents = (updatedStudents: any[]) => {
  // This function receives updates from the JournalTab component
  // You can add any additional logic here if needed
};

const updateStudent = (updatedStudent: any) => {
  if (journalTabRef.value) {
    journalTabRef.value.updateStudent(updatedStudent);
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

const onDownloadClick = async () => {
  const journal = currentJournal.value;
  if (!journal) {
    f7.dialog.alert("Журнал не найден");
    return;
  }

  try {
    f7.preloader.show();
    const { saveAs } = await import("file-saver");

    const snapshot = journalTabRef.value?.getExportSnapshot?.();
    if (!snapshot) {
      f7.preloader.hide();
      f7.dialog.alert("Данные журнала ещё загружаются. Повторите попытку позже.");
      return;
    }

    const templateUrl = encodeURI(
      "/journal_templates/1_семестр_РО_4_1_ВА22_академическое_рус_яз_,_ВЭ22_эстрадное_рус.xlsx"
    );

    const event = calendarStore.getEventById(journal.id);

    const studentRows: JournalStudentRow[] = snapshot.students.map(
      (row) => ({
        id: row.studentId,
        fullName: row.fullName,
        attendance: [...row.attendance],
        finalGrade:
          row.finalSummary && row.finalSummary !== "—"
            ? row.finalSummary
            : undefined,
      })
    );

    const primaryStudentId = journal.students?.[0];
    const primaryStudent = primaryStudentId
      ? studentStoreStudents.value.find((s) => s.id === primaryStudentId)
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

    const buffer = await exportJournalToExcel({
      templateUrl,
      groupName: groupTitle,
      courseLabel: journal.courseNumber?.toString?.() ?? "",
      specialtyLabel: specialty
        ? `${specialty.code} - ${specialty.name}`
        : undefined,
      academicYearLabel,
      disciplineTitle,
      teacherFullName: teacherName,
      students: studentRows,
      calendarEvent: event ?? undefined,
      lessonDates: snapshot.columns.map((column) => column.label),
    });

    const blobBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([blobBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, filename);
  } catch (error) {
    console.error("Failed to export journal", error);
    const message =
      error instanceof Error
        ? error.message
        : "Не удалось экспортировать журнал";
    f7.dialog.alert(message);
  } finally {
    f7.preloader.hide();
  }
};

const onUploadClick = () => {
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
        messageParts.push(
          `<br/><b>Предупреждения:</b><br/>${warnings.replace(/\n/g, "<br/>")}`
        );
      }

      f7.dialog.alert(messageParts.join("<br/>") || "Импорт завершён");
    } catch (error) {
      f7.preloader.hide();
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось импортировать журнал";
      f7.dialog.alert(message);
    }
  };

  input.click();
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

const saveJournalSettings = () => {
  // TODO: Implement saving journal settings to backend/store
  console.log("Saving journal settings:", journalSettings.value);
  closeJournalSettings();
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

onMounted(() => {
  // Semester debug info removed
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
