<template>
  <div>
    <div
      v-if="isViewOnly"
      class="mb-3 p-3 bg-muted/50 border border-border text-muted-foreground rounded-md text-sm"
      role="status"
    >
      Журнал закрыт. Доступен только просмотр.
    </div>
    <JournalToolbar
      v-model:viewMode="viewMode"
      :is-view-only="isViewOnly"
      :show-individual-journals="showIndividualJournals"
      :has-individual-journals="hasIndividualJournals"
      @download="onDownloadClick"
      @open-retake="isRetakeModalOpen = true"
      @open-rup="onOpenRupClick"
      @open-history="onHistoryClick"
      @open-settings="onSettingsClick"
      @open-recalc="onRecalcClick"
      @open-makeup-hours="onMakeupHoursClick"
      @close-journal="onCloseJournalClick"
      @open-journal="onOpenJournalClick"
      @open-individual-journals="onOpenIndividualJournalsClick"
    />

    <!-- Academic Year Mismatch Warning Banner -->
    <div
      v-if="academicYearMismatchInfo"
      class="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300 rounded-md"
      role="alert"
    >
      <div class="flex items-start">
        <IconTriangleAlert class="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" />
        <div class="flex-1">
          <h3 class="font-semibold text-lg mb-2">
            Промежуточный контроль не настроен для этого учебного года
          </h3>
          <p class="mb-2">
            Колонки промежуточного контроля (РК1, РК2 и т.д.) не отображаются, потому что в
            расписании не настроены промежуточные контроли для учебного года
            {{ academicYearMismatchInfo.usingSemesterYear ? 'семестра' : 'дисциплины' }} этого журнала.
          </p>
          <div class="bg-card dark:bg-yellow-950/20 p-3 rounded border border-yellow-200 dark:border-yellow-800 mb-3">
            <p class="text-sm mb-1">
              <strong>ID учебного года {{ academicYearMismatchInfo.usingSemesterYear ? '(из семестра)' : '(из РУП)' }}:</strong>
              <code class="bg-muted px-2 py-1 rounded text-xs ml-1">
                {{ academicYearMismatchInfo.journalAcademicYearId }}
              </code>
            </p>
            <p class="text-sm">
              <strong>Промежуточные контроли настроены для учебных годов:</strong>
              <span
                v-for="(yearId, index) in academicYearMismatchInfo.availableAcademicYearIds"
                :key="yearId"
                class="inline-block"
              >
                <code class="bg-muted px-2 py-1 rounded text-xs ml-1">{{ yearId }}</code>
                <span v-if="index < academicYearMismatchInfo.availableAcademicYearIds.length - 1">,</span>
              </span>
            </p>
          </div>
          <div class="space-y-1">
            <p class="font-medium">Для решения проблемы:</p>
            <ol class="list-decimal list-inside space-y-1 text-sm ml-2">
              <li>
                Перейдите на страницу
                <strong>"Расписание образования"</strong> (Education Schedule)
              </li>
              <li>
                Разверните раздел
                <strong>"Промежуточный контроль"</strong>
              </li>
              <li>
                Добавьте промежуточные контроли (РК1, РК2 и т.д.) для учебного года {{ academicYearMismatchInfo.usingSemesterYear ? 'семестра' : 'дисциплины' }}
              </li>
              <li v-if="academicYearMismatchInfo.usingSemesterYear">
                Или обновите учебный год семестра в графике образовательного процесса
              </li>
              <li v-else>
                Или обновите учебный год дисциплины в РУП
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>

    <template v-if="viewMode !== 'individual'">
      <JournalGradeStats
        v-if="viewMode === 'monitoring' && monitoringGradeStats.totalGraded > 0"
        :stats="monitoringGradeStats"
        :total-students="students.length"
      />

      <JournalGrid
        :displayed-students="displayedStudents"
        :displayed-headers="displayedHeaders"
        :marks-matrix="marksMatrix"
        :editing-cell="editingCell"
        :edited-value="editedValue"
        :is-view-only="isViewOnly"
        :journal_future_date_tooltip="journal_future_date_tooltip()"
        :get-ktp-for-header="getKtpForHeader"
        :is-future-date="isFutureDate"
        :is-past-date="isPastDate"
        :get-student-average-score="getStudentAverageScore"
        :get-score-badge-class="getScoreBadgeClass"
        @header-click="openDateFocus"
        @paperclip-click="onPaperclipClick"
        @cell-click="handleCellClick"
        @show-history="handleShowCellHistory"
        @student-click="showFloatingRow"
        @update:editedValue="editedValue = $event"
        @confirm-edit="confirmEdit"
        @cancel-edit="cancelEdit"
        @navigate="navigate"
      />
    </template>

    <IndividualJournalsInlineView
      v-if="viewMode === 'individual'"
      :main-event-id="props.journalId"
    />

    <!-- KtpDetailViewPopover -->
    <KtpDetailViewPopover
      v-model:opened="ktpViewPopoverOpened"
      :target="ktpViewPopoverTarget"
      :detail="selectedKtpDetail"
    />

    <!-- Journal History Dialog -->
    <JournalHistoryDialog
      v-model:opened="isHistoryDialogOpen"
      :journal-id="props.journalId"
    />

      <MakeupHoursPopover
        :journal-dates="journalDatesForMakeup"
        :is-loading="isMakeupRequestLoading"
        @save="onMakeupHoursSave"
      />

    <!-- Journal Settings Popover -->
    <JournalSettingsPopover
      :initial-settings="localJournalSettings"
      @save="saveJournalSettings"
      @closed="resetLocalSettings"
    />

    <!-- Recalculate Controls Popup -->
    <RecalcControlsPopup
      ref="recalcPopupRef"
      :students="students"
      :recalc-control-options="recalcControlOptions"
      @submit="handleRecalcSubmit"
      @closed="onRecalcPopupClosed"
    />
    <!-- Retake Modal -->
    <RetakeModal
      :is-open="isRetakeModalOpen"
      :students="students"
      @close="isRetakeModalOpen = false"
      @submit="handleRetakeSubmit"
    />

    <!-- Mark History Dialog -->
    <MarkHistoryDialog
      :is-open="isHistoryDialogOpen"
      :journal-id="props.journalId"
      :student-id="historyCellContext.studentId"
      :student-name="historyCellContext.studentName"
      :column-label="historyCellContext.columnLabel"
      :column-index="historyCellContext.columnIndex"
      :row-index="historyCellContext.rowIndex"
      @close="isHistoryDialogOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, onUpdated } from "vue";
import dayjs from "dayjs";
import { isFutureDate, isPastDate } from "@/utils/date";
import {
  DATE_DAY_MONTH_FORMAT,
  DATE_YEAR_FORMAT,
  DATE_STORAGE_FORMAT,
} from "@/constants/calendar";
import {
  exportHeaderLabelFor,
  getScoreBadgeClass,
} from "@/components/journal/journalGrid.lib";
import { f7Button } from "framework7-vue";
import IconFileText from "~icons/lucide/file-text";
import IconSettings from "~icons/lucide/settings";
import IconClock from "~icons/lucide/clock";
import IconCircleX from "~icons/lucide/circle-x";
import IconLockOpen from "~icons/lucide/lock-open";
import IconArrowDownToLine from "~icons/lucide/arrow-down-to-line";

import IconTriangleAlert from "~icons/lucide/triangle-alert";
import IconPaperclip from "~icons/lucide/paperclip";
import IconMoreVertical from "~icons/lucide/more-vertical";
import IconCalculator from "~icons/lucide/calculator";
import IconSparkles from "~icons/lucide/sparkles";
import IconFileSpreadsheet from "~icons/lucide/file-spreadsheet";
import {
  journal_view_general,
  journal_view_monitoring,
  journal_export,
  journal_history_changes,
  journal_recalc_controls,
  journal_grade_stats_title,
  journal_grade_stats_count,
  journal_future_date_tooltip,
  journal_settings_field_calculation,
  journal_settings_field_account_for,
  journal_settings_calc_calculated,
  journal_settings_calc_manual,
  journal_settings_account_assigned,
  journal_settings_account_all,
  makeup_hours_title,
} from "@/paraglide/messages";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import DropdownMenu from "@/components/ui/DropdownMenu.vue";
import Select from "@/components/ui/Select.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
// Inlined MarkCell
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";
import KtpDetailViewPopover from "@/components/KtpDetailViewPopover.vue";
import JournalHistoryDialog from "@/components/JournalHistoryDialog.vue";
import RetakeModal from "./RetakeModal.vue";
import JournalToolbar from "./JournalToolbar.vue";
import JournalGradeStats from "./JournalGradeStats.vue";
import JournalGrid from "./JournalGrid.vue";
import IndividualJournalsInlineView from "./IndividualJournalsInlineView.vue";
import IconRefreshCw from "~icons/lucide/refresh-cw";
import MakeupHoursPopover from "@/components/MakeupHoursPopover.vue";
import JournalSettingsPopover from "./JournalSettingsPopover.vue";
import RecalcControlsPopup from "./RecalcControlsPopup.vue";
import { useMakeupHours } from "@/components/journal/useMakeupHours";
import { useCalendarStore } from "@/stores/calendarStore";
import { useStudentStore } from "@/stores/studentStore";
import { useMarksStore } from "@/stores/marksStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useJournalKtp } from "@/components/journal/useJournalKtp";
import { useJournalColumns } from "@/components/journal/useJournalColumns";
import { useJournalStudents } from "@/components/journal/useJournalStudents";
import { useStoreIndexMapping } from "@/components/journal/useStoreIndexMapping";
import { useSessionGrades } from "@/components/journal/useSessionGrades";
import { useJournalMarks } from "@/components/journal/useJournalMarks";
import { useJournalStore } from "@/stores/journalStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupEntryStore, type RupEntry } from "@/stores/rupEntryStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { storeToRefs } from "pinia";
import type { Mark } from "@/types/marks";
import type { EducationSchedule } from "@/stores/educationScheduleStore";
import type { StudentWithMarks } from "@/types/student";

interface ResolvedParticipant {
  id: string;
  surname: string;
  firstName: string;
  patronymic: string;
}

interface Props {
  journalId: string;
  journalSettings?: {
    calculationType: "calculated" | "manual";
    calculationMethod: "only-assigned" | "all-days";
    finalControlForm?: "written" | "oral" | "mixed";
    finalGradeFormula?: { intermediateWeight: number; finalWeight: number };
  };
  ktpId?: string | null;
  resolvedParticipants?: ResolvedParticipant[];
  showIndividualJournals?: boolean;
  hasIndividualJournals?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "show-floating-row": [student: any, index: number];
  "open-date-focus": [header: { type: string; label: string }, index: number];
  "update-students": [students: StudentWithMarks[]];
  "open-ktp-details": [header: { type: string; label: string }, index: number];
  "open-rup": [];
  "open-settings": [];
  "close-journal": [];
  "open-journal": [];
  download: [];
  "open-individual-journals": [];

  "save-journal-settings": [any];
}>();

const calendarStore = useCalendarStore();
const studentStore = useStudentStore();
const { getStudentFullName } = studentStore;
const marksStore = useMarksStore();

// Recalc popup state
const recalcPopupRef = ref<InstanceType<typeof RecalcControlsPopup> | null>(null);

const recalcControlOptions = computed(() => {
  const opts: Array<{ value: string; text: string }> = intermediateControlsForRecalc.value.map(c => ({
    value: c.label,
    text: c.label,
  }));
  opts.push({ value: '__finals__', text: 'Итоговые' });
  return opts;
});
const educationScheduleStore = useEducationScheduleStore();
const journalStore = useJournalStore();
const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const rupEntryStore = useRupEntryStore();
const intermediateControlStore = useIntermediateControlStore();
const finalControlStore = useFinalControlStore();
const scheduledIntermediateControlStore =
  useScheduledIntermediateControlStore();
const scheduledFinalControlStore = useScheduledFinalControlStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);
const { getRupEntryById, rupEntries } = storeToRefs(rupEntryStore);
const { getAcademicYearSemesterById } = storeToRefs(academicYearSemesterStore);
const { getIntermediateControlById } = storeToRefs(intermediateControlStore);
const { getFinalControlById } = storeToRefs(finalControlStore);
const {
  scheduledIntermediateControls,
  getScheduledIntermediateControlsByAcademicYear,
} = storeToRefs(scheduledIntermediateControlStore);
const { scheduledFinalControls, getScheduledFinalControlsByAcademicYear } =
  storeToRefs(scheduledFinalControlStore);

const viewMode = ref<"general" | "monitoring" | "individual">("general");

// Self-heal: fall back to general when individual mode becomes unavailable
// (either viewMode flips to "individual" while the feature is off, OR the
// feature flags flip false while already in individual mode).
watch(
  [viewMode, () => props.showIndividualJournals, () => props.hasIndividualJournals],
  ([mode]) => {
    if (mode === "individual" && !(props.showIndividualJournals && props.hasIndividualJournals)) {
      viewMode.value = "general";
    }
  }
);

const displayedHeaders = computed(() => {
  if (viewMode.value === "monitoring") {
    return visibleHeaders.value.filter(
      (h) => h.type === "session" || h.isFinalSummary,
    );
  }
  return visibleHeaders.value;
});

const currentJournal = computed(() => {
  if (!props.journalId) return null;
  return journalStore.getJournalById(props.journalId);
});

const currentEvent = computed(() => {
  if (!props.journalId) return null;
  return calendarStore.getEventById(props.journalId);
});

const currentRupEntry = computed(() => {
  const rupEntryId =
    currentJournal.value?.disciplineId || currentEvent.value?.rupEntryId;
  if (!rupEntryId) return null;
  const lookup = getRupEntryById.value;
  if (typeof lookup !== "function") return null;
  return (lookup(rupEntryId) as RupEntry | null | undefined) ?? null;
});

const {
  generateDates,
  canonicalTemplate,
  getCanonicalRows,
  getRowIndices,
  tableHeaders,
  visibleHeaders,
  visibleColumnIndices,
} = useJournalColumns({
  currentEvent,
  currentRupEntry,
  currentJournal,
  journalId: computed(() => props.journalId),
});

const {
  students,
  displayedStudents,
  visibleStudentsCount,
  startChunkedRendering,
  marksByStudentId,
  getStudentIdByIndex,
} = useJournalStudents({
  currentJournal,
  journalId: computed(() => props.journalId),
  resolvedParticipants: computed(() => props.resolvedParticipants),
});

const { getStoreIndexForCanonicalIndex, getStoreIndexForDatePosition } =
  useStoreIndexMapping({
    canonicalTemplate,
    getStudentIdByIndex,
    journalId: computed(() => props.journalId),
  });

// Detect academic year mismatch for intermediate controls
const academicYearMismatchInfo = computed(() => {
  // Use semester's academic year (from calendar/planning), not discipline's academic year (from РУП)
  const event = currentEvent.value;
  const semesterId = event?.semester ? String(event.semester) : null;
  const currentSemester =
    semesterId && typeof getAcademicYearSemesterById.value === "function"
      ? getAcademicYearSemesterById.value(semesterId)
      : null;
  const academicYearId = currentSemester?.academicYearId || currentRupEntry.value?.academicYearId;

  if (!academicYearId) return null;

  const allScheduledControls = scheduledIntermediateControls.value || [];
  if (allScheduledControls.length === 0) return null;

  const scheduledForYear =
    typeof getScheduledIntermediateControlsByAcademicYear.value === "function"
      ? getScheduledIntermediateControlsByAcademicYear.value(academicYearId) || []
      : [];

  // If there are scheduled controls but none for this year, we have a mismatch
  if (scheduledForYear.length === 0 && allScheduledControls.length > 0) {
    const uniqueAcademicYears = Array.from(
      new Set(allScheduledControls.map((c: any) => c.academicYearId))
    );
    return {
      journalAcademicYearId: academicYearId,
      availableAcademicYearIds: uniqueAcademicYears,
      scheduledControlsCount: allScheduledControls.length,
      usingSemesterYear: !!currentSemester,
    };
  }

  return null;
});

const isRetakeModalOpen = ref(false);
const handleRetakeSubmit = (data: any) => {
  console.log("Retake requested:", data);
};

const openDateFocus = (
  header: { type: string; label: string },
  index: number
) => {
  if (header.type !== "date") return;
  emit("open-date-focus", header, index);
};

const showFloatingRow = (student: any, index: number) => {
  emit("show-floating-row", student, index);
};

const isHistoryDialogOpen = ref(false);

const {
  ktpViewPopoverOpened,
  ktpViewPopoverTarget,
  selectedKtpDetail,
  getKtpForHeader,
  onPaperclipClick,
} = useJournalKtp({
  currentEvent,
  currentJournal,
  currentRupEntry,
  visibleHeaders,
  ktpId: computed(() => props.ktpId),
});

const localJournalSettings = ref({
  calculationType: props.journalSettings?.calculationType || "calculated",
  calculationMethod:
    props.journalSettings?.calculationMethod || "only-assigned",
  finalControlForm: props.journalSettings?.finalControlForm || "written" as "written" | "oral" | "mixed",
  finalGradeFormula: props.journalSettings?.finalGradeFormula || { intermediateWeight: 0.6, finalWeight: 0.4 },
});

const {
  computeDayAverage,
  computeSessionGradeForStudent,
  computeAllSessionGrades,
  areAllControlsCalculated,
  getStudentAverageScore,
  getStudentFinalGrade,
  monitoringGradeStats,
  scheduleRecomputeSessionGrades,
} = useSessionGrades({
  canonicalTemplate,
  getStoreIndexForCanonicalIndex,
  getStoreIndexForDatePosition,
  marksByStudentId,
  students,
  localJournalSettings,
  journalId: computed(() => props.journalId),
  journalSettings: computed(() => props.journalSettings),
});

const {
  editingCell,
  editedValue,
  userEditInProgress,
  isViewOnly,
  notifyViewOnly,
  withEditPermission,
  getMark,
  marksMatrix,
  updateMark,
  setMark,
  handleCellClick,
  editCell,
  confirmEdit,
  cancelEdit,
  navigate,
  rebuildMarks,
  scheduleRebuildMarks,
  updateStudent,
  updateStudents,
} = useJournalMarks({
  currentEvent,
  currentJournal,
  canonicalTemplate,
  generateDates,
  getCanonicalRows,
  visibleHeaders,
  getStoreIndexForCanonicalIndex,
  students,
  getStudentIdByIndex,
  getStudentFinalGrade,
  scheduleRecomputeSessionGrades,
  localJournalSettings,
  journalId: computed(() => props.journalId),
  journalSettings: computed(() => props.journalSettings),
  emit,
});

const resetLocalSettings = () => {
  localJournalSettings.value = {
    calculationType: props.journalSettings?.calculationType || "calculated",
    calculationMethod: props.journalSettings?.calculationMethod || "only-assigned",
    finalControlForm: props.journalSettings?.finalControlForm || "written",
    finalGradeFormula: props.journalSettings?.finalGradeFormula || { intermediateWeight: 0.6, finalWeight: 0.4 },
  };
};

const saveJournalSettings = withEditPermission((settings: any) => {
  emit("save-journal-settings", settings);
  localJournalSettings.value = settings;
});

const onOpenRupClick = () => emit("open-rup");
const onSettingsClick = () => emit("open-settings");
const onOpenIndividualJournalsClick = () => emit("open-individual-journals");
const onHistoryClick = () => {
  isHistoryDialogOpen.value = true;
};
const onCloseJournalClick = withEditPermission(() => {
  emit("close-journal");
});
const onOpenJournalClick = () => emit("open-journal");
const onDownloadClick = () => emit("download");

const onRecalcClick = withEditPermission(() => {
  recalcPopupRef.value?.open();
});

const onRecalcPopupClosed = () => {
  // Handled internally by component
};

// Makeup Hours
const {
  isMakeupRequestLoading,
  journalDatesForMakeup,
  onMakeupHoursClick,
  onMakeupHoursSave,
} = useMakeupHours({
  canonicalTemplate,
  currentEvent,
  journalId: computed(() => props.journalId),
});

const handleRecalcSubmit = async (control: string, studentIds: string[]) => {
  if (control === '__finals__') {
    await computeAllSessionGrades({ force: true, studentIds });
  } else {
    await computeAllSessionGrades({ force: true, labels: [control], studentIds });
  }
};

// Get all intermediate controls for the recalc popup
const intermediateControlsForRecalc = computed(() => {
  const canonical = canonicalTemplate.value || [];

  console.log("[JournalTab] intermediateControlsForRecalc - canonical template:", {
    totalColumns: canonical.length,
    sessionColumns: canonical.filter((m: any) => m?.type === "session"),
    allSessionDetails: canonical
      .filter((m: any) => m?.type === "session")
      .map((m: any) => ({
        type: m.type,
        controlType: m.controlType,
        label: m.label,
        sessionId: m.sessionId,
        scheduledControlId: m.scheduledControlId,
      })),
  });

  const controls = canonical
    .filter((mark: any) => {
      const isIntermediate = mark?.type === "session" && mark?.controlType === "intermediate";
      console.log("[JournalTab] checking mark:", {
        type: mark?.type,
        controlType: mark?.controlType,
        label: mark?.label,
        isIntermediate,
      });
      return isIntermediate;
    })
    .map((mark: any, index: number) => ({
      id: mark.scheduledControlId || mark.sessionId || `intermediate-${index}`,
      label: mark.label || "ПК",
    }));

  console.log("[JournalTab] intermediateControlsForRecalc - filtered controls:", controls);

  // Remove duplicates based on label
  const unique = controls.filter(
    (control, index, self) =>
      index === self.findIndex((c) => c.label === control.label)
  );

  console.log("[JournalTab] intermediateControlsForRecalc - unique controls:", unique);

  return unique;
});

// Map canonical column index to current store column index (using first student's marks)
watch(
  () => visibleHeaders.value,
  (headers) => {
  },
  { deep: true, immediate: true }
);

watch(
  () => JSON.stringify(props.journalSettings),
  () => {
    scheduleRecomputeSessionGrades();
  }
);

// Rebuild marks when event times or weekly schedules change
watch(
  () => {
    const ev = currentEvent.value;
    if (!ev) return null;
    return [ev.startDate, ev.endDate, JSON.stringify(ev.weeklySchedules || [])];
  },
  () => {
    scheduleRebuildMarks();
  },
  { deep: false }
);

// Rebuild marks when active education schedules change (ensures correct row counts once schedules load)
watch(
  () => JSON.stringify(getActiveYearSchedules.value),
  () => {
    scheduleRebuildMarks();
  }
);

watch(
  () => JSON.stringify(scheduledIntermediateControls.value),
  () => {
    scheduleRebuildMarks();
  }
);

watch(
  () => JSON.stringify(scheduledFinalControls.value),
  () => {
    scheduleRebuildMarks();
  }
);

watch(
  () => JSON.stringify(currentRupEntry.value?.distributionEntries ?? []),
  () => {
    scheduleRebuildMarks();
  }
);
const getExportSnapshot = () => {
  if (!props.journalId) return null;
  const canonical = canonicalTemplate.value || [];
  const exportColumns = canonical.map((mark: any, index: number) => ({
    canonicalIndex: index,
    type: mark.type,
    label: exportHeaderLabelFor(mark),
    isoDate: mark?.isoDate ?? null,
  }));

  const rows = (currentJournal.value?.students || []).map(
    (studentId: string) => {
      const studentMarks =
        marksStore.getStudentMarks(props.journalId!, studentId) || [];

      const attendance = exportColumns.map(({ canonicalIndex, type }) => {
        const storeIndex = getStoreIndexForCanonicalIndex(canonicalIndex);
        if (storeIndex == null || storeIndex < 0) return "";
        const mark = studentMarks[storeIndex];
        if (!mark) return "";

        if (type === "date") {
          const combined = (mark.values || [])
            .map((value) =>
              value === null || value === "" ? "" : String(value).trim()
            )
            .filter((value) => value.length > 0);
          return combined.join(" / ");
        }

        const value = mark.values?.[0];
        return value == null || value === "" ? "" : String(value);
      });

      return {
        studentId,
        fullName: getStudentFullName(studentId),
        attendance,
        finalSummary: getStudentFinalGrade(studentId),
      };
    }
  );

  return {
    columns: exportColumns.map(({ canonicalIndex, ...rest }) => rest),
    students: rows,
  };
};

defineExpose({
  updateStudent,
  updateStudents,
  tableHeaders: computed(() => tableHeaders.value),
  students: computed(() => students.value),
  getExportSnapshot,
  getKtpForHeader,
  onPaperclipClick,
  isViewOnly,
  notifyViewOnly,
});

onMounted(() => {
  scheduleRebuildMarks();
  startChunkedRendering();
});

onUpdated(() => {
  // Empty
});

onUnmounted(() => {
});

watch(
  () => currentJournal.value,
  (newJournal) => {
    if (props.journalId && newJournal?.students?.length) {
      scheduleRebuildMarks();
    }
  },
  { immediate: true }
);
</script>
