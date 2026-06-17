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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch, onUpdated } from "vue";
import { debounce } from "es-toolkit";
import dayjs from "dayjs";
import { isFutureDate, isPastDate } from "@/utils/date";
import { confirmMarkEdit } from "@/utils/dialogs";
import {
  DATE_DAY_MONTH_FORMAT,
  DATE_YEAR_FORMAT,
  DATE_STORAGE_FORMAT,
} from "@/constants/calendar";
import {
  initialValuesForType,
  headerLabelFor,
  exportHeaderLabelFor,
  scoreToLetter,
  getScoreBadgeClass,
  resolveScheduleIds,
  LETTER_GRADE_BUCKETS,
} from "@/components/journal/journalGrid.lib";
import { getEventDays, type SemesterInfo } from "@/utils/eventDate";
import { f7, f7Button } from "framework7-vue";
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
import type { MakeupHoursData } from "@/components/MakeupHoursPopover.vue";
import { useMakeupRequestStore } from "@/stores/makeupRequestStore";
import { useUserStore } from "@/stores/userStore";
import { useTeacherStore } from "@/stores/teacherStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useStudentStore } from "@/stores/studentStore";
import { useMarksStore } from "@/stores/marksStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
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
const ktpStore = useKtpStore();
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

const editingCell = ref<{
  studentIndex: number;
  colIndex: number;
  markIndex: number;
} | null>(null);
const editedValue = ref("");
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

const monitoringGradeStats = computed(() => {
  const counts: Record<string, number> = {};
  for (const bucket of LETTER_GRADE_BUCKETS) counts[bucket.letter] = 0;
  let totalGraded = 0;
  for (const student of students.value) {
    const finalRaw = getStudentFinalGrade(student.studentId);
    const finalNum = Number(finalRaw);
    if (!finalRaw || finalRaw === "—" || isNaN(finalNum)) continue;
    counts[scoreToLetter(finalNum)] += 1;
    totalGraded += 1;
  }
  return {
    entries: LETTER_GRADE_BUCKETS.map((b) => ({
      letter: b.letter,
      count: counts[b.letter],
    })),
    totalGraded,
  };
});

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
const DEBUG_JOURNAL_COLUMNS = false;
const debugLog = (...args: any[]) => {
  if (!DEBUG_JOURNAL_COLUMNS) return;
  console.log("[JournalTab][Columns]", ...args);
};
const debugGroup = (title: string, fn: () => void) => {
  if (!DEBUG_JOURNAL_COLUMNS) return;
  console.group(title);
  try {
    fn();
  } finally {
    console.groupEnd();
  }
};

const FINAL_SUMMARY_LABEL = "Итог";

const currentEvent = computed(() => {
  if (!props.journalId) return null;
  return calendarStore.getEventById(props.journalId);
});

const isViewOnly = computed(() => !!currentEvent.value?.isClosed);

const notifyViewOnly = () => {
  f7.toast
    .create({
      text: "Журнал закрыт. Редактирование недоступно.",
      position: "center",
      closeTimeout: 2000,
    })
    .open();
};

const withEditPermission = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: any[]) => {
    if (isViewOnly.value) {
      editingCell.value = null;
      notifyViewOnly();
      return;
    }
    return fn(...args);
  }) as T;
};

const currentRupEntry = computed(() => {
  const rupEntryId =
    currentJournal.value?.disciplineId || currentEvent.value?.rupEntryId;
  if (!rupEntryId) return null;
  const lookup = getRupEntryById.value;
  if (typeof lookup !== "function") return null;
  return (lookup(rupEntryId) as RupEntry | null | undefined) ?? null;
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

const countLessonsInRange = (startId?: string, endId?: string): number => {
  const schedules = (getActiveYearSchedules.value || []) as EducationSchedule[];
  if (!schedules.length) return 2;
  if (!startId && !endId) return 2;
  if (startId && !endId) endId = startId;
  if (!startId && endId) startId = endId;
  const start = schedules.find((s) => s.id === startId)?.lessonNumber;
  const end = schedules.find((s) => s.id === endId)?.lessonNumber;
  if (start == null || end == null) return 2;
  return Math.max(1, Math.abs(end - start) + 1);
};

const generateDates = () => {
  if (!currentEvent.value) {
    return Array.from({ length: 17 }, () => ({
      type: "date" as const,
      date: "",
      values: initialValuesForType("date", 2),
    }));
  }

  const weeklySchedules = currentEvent.value.weeklySchedules || [];
  const dateMarks: Mark[] = [];

  // Get active semester info for fallback date range
  const activeSemester =
    academicYearSemesterStore.getActiveAcademicYearSemester;
  const semesterInfo: SemesterInfo | undefined = activeSemester
    ? {
        startDate: activeSemester.startDate,
        endDate: activeSemester.endDate,
      }
    : undefined;

  debugLog("activeSemester", {
    exists: !!activeSemester,
    semester: activeSemester
      ? {
          id: activeSemester.id,
          semesterNumber: activeSemester.semesterNumber,
          startDate: activeSemester.startDate,
          endDate: activeSemester.endDate,
        }
      : null,
    semesterInfo,
  });

  const days = getEventDays(currentEvent.value as any, semesterInfo);

  debugGroup("generateDates() inputs", () => {
    debugLog("journalId", props.journalId);
    debugLog("students", currentJournal.value?.students?.length || 0);
    debugLog("event", {
      startDate: (currentEvent.value as any)?.startDate,
      endDate: (currentEvent.value as any)?.endDate,
      weeklySchedulesCount: weeklySchedules.length,
    });
    debugLog(
      "days",
      days.map((d: any) => d.day?.format?.(DATE_STORAGE_FORMAT))
    );
  });

  days.forEach(({ day, weekId }) => {
    const dateStr = `${day.format(DATE_DAY_MONTH_FORMAT)}\n${day.format(
      DATE_YEAR_FORMAT
    )}`;
    const isoDate = day.format(DATE_STORAGE_FORMAT);

    // determine rows per day from weekly schedule by lesson ids; fallback from times
    const daySchedule = weeklySchedules.find(
      (ws: any) => ws.weekId === weekId
    ) as any;
    const schedulesArr = (getActiveYearSchedules.value ||
      []) as EducationSchedule[];
    const { startId, endId } = resolveScheduleIds(daySchedule, schedulesArr);
    const rows = countLessonsInRange(startId, endId);

    debugGroup(`day ${isoDate}`, () => {
      debugLog("weekId", weekId);
      debugLog("daySchedule", daySchedule || null);
      debugLog("resolved schedule", { startId, endId });
      debugLog("rows", rows);
    });

    dateMarks.push({
      type: "date",
      date: dateStr,
      values: initialValuesForType("date", rows),
      label: dateStr,
      isoDate,
    });
  });

  debugLog("dateMarks length", dateMarks.length);

  const marksWithSessions: Mark[] = [...dateMarks];
  const event = currentEvent.value;
  const rupEntryItem = currentRupEntry.value as
    | (ReturnType<NonNullable<typeof getRupEntryById.value>> & {
        distributionEntries?: any[];
      })
    | null;
  const semesterFilter = event?.semester ? String(event.semester) : null;

  // Get academic year from semester (for intermediate/final controls)
  // instead of from discipline/РУП (rupEntryItem)
  const currentSemester =
    semesterFilter && typeof getAcademicYearSemesterById.value === "function"
      ? getAcademicYearSemesterById.value(semesterFilter)
      : null;
  const academicYearId = currentSemester?.academicYearId || rupEntryItem?.academicYearId;
  const dateMeta = dateMarks.map((mark, datePos) => {
    const isoDate = mark.isoDate;
    const parsed = isoDate ? dayjs(isoDate, DATE_STORAGE_FORMAT, true) : null;
    return {
      isoDate,
      day: parsed && parsed.isValid() ? parsed : null,
      datePos,
    };
  });

  const parseControlDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = dayjs(value, DATE_STORAGE_FORMAT, true);
    if (parsed.isValid()) return parsed;
    const fallback = dayjs(value);
    return fallback.isValid() ? fallback : null;
  };

  const controlInsertions: {
    mark: Mark;
    insertAfterDatePos: number;
    sortKey: number;
    secondarySortKey: string;
    debug?: Record<string, unknown>;
  }[] = [];

  const relevantDistributionEntries = (rupEntryItem?.distributionEntries || [])
    .filter((entry: any) => {
      if (!semesterFilter) return true;
      if (entry?.semesterId == null) return false;

      // Match by UUID only
      return String(entry.semesterId) === semesterFilter;
    })
    .filter((entry: any) => {
      if (!academicYearId) return true;
      return String(entry?.academicYearId ?? "") === String(academicYearId);
    })
    .map((entry: any) => entry);

  debugGroup("РУП Distribution Entries Analysis", () => {
    debugLog("disciplineId", rupEntryItem?.id);
    debugLog("disciplineName", rupEntryItem?.moduleName);
    debugLog("totalDistributionEntries", rupEntryItem?.distributionEntries?.length || 0);
    debugLog("filters", { semesterUUID: semesterFilter, academicYearId });
    debugLog("afterBothFilters", relevantDistributionEntries.length);
  });

  debugGroup("Distribution Entries Analysis", () => {
    debugLog(
      "rupEntryItem",
      rupEntryItem
        ? { id: rupEntryItem.id, moduleName: rupEntryItem.moduleName }
        : null
    );
    debugLog("academicYearId", academicYearId);
    debugLog("semesterFilter", semesterFilter);
    debugLog(
      "All distribution entries in rupEntryItem",
      rupEntryItem?.distributionEntries?.length || 0
    );
    debugLog(
      "rupEntryItem.distributionEntries (full):",
      rupEntryItem?.distributionEntries
    );
    debugLog(
      "Relevant distribution entries after filtering",
      relevantDistributionEntries.length
    );
    debugLog(
      "Relevant entries detail:",
      relevantDistributionEntries.map((e: any) => ({
        id: e.id,
        academicYearId: e.academicYearId,
        semesterId: e.semesterId,
        intermediateControlId: e.intermediateControlId,
        finalControlId: e.finalControlId,
        ...Object.keys(e).reduce((acc: any, key: string) => {
          if (
            ![
              "id",
              "academicYearId",
              "semesterId",
              "intermediateControlId",
              "finalControlId",
            ].includes(key)
          ) {
            acc[key] = e[key];
          }
          return acc;
        }, {}),
      }))
    );
  });

  const distributionIntermediateControlIds = Array.from(
    new Set(
      relevantDistributionEntries
        .map((entry: any) => entry.intermediateControlId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  const distributionFinalControlIds = Array.from(
    new Set(
      relevantDistributionEntries
        .map((entry: any) => entry.finalControlId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  if (DEBUG_JOURNAL_COLUMNS) console.log("[JournalTab] DEBUG - Extracted from distribution:", { distributionFinalControlIds });

  const scheduledIntermediateForYear =
    academicYearId &&
    typeof getScheduledIntermediateControlsByAcademicYear.value === "function"
      ? getScheduledIntermediateControlsByAcademicYear.value(academicYearId) ||
        []
      : [];

  const scheduledFinalForYear =
    academicYearId &&
    typeof getScheduledFinalControlsByAcademicYear.value === "function"
      ? getScheduledFinalControlsByAcademicYear.value(academicYearId) || []
      : [];

  if (DEBUG_JOURNAL_COLUMNS) {
    console.log("[JournalTab] 🔍 INTERMEDIATE CONTROLS DIAGNOSTIC:", {
      academicYearId,
      scheduledIntermediateCount: scheduledIntermediateForYear.length,
    });
    if (scheduledIntermediateForYear.length === 0) {
      console.warn(
        "⚠️ [JournalTab] NO INTERMEDIATE CONTROLS SCHEDULED FOR ACADEMIC YEAR:",
        academicYearId
      );
      if (scheduledIntermediateControls.value.length > 0) {
        const uniqueAcademicYears = Array.from(
          new Set(scheduledIntermediateControls.value.map((c: any) => c.academicYearId))
        );
        console.error("❌ [JournalTab] ACADEMIC YEAR MISMATCH DETECTED! IDs:", uniqueAcademicYears);
      }
    }
    console.log("[JournalTab] Scheduled final controls for year:", { academicYearId, count: scheduledFinalForYear.length });
  }

  // ALWAYS show intermediate controls (РК1, РК2) regardless of distribution,
  // but only the ones for this journal's semester (avoids showing the other
  // semester's РК as duplicate columns).
  const filteredScheduledIntermediate = scheduledIntermediateForYear.filter(
    (control: any) =>
      !semesterFilter ||
      control?.semesterId == null ||
      String(control.semesterId) === semesterFilter
  );

  // Only show final controls that are specified in distribution
  const filteredScheduledFinal = scheduledFinalForYear.filter(
    (control: any) => {
      if (distributionFinalControlIds.length === 0) {
        return false;
      }
      return (
        distributionFinalControlIds.includes(control.id) ||
        distributionFinalControlIds.includes(control.finalControlId)
      );
    }
  );

  if (DEBUG_JOURNAL_COLUMNS) console.log("[JournalTab] After filtering scheduled final controls:", { filteredCount: filteredScheduledFinal.length });

  const uniqueIds = (values: Array<string | null | undefined>) =>
    Array.from(
      new Set(
        values.filter((v): v is string => typeof v === "string" && v.length > 0)
      )
    );

  const intermediateControlIds = uniqueIds(
    filteredScheduledIntermediate.map(
      (control: any) =>
        control.intermediateControlId as string | null | undefined
    )
  );
  const finalControlIds = uniqueIds(
    filteredScheduledFinal.map(
      (control: any) => control.finalControlId as string | null | undefined
    )
  );

  if (DEBUG_JOURNAL_COLUMNS) {
    console.log("[JournalTab] 🔍 EXTRACTED CONTROL IDs:", { intermediateControlIds, finalControlIds });
    if (intermediateControlIds.length === 0 && scheduledIntermediateForYear.length > 0) {
      console.error("❌ [JournalTab] CRITICAL: intermediateControlIds is EMPTY but scheduled controls exist!");
    }
    console.log("[JournalTab] DEBUG - Extract from entries:", { distributionIntermediateControlIds, distributionFinalControlIds });
    console.log("[JournalTab] DEBUG - Extract from scheduled:", {
      filteredScheduledIntermediateCount: filteredScheduledIntermediate.length,
      filteredScheduledFinalCount: filteredScheduledFinal.length,
    });
  }

  debugGroup("Control IDs Collection", () => {
    debugLog("intermediateControlIds found:", intermediateControlIds);
    debugLog("intermediateControlIds count:", intermediateControlIds.length);
    debugLog("finalControlIds found:", finalControlIds);
    debugLog("finalControlIds count:", finalControlIds.length);
  });

  debugGroup("Scheduled Controls Lookup", () => {
    debugLog("academicYearId:", academicYearId);
    debugLog(
      "scheduledIntermediateForYear count:",
      scheduledIntermediateForYear.length
    );
    debugLog(
      "filteredScheduledIntermediate count:",
      filteredScheduledIntermediate.length
    );
    debugLog(
      "scheduledIntermediateForYear details:",
      scheduledIntermediateForYear.map((c: any) => ({
        id: c.id,
        intermediateControlId: c.intermediateControlId,
        shortName: c.shortName,
        startDate: c.startDate,
        endDate: c.endDate,
        academicYearId: c.academicYearId,
      }))
    );
    debugLog("filteredScheduledFinal count:", filteredScheduledFinal.length);
    debugLog("scheduledFinalForYear count:", scheduledFinalForYear.length);
  });

  const seenSessionIds = new Set<string>();
  const lastAssignedDatePosByControlKey = new Map<string, number>();

  const lastDatePos = dateMeta.length > 0 ? dateMeta.length - 1 : -1;

  const computeInsertAfter = (
    start: dayjs.Dayjs | null,
    end: dayjs.Dayjs | null,
    fallback: number
  ) => {
    if (!dateMeta.length) return -1;
    const effectiveStart = start;
    const effectiveEnd = end ?? start;
    const inRange = dateMeta
      .filter((meta) => {
        if (!meta.day) return false;
        const startsOk =
          !effectiveStart || !effectiveStart.isValid()
            ? true
            : !meta.day.isBefore(effectiveStart, "day");
        const endsOk =
          !effectiveEnd || !effectiveEnd.isValid()
            ? true
            : !meta.day.isAfter(effectiveEnd, "day");
        return startsOk && endsOk;
      })
      .map((meta) => meta.datePos);

    if (inRange.length > 0) {
      return Math.max(...inRange);
    }

    if (effectiveStart && effectiveStart.isValid()) {
      const before = dateMeta
        .filter((meta) => meta.day && meta.day.isBefore(effectiveStart, "day"))
        .map((meta) => meta.datePos);
      if (before.length > 0) {
        const maxBefore = Math.max(...before);
        const allBefore = before.length === dateMeta.length;
        if (allBefore) {
          return maxBefore + 1000;
        }
        return maxBefore;
      }
      // Control dated entirely before the first lesson (e.g. РК carrying the
      // wrong semester's dates) — append it after the lessons instead of
      // forcing it to the front of the grid.
      return lastDatePos >= 0 ? lastDatePos + 1000 : -1;
    }

    return fallback;
  };

  const collectSessionDateIndices = (
    start: dayjs.Dayjs | null,
    end: dayjs.Dayjs | null
  ) => {
    if (!dateMeta.length) return [] as number[];
    if (!start && !end) return [] as number[];
    return dateMeta
      .filter((meta) => {
        if (!meta.day) return false;
        if (start && start.isValid() && meta.day.isBefore(start, "day")) {
          return false;
        }
        if (end && end.isValid() && meta.day.isAfter(end, "day")) {
          return false;
        }
        return true;
      })
      .map((meta) => meta.datePos);
  };

  const registerScheduledControl = (
    type: "intermediate" | "final",
    controlId: string,
    rawControl: any
  ) => {
    if (!rawControl) return;
    if (seenSessionIds.has(rawControl.id)) return;

    const start = parseControlDate(rawControl.startDate);
    const end = parseControlDate(rawControl.endDate) || start;
    const insertAfterDatePos = computeInsertAfter(start, end, lastDatePos);
    const controlKey = `${type}:${controlId}`;
    const previousMax = lastAssignedDatePosByControlKey.get(controlKey) ?? -1;

    if (DEBUG_JOURNAL_COLUMNS) console.log(`[registerScheduledControl] Registering ${type}:`, { controlId, label: rawControl.shortName, insertAfterDatePos });

    let sessionDateIndices = collectSessionDateIndices(start, end)
      .filter((idx) => idx > previousMax)
      .filter((idx) => insertAfterDatePos < 0 || idx <= insertAfterDatePos);

    if (!sessionDateIndices.length && insertAfterDatePos >= 0) {
      sessionDateIndices = dateMeta
        .filter(
          (meta) =>
            meta.datePos > previousMax && meta.datePos <= insertAfterDatePos
        )
        .map((meta) => meta.datePos);
    }

    if (!sessionDateIndices.length) {
      sessionDateIndices = dateMeta
        .filter(
          (meta) =>
            meta.datePos > previousMax &&
            (insertAfterDatePos < 0 || meta.datePos <= insertAfterDatePos)
        )
        .map((meta) => meta.datePos);
    }

    if (!sessionDateIndices.length && insertAfterDatePos >= 0) {
      sessionDateIndices = [insertAfterDatePos];
    }

    if (!sessionDateIndices.length && dateMeta.length) {
      const nextMeta = dateMeta.find((meta) => meta.datePos > previousMax);
      sessionDateIndices = nextMeta
        ? [nextMeta.datePos]
        : [dateMeta[dateMeta.length - 1].datePos];
    }

    if (DEBUG_JOURNAL_COLUMNS) console.log(`[registerScheduledControl] Final:`, { type, label: rawControl.shortName, sessionDateIndices });

    if (sessionDateIndices.length) {
      lastAssignedDatePosByControlKey.set(
        controlKey,
        Math.max(previousMax, ...sessionDateIndices)
      );
    }

    const baseControl =
      type === "intermediate"
        ? typeof getIntermediateControlById.value === "function"
          ? getIntermediateControlById.value(controlId)
          : null
        : typeof getFinalControlById.value === "function"
        ? getFinalControlById.value(controlId)
        : null;

    const label =
      (rawControl.shortName || "").trim() ||
      baseControl?.shortName ||
      baseControl?.name ||
      (type === "intermediate" ? "ПК" : "Итог");

    const mark: Mark = {
      type: "session",
      label,
      values: initialValuesForType("session", 1),
      sessionId: rawControl.id,
      sessionDateIndices,
      controlType: type,
      controlId,
      scheduledControlId: rawControl.id,
    };

    const sortKey =
      start?.valueOf?.() ??
      Number.MAX_SAFE_INTEGER - (type === "final" ? 1 : 2);

    controlInsertions.push({
      mark,
      insertAfterDatePos,
      sortKey,
      secondarySortKey: String(rawControl.id ?? ""),
      debug: {
        type,
        controlId,
        scheduledControlId: rawControl.id,
        dateRange: [rawControl.startDate, rawControl.endDate],
        sessionDateIndices,
        insertAfterDatePos,
        sortKey,
      },
    });

    seenSessionIds.add(rawControl.id);
  };

  intermediateControlIds.forEach((controlId) => {
    const scheduled = filteredScheduledIntermediate
      .filter((control) => control.intermediateControlId === controlId)
      .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

    if (!scheduled.length) {
      debugLog(
        "No scheduled intermediate controls found for id",
        controlId,
        "in academicYear",
        academicYearId
      );
      debugLog(
        "DEBUG: All filteredScheduledIntermediate controls:",
        filteredScheduledIntermediate.map((c: any) => ({
          id: c.id,
          intermediateControlId: c.intermediateControlId,
          shortName: c.shortName,
          startDate: c.startDate,
          endDate: c.endDate,
        }))
      );
      return;
    }

    debugGroup(`Processing intermediate control: ${controlId}`, () => {
      debugLog("Found scheduled controls count:", scheduled.length);
      debugLog(
        "Scheduled controls:",
        scheduled.map((c: any) => ({
          id: c.id,
          intermediateControlId: c.intermediateControlId,
          shortName: c.shortName,
          startDate: c.startDate,
          endDate: c.endDate,
        }))
      );
    });

    scheduled.forEach((control) =>
      registerScheduledControl("intermediate", controlId, control)
    );
  });

  finalControlIds.forEach((controlId) => {
    const scheduled = filteredScheduledFinal
      .filter((control) => control.finalControlId === controlId)
      .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

    if (!scheduled.length) {
      debugLog(
        "Skipping final control column, no scheduled control found for id",
        controlId,
        "in academicYear",
        academicYearId
      );
      return;
    }

    scheduled.forEach((control) =>
      registerScheduledControl("final", controlId, control)
    );
  });

  controlInsertions
    .sort((a, b) => {
      if (a.insertAfterDatePos !== b.insertAfterDatePos) {
        return a.insertAfterDatePos - b.insertAfterDatePos;
      }
      if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
      return a.secondarySortKey.localeCompare(b.secondarySortKey);
    })
    .forEach(({ mark, insertAfterDatePos, debug }) => {
      let insertIndex = 0;
      if (insertAfterDatePos < 0) {
        insertIndex = 0;
      } else {
        let seenDates = -1;
        insertIndex = marksWithSessions.findIndex((m) => {
          if (m.type === "date") {
            seenDates += 1;
            if (seenDates === insertAfterDatePos) {
              return true;
            }
          }
          return false;
        });
        insertIndex =
          insertIndex === -1 ? marksWithSessions.length : insertIndex + 1;
      }

      debugGroup("insert control column", () => {
        debugLog("label", mark.label);
        debugLog("insertAfterDatePos", insertAfterDatePos);
        debugLog("insertIndex", insertIndex);
        debugLog("metadata", debug || {});
      });

      marksWithSessions.splice(insertIndex, 0, mark);
    });

  debugGroup("final marks template summary", () => {
    const summary = marksWithSessions.map((m, idx) => ({
      idx,
      type: (m as any).type,
      label: (m as any).label || (m as any).date || null,
      values: m.values?.length,
    }));
    debugLog("columns", summary);
  });

  if (DEBUG_JOURNAL_COLUMNS) {
    const sessionColumns = marksWithSessions.filter((m: any) => m.type === "session");
    console.log("[JournalTab] 🔍 FINAL COLUMNS SUMMARY:", {
      totalColumns: marksWithSessions.length,
      sessionColumns: sessionColumns.length,
    });
  }

  return marksWithSessions;
};

const getStudentIdByIndex = (index: number): string | null => {
  if (
    !currentJournal.value?.students ||
    index < 0 ||
    index >= currentJournal.value.students.length
  ) {
    return null;
  }
  return currentJournal.value.students[index];
};

const students = computed(() => {
  if (!props.journalId || !currentJournal.value?.students?.length) return [];

  const resolvedById = new Map(
    (props.resolvedParticipants ?? []).map((p) => [p.id, p]),
  );

  // O(1) lookup map for student marks to prevent O(N^2) fetching overhead
  const journalMarksEntry = marksStore.journalMarks[props.journalId];
  const marksMap = new Map();
  if (journalMarksEntry && journalMarksEntry.studentMarks) {
    for (const sm of journalMarksEntry.studentMarks) {
      marksMap.set(sm.studentId, sm.marks);
    }
  }

  return currentJournal.value.students.map(
    (studentId: string, index: number) => {
      const studentMarks = marksMap.get(studentId) || [];
      const resolved = resolvedById.get(studentId);
      const name = resolved
        ? `${resolved.surname} ${resolved.firstName} ${resolved.patronymic}`.trim()
        : getStudentFullName(studentId);
      return {
        id: index + 1,
        name: name === studentId ? "" : name,
        marks: studentMarks,
        studentId: studentId,
      };
    }
  );
});

// --- TIME SLICING OPTIMIZATION ---
const visibleStudentsCount = ref(15);
const displayedStudents = computed(() => {
  return students.value.slice(0, visibleStudentsCount.value);
});

let renderInterval: any = null;
const startChunkedRendering = () => {
  if (renderInterval) clearInterval(renderInterval);
  renderInterval = setInterval(() => {
    if (visibleStudentsCount.value >= students.value.length) {
      clearInterval(renderInterval);
      return;
    }
    visibleStudentsCount.value += 15;
  }, 50); // Yield thread every 15 students
};
// ---------------------------------

const marksByStudentId = computed(() => {
  const map = new Map<string, any>();
  for (const student of students.value) {
    map.set(student.studentId, student.marks);
  }
  return map;
});

const getMark = (studentIndex: number, colIndex: number, markIndex: number) => {
  return marksMatrix.value[studentIndex]?.[colIndex]?.[markIndex] ?? "";
};

const marksMatrix = computed(() => {
  const matrix: Record<number, Record<number, string[]>> = {};
  const canonical = canonicalTemplate.value;
  const numCols = canonical ? canonical.length : 0;
  
  // Precompute storeColIndex for each cIdx
  const colIndexMap: Record<number, number | null> = {};
  for (let cIdx = 0; cIdx < numCols; cIdx++) {
    colIndexMap[cIdx] = getStoreIndexForCanonicalIndex(cIdx);
  }
  
  const currentStudents = students.value;
  for (let sIdx = 0; sIdx < currentStudents.length; sIdx++) {
    const student = currentStudents[sIdx];
    matrix[sIdx] = {};
    if (!student || !props.journalId) continue;
    
    // Fill final summary column (-1)
    matrix[sIdx][-1] = [getStudentFinalGrade(student.studentId)];
    
    // Fill standard columns
    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      matrix[sIdx][cIdx] = [];
      const storeColIndex = colIndexMap[cIdx];
      const studentMarks = student.marks;
      if (!studentMarks || storeColIndex == null || storeColIndex < 0 || storeColIndex >= studentMarks.length) {
        continue;
      }
      
      const values = studentMarks[storeColIndex].values;
      for (let mIdx = 0; mIdx < values.length; mIdx++) {
        const val = values[mIdx];
        matrix[sIdx][cIdx][mIdx] = val === null ? "" : String(val ?? "");
      }
    }
  }
  return matrix;
});

const userEditInProgress = ref(false);

const isRetakeModalOpen = ref(false);
const handleRetakeSubmit = (data: any) => {
  console.log("Retake requested:", data);
};

// Direct mark update function - no debounce, immediate save
const updateMark = withEditPermission(async (
  studentIndex: number,
  colIndex: number,
  markIndex: number,
  value: string | null
) => {
  userEditInProgress.value = true;

  const studentId = getStudentIdByIndex(studentIndex);
  if (!studentId || !props.journalId) {
    userEditInProgress.value = false;
    return;
  }

  const storeColIndex = getStoreIndexForCanonicalIndex(colIndex);
  if (storeColIndex == null || storeColIndex < 0) {
    userEditInProgress.value = false;
    scheduleRebuildMarks();
    return;
  }

  await marksStore.updateStudentMark(
    props.journalId,
    studentId,
    storeColIndex,
    markIndex,
    value
  );

  emit("update-students", students.value);
  userEditInProgress.value = false;
});

const setMark = (
  studentIndex: number,
  colIndex: number,
  markIndex: number,
  value: string
) => {
  const studentId = getStudentIdByIndex(studentIndex);
  if (!studentId || !props.journalId) return;
  if (colIndex < 0) return;

  const newValue = value === "+" || value === "" ? null : value;

  // Direct store update - no debounce
  updateMark(studentIndex, colIndex, markIndex, newValue);
};

// Date validation functions removed, imported from @/utils/date

const handleCellClick = withEditPermission((
  studentIndex: number,
  colIndex: number,
  markIndex: number
) => {
  const currentMark = getMark(studentIndex, colIndex, markIndex);
  const hasExistingValue = currentMark !== "" && currentMark !== null;

  if (hasExistingValue) {
    confirmMarkEdit(currentMark, () => editCell(studentIndex, colIndex, markIndex));
  } else {
    // Empty cell, edit directly
    editCell(studentIndex, colIndex, markIndex);
  }
});

const editCell = withEditPermission((
  studentIndex: number,
  colIndex: number,
  markIndex: number
) => {
  const studentId = getStudentIdByIndex(studentIndex);
  if (!studentId || !props.journalId) return;
  if (colIndex < 0) return;

  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  const storeColIndex = getStoreIndexForCanonicalIndex(colIndex);
  if (!studentMarks || storeColIndex == null || storeColIndex < 0) return;

  const mark = studentMarks[storeColIndex];
  const markType = mark.type;
  const calculationType =
    props.journalSettings?.calculationType ||
    localJournalSettings.value.calculationType;
  // Only block editing for intermediate controls when in calculated mode
  // Final controls (like Экзамен) can always be edited manually
  if (markType === "session" && mark.controlType === "intermediate" && calculationType === "calculated") {
    return;
  }

  editingCell.value = { studentIndex, colIndex, markIndex };
  editedValue.value = getMark(studentIndex, colIndex, markIndex);
});

const confirmEdit = withEditPermission(() => {
  if (!editingCell.value) return;
  const { studentIndex, colIndex, markIndex } = editingCell.value;
  setMark(studentIndex, colIndex, markIndex, editedValue.value);
  editingCell.value = null;
});

const cancelEdit = () => {
  editingCell.value = null;
};

const navigate = withEditPermission(async (direction: "up" | "down" | "left" | "right") => {
  if (!editingCell.value) return;

  const {
    studentIndex: startStudent,
    colIndex: startCol,
    markIndex: startMark,
  } = editingCell.value;
  setMark(startStudent, startCol, startMark, editedValue.value);

  editingCell.value = null;

  nextTick(() => {
    let nextStudent = startStudent;
    let nextCol = startCol;
    let nextMark = startMark;

    const numStudents = students.value.length;
    const numCols = visibleHeaders.value.length;
    const getColRows = (col: number) => getCanonicalRows(col);
    const currentColRows = getColRows(startCol);

    switch (direction) {
      case "up":
        nextStudent -= 1;
        break;
      case "down":
        nextStudent += 1;
        break;
      case "right":
        if (nextMark < currentColRows - 1) {
          nextMark += 1;
        } else {
          nextMark = 0;
          nextCol += 1;
        }
        break;
      case "left":
        if (nextMark > 0) {
          nextMark -= 1;
        } else {
          nextCol -= 1;
          const targetRows = getColRows(
            ((nextCol % numCols) + numCols) % numCols
          );
          nextMark = Math.max(0, targetRows - 1);
        }
        break;
    }

    if (nextStudent < 0) nextStudent = numStudents - 1;
    if (nextStudent >= numStudents) nextStudent = 0;
    if (nextCol < 0) nextCol = numCols - 1;
    if (nextCol >= numCols) nextCol = 0;

    editCell(nextStudent, nextCol, nextMark);
  });
});

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

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && editingCell.value) {
    cancelEdit();
  }
};

const ktpViewPopoverOpened = ref(false);
const isHistoryDialogOpen = ref(false);
const ktpViewPopoverTarget = ref("");
const selectedKtpDetail = ref<KtpDetail | null>(null);

const effectiveSemesterIdForKtp = computed(() => {
  const eventSemester = currentEvent.value?.semester;
  if (eventSemester != null && String(eventSemester).length) {
    return String(eventSemester);
  }
  const activeSemester = academicYearSemesterStore.getActiveAcademicYearSemester as any;
  return activeSemester?.id ? String(activeSemester.id) : null;
});

const effectiveAcademicYearIdForKtp = computed(() => {
  const semesterId = effectiveSemesterIdForKtp.value;
  const semester =
    semesterId && typeof getAcademicYearSemesterById.value === "function"
      ? getAcademicYearSemesterById.value(semesterId)
      : null;
  return semester?.academicYearId || currentRupEntry.value?.academicYearId || null;
});

const localJournalSettings = ref({
  calculationType: props.journalSettings?.calculationType || "calculated",
  calculationMethod:
    props.journalSettings?.calculationMethod || "only-assigned",
  finalControlForm: props.journalSettings?.finalControlForm || "written" as "written" | "oral" | "mixed",
  finalGradeFormula: props.journalSettings?.finalGradeFormula || { intermediateWeight: 0.6, finalWeight: 0.4 },
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

/**
 * Get KTP detail for a specific header index.
 * Returns KtpDetail only if it exists and has a non-empty theme.
 * @param headerIndex - The index of the header in visibleHeaders
 * @returns KtpDetail if exists and has theme, null otherwise
 */
const getKtpForHeader = (headerIndex: number): KtpDetail | null => {
  const rupEntryId = currentJournal.value?.disciplineId;
  if (!rupEntryId) return null;

  const academicYearId = effectiveAcademicYearIdForKtp.value;
  const semesterId = effectiveSemesterIdForKtp.value;
  if (!academicYearId || !semesterId) return null;

  const ktpId = props.ktpId || null;
  if (!ktpId) return null;

  // Find dayIndex - position of this date among all date columns
  let dayIndex = 0;
  for (let i = 0; i < visibleHeaders.value.length; i++) {
    const h = visibleHeaders.value[i];
    if (h.index === headerIndex) break;
    if (h.type === "date") dayIndex++;
  }

  const details = ktpStore.getDetailsByKtpId(ktpId);
  const detail = details[dayIndex];

  // Check that KTP exists AND theme is not empty
  if (!detail || !detail.theme || detail.theme.trim() === "") {
    return null;
  }

  return detail;
};

const onPaperclipClick = async (
  header: { type: string; label: string },
  index: number
) => {
  if (header.type !== "date") return;

  // Find the date for this header to get KTP details
  const currentEventData = currentEvent.value;
  if (!currentEventData || !currentJournal.value?.disciplineId) return;

  // Get active semester info for fallback date range
  const activeSemester =
    academicYearSemesterStore.getActiveAcademicYearSemester;
  const semesterInfo: SemesterInfo | undefined = activeSemester
    ? {
        startDate: activeSemester.startDate,
        endDate: activeSemester.endDate,
      }
    : undefined;

  const days = getEventDays(currentEventData as any, semesterInfo);

  // Map the column index to actual day index
  // We need to find which day this column represents by looking at the visible headers
  const visibleHeader = visibleHeaders.value[index];
  if (!visibleHeader) return;

  // Find the actual day index by counting date columns up to this point
  let dayIndex = 0;
  for (let i = 0; i < visibleHeaders.value.length; i++) {
    const h = visibleHeaders.value[i];
    if (h.index === visibleHeader.index) break;
    if (h.type === "date") dayIndex++;
  }

  const dayData = days[dayIndex];
  if (!dayData) return;

  // Get KTP details using the ensured event-linked KTP.
  try {
    const ktpId = props.ktpId || null;
    if (!ktpId) return;

    const details = ktpStore.getDetailsByKtpId(ktpId);

    // Select the detail based on day index (0-based)
    const detailForDate = details[dayIndex] || null;

    selectedKtpDetail.value = detailForDate;
    ktpViewPopoverTarget.value = `#paperclip-${index}`;
    ktpViewPopoverOpened.value = true;
  } catch (error) {
    console.error("Error fetching KTP details:", error);
  }
};

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
const makeupRequestStore = useMakeupRequestStore();
const userStore = useUserStore();
const teacherStore = useTeacherStore();
const isMakeupRequestLoading = computed(() => makeupRequestStore.loading);

const journalDatesForMakeup = computed(() =>
  (canonicalTemplate.value ?? [])
    .filter((m: any) => m.type === "date" && m.isoDate)
    .map((m: any) => ({
      isoDate: m.isoDate as string,
      label: String(m.label).replace("\n", " "),
    }))
);

const onMakeupHoursClick = () => {
  f7.popover.open("#makeup-hours-popover", "#journal-tools-button");
};

const onMakeupHoursSave = async (data: MakeupHoursData) => {
  const userId = userStore.currentUser?.id;
  if (!userId) {
    f7.dialog.alert("Пользователь не авторизован");
    return;
  }

  const teacherId = currentEvent.value?.teacherId;
  if (!teacherId) {
    f7.dialog.alert("Преподаватель не найден");
    return;
  }

  try {
    await makeupRequestStore.createMakeupRequest({
      journalId: props.journalId,
      teacherId,
      createdBy: userId,
      reason: data.reason || undefined,
      dates: data.dates,
    });
    f7.toast
      .create({
        text: "Запрос на отработку часов отправлен на модерацию",
        position: "center",
        closeTimeout: 2500,
      })
      .open();
  } catch {
    f7.dialog.alert(
      makeupRequestStore.error ?? "Не удалось отправить запрос"
    );
  }
};

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

const getStoreIndexForDatePosition = (datePos: number): number | null => {
  const canonical = canonicalTemplate.value as any[] | undefined;
  if (!canonical || datePos < 0) return null;
  let seen = -1;
  for (let ci = 0; ci < canonical.length; ci++) {
    if ((canonical[ci] as any)?.type === "date") {
      seen += 1;
      if (seen === datePos) {
        return getStoreIndexForCanonicalIndex(ci);
      }
    }
  }
  return null;
};

const computeDayAverage = (
  studentId: string,
  datePos: number
): number | null => {
  if (!studentId || !props.journalId) return null;
  const storeColIndex = getStoreIndexForDatePosition(datePos);

  console.log("[computeDayAverage] Processing:", {
    studentId,
    datePos,
    storeColIndex,
  });

  if (storeColIndex == null || storeColIndex < 0) {
    console.warn("[computeDayAverage] Invalid store column index:", storeColIndex);
    return null;
  }
  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks || storeColIndex >= studentMarks.length) {
    console.warn("[computeDayAverage] No student marks or column out of bounds:", {
      hasMarks: !!studentMarks,
      storeColIndex,
      marksLength: studentMarks?.length,
    });
    return null;
  }
  const values = studentMarks[storeColIndex]?.values || [];
  const nums = values
    .map((v) =>
      v !== null && v !== "" && !isNaN(Number(v)) ? Number(v) : null
    )
    .filter((v): v is number => v !== null);

  console.log("[computeDayAverage] Result:", {
    datePos,
    storeColIndex,
    rawValues: values,
    valuesDetailed: values.map((v, i) => ({
      index: i,
      value: v,
      type: typeof v,
      isNull: v === null,
      isEmpty: v === "",
      isNumeric: !isNaN(Number(v)),
      asNumber: Number(v)
    })),
    nums,
    numsLength: nums.length,
    avg: nums.length > 0 ? nums.reduce((s, v) => s + v, 0) / nums.length : null,
  });

  if (nums.length === 0) return null;
  const avg = nums.reduce((s, v) => s + v, 0) / nums.length;
  return avg;
};

const computeSessionGradeForStudent = (
  studentId: string,
  sessionDateIndices: number[],
  method: "only-assigned" | "all-days"
): string | null => {
  console.log("[computeSessionGradeForStudent] Called with:", {
    studentId,
    sessionDateIndices,
    method,
    sessionDateIndicesLength: sessionDateIndices.length,
  });

  if (sessionDateIndices.length === 0) {
    console.warn("[computeSessionGradeForStudent] sessionDateIndices is empty, returning null");
    return null;
  }

  if (method === "all-days") {
    const totalDays = sessionDateIndices.length;
    if (totalDays === 0) return null;
    let sum = 0;
    const dayAverages: Array<{ idx: number; avg: number | null }> = [];
    sessionDateIndices.forEach((idx) => {
      const dayAvg = computeDayAverage(studentId, idx);
      dayAverages.push({ idx, avg: dayAvg });
      sum += dayAvg ?? 0;
    });
    console.log("[computeSessionGradeForStudent] all-days method:", {
      totalDays,
      dayAverages,
      sum,
      grade: (sum / totalDays).toFixed(1),
    });
    const grade = sum / totalDays;
    return grade.toFixed(1);
  }

  // only-assigned
  let sum = 0;
  let count = 0;
  const dayAverages: Array<{ idx: number; avg: number | null }> = [];
  sessionDateIndices.forEach((idx) => {
    const dayAvg = computeDayAverage(studentId, idx);
    dayAverages.push({ idx, avg: dayAvg });
    if (dayAvg !== null) {
      sum += dayAvg;
      count += 1;
    }
  });

  console.log("[computeSessionGradeForStudent] only-assigned method:", {
    sessionDateIndices,
    dayAverages,
    sum,
    count,
    grade: count > 0 ? (sum / count).toFixed(1) : null,
  });

  if (count === 0) {
    console.warn("[computeSessionGradeForStudent] No valid marks found in date range, returning null");
    return null;
  }
  const grade = sum / count;
  return grade.toFixed(1);
};

const computeAllSessionGrades = async (opts?: {
  force?: boolean;
  labels?: Array<string | RegExp>;
  studentIds?: string[];
}) => {
  const force = !!opts?.force;
  const calculationType =
    props.journalSettings?.calculationType ||
    localJournalSettings.value.calculationType ||
    "calculated";

  console.log("[computeAllSessionGrades] Starting calculation:", {
    force,
    calculationType,
    hasLabels: !!opts?.labels,
    labels: opts?.labels,
  });

  if (!props.journalId) {
    console.warn("[computeAllSessionGrades] No journal ID, exiting");
    return;
  }
  if (!force && calculationType !== "calculated") {
    console.warn("[computeAllSessionGrades] Not forced and calculationType is not 'calculated', exiting");
    return;
  }

  // IMPORTANT: Intermediate controls (РК1, РК2) should ONLY be computed manually
  // when the user clicks the "Расчитать" button (force: true)
  // Automatic computation should NOT compute intermediate controls
  if (!force) {
    console.warn("[computeAllSessionGrades] Not forced - skipping automatic computation of intermediate controls");
    return;
  }

  const canonical = canonicalTemplate.value;
  if (!Array.isArray(canonical) || canonical.length === 0) {
    console.warn("[computeAllSessionGrades] No canonical template, exiting");
    return;
  }

  const matchesLabel = (label: string | undefined) => {
    if (!opts?.labels || opts.labels.length === 0) return true;
    const safeLabel = label || "";
    return opts.labels.some((rule) =>
      typeof rule === "string" ? rule === safeLabel : rule.test(safeLabel)
    );
  };

  const calculationMethod =
    props.journalSettings?.calculationMethod ||
    localJournalSettings.value.calculationMethod ||
    "only-assigned";

  console.log("[computeAllSessionGrades] Using calculation method:", calculationMethod);

  const sessionColumns = canonical
    .map((mark, canonicalIndex) => ({ mark, canonicalIndex }))
    .filter(({ mark }) =>
      mark?.type === "session" &&
      mark?.controlType === "intermediate" &&
      matchesLabel(mark.label)
    );

  console.log("[computeAllSessionGrades] Found session columns:", {
    totalCanonical: canonical.length,
    sessionColumnsCount: sessionColumns.length,
    sessionColumns: sessionColumns.map(({ mark, canonicalIndex }) => ({
      canonicalIndex,
      type: mark?.type,
      label: mark?.label,
      controlType: mark?.controlType,
      sessionDateIndices: mark?.sessionDateIndices,
    })),
  });

  if (sessionColumns.length === 0) {
    console.warn("[computeAllSessionGrades] No session columns found, exiting");
    return;
  }

  let allStudents = marksStore.getJournalStudentMarks(props.journalId);
  if (!Array.isArray(allStudents) || allStudents.length === 0) {
    console.warn("[computeAllSessionGrades] No students found, exiting");
    return;
  }

  // Filter by selected student IDs if provided
  const filteredStudents = opts?.studentIds
    ? allStudents.filter(s => opts.studentIds!.includes(s.studentId))
    : allStudents;

  console.log("[computeAllSessionGrades] Processing students:", {
    totalStudents: allStudents.length,
    filteredStudents: filteredStudents.length,
    hasStudentFilter: !!opts?.studentIds,
  });

  // Collect all update promises to await them together
  const updatePromises: Promise<boolean>[] = [];

  sessionColumns.forEach(({ mark, canonicalIndex }) => {
    const sessionMark = mark as Mark;
    const dateIndices = Array.isArray(sessionMark.sessionDateIndices)
      ? sessionMark.sessionDateIndices
      : [];
    const storeIndex = getStoreIndexForCanonicalIndex(canonicalIndex);

    console.log("[computeAllSessionGrades] Processing session column:", {
      canonicalIndex,
      label: mark?.label,
      controlType: mark?.controlType,
      dateIndices,
      storeIndex,
    });

    if (storeIndex == null || storeIndex < 0) {
      console.warn("[computeAllSessionGrades] Invalid store index for column, skipping:", {
        canonicalIndex,
        storeIndex,
      });
      return;
    }

    filteredStudents.forEach((studentMark) => {
      const grade = computeSessionGradeForStudent(
        studentMark.studentId,
        dateIndices,
        calculationMethod
      );

      const existingValue =
        studentMark.marks?.[storeIndex]?.values?.[0] ?? null;

      console.log("[computeAllSessionGrades] Student grade computed:", {
        studentId: studentMark.studentId,
        canonicalIndex,
        label: mark?.label,
        grade,
        existingValue,
        willUpdate: existingValue !== grade,
      });

      if (existingValue === grade) return;

      // Queue the update and collect the promise
      const updatePromise = marksStore.updateStudentMark(
        props.journalId!,
        studentMark.studentId,
        storeIndex,
        0,
        grade
      );
      updatePromises.push(updatePromise);
    });
  });

  // Wait for all session grade updates to complete before returning
  await Promise.all(updatePromises);

  console.log("[computeAllSessionGrades] Completed:", {
    totalUpdates: updatePromises.length,
  });
};

/**
 * Check if all intermediate and final controls are calculated for a student.
 * A control is considered "calculated" if it has at least one non-empty value.
 * @param studentId - The ID of the student to check
 * @returns true if all controls have grades, false otherwise
 */
const areAllControlsCalculated = (studentId: string): boolean => {
  if (!props.journalId) return false;

  // Get list of all controls from canonical template
  const canonical = canonicalTemplate.value;
  if (!Array.isArray(canonical) || canonical.length === 0) {
    // If no template, consider all calculated (nothing to check)
    return true;
  }

  // Filter only intermediate and final controls
  const controlColumns = canonical.filter((col): col is Mark => {
    return (
      col.type === "session" &&
      (col.controlType === "intermediate" || col.controlType === "final")
    );
  });

  // If no controls, consider all calculated
  if (controlColumns.length === 0) {
    return true;
  }

  // Get student's marks
  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks) {
    // No marks - controls not calculated
    return false;
  }

  // For each control, check if there's a non-empty grade
  for (const controlCol of controlColumns) {
    // Find corresponding mark in studentMarks
    const correspondingMark = studentMarks.find((mark: Mark) => {
      if (mark.type !== "session") return false;

      // Match by scheduledControlId (most accurate)
      if (
        controlCol.scheduledControlId &&
        mark.scheduledControlId === controlCol.scheduledControlId
      ) {
        return true;
      }

      // Alternatively by sessionId
      if (controlCol.sessionId && mark.sessionId === controlCol.sessionId) {
        return true;
      }

      // Alternatively by label (less reliable, but fallback)
      if (controlCol.label && mark.label === controlCol.label) {
        return true;
      }

      return false;
    });

    // If no corresponding mark found - control not calculated
    if (!correspondingMark) {
      return false;
    }

    // Check that there's at least one non-empty value
    const hasNonEmptyValue = correspondingMark.values.some(
      (value) => value !== null && value !== undefined && value !== ""
    );

    if (!hasNonEmptyValue) {
      return false;
    }
  }

  // All controls calculated
  return true;
};

const getStudentAverageScore = (studentId: string): string => {
  if (!props.journalId) return "—";

  const studentMarks = marksByStudentId.value.get(studentId);
  if (!studentMarks) return "—";

  const allMarks: (string | null)[] = [];

  // Collect all marks from all columns
  studentMarks.forEach((mark: any) => {
    mark.values.forEach((value: any) => {
      if (value !== null && value !== "") {
        allMarks.push(value);
      }
    });
  });

  // Filter out non-numeric values and convert to numbers
  const numericMarks = allMarks
    .filter((mark) => mark && !isNaN(Number(mark)))
    .map((mark) => Number(mark));

  if (numericMarks.length === 0) {
    return "—"; // Em dash for no scores
  }

  const average =
    numericMarks.reduce((sum, mark) => sum + mark, 0) / numericMarks.length;
  return average.toFixed(1);
};

const getStudentFinalGrade = (studentId: string): string => {
  if (!props.journalId) return "—";

  const studentMarks = marksByStudentId.value.get(studentId);
  if (!studentMarks) return "—";

  const canonical = canonicalTemplate.value || [];

  // Find all intermediate control columns (РК1, РК2, etc.)
  const intermediateControlColumns = canonical
    .map((mark: any, index: number) => ({ mark, index }))
    .filter(({ mark }) => mark?.type === "session" && mark?.controlType === "intermediate");

  // Find all final control columns (Экзамен/Зачет/etc.)
  const finalControlColumns = canonical
    .map((mark: any, index: number) => ({ mark, index }))
    .filter(({ mark }) => mark?.type === "session" && mark?.controlType === "final");

  // If no intermediate controls are scheduled, return "—"
  if (intermediateControlColumns.length === 0) {
    return "—";
  }

  // Check if student has values for ALL intermediate controls
  const rkGrades: number[] = [];

  for (const { mark, index: canonicalIndex } of intermediateControlColumns) {
    const storeColIndex = getStoreIndexForCanonicalIndex(canonicalIndex);

    if (storeColIndex == null || storeColIndex < 0) {
      return "—";
    }

    if (storeColIndex >= studentMarks.length) {
      return "—";
    }

    const markValues = studentMarks[storeColIndex].values;
    const rkValue = markValues?.[0];

    if (rkValue === null || rkValue === "" || rkValue === undefined) {
      return "—";
    }

    // Try to parse as number
    const numericValue = Number(rkValue);
    if (isNaN(numericValue)) {
      return "—";
    }

    rkGrades.push(numericValue);
  }

  // If we collected fewer grades than expected, some РК are missing
  if (rkGrades.length < intermediateControlColumns.length) {
    return "—";
  }

  // 1) (РК1 + РК2) / 2 = итоговая (если нет экзамена/зачета)
  // 2) Если есть итоговый контроль (экзамен/зачет):
  //    итог = avg(РК) * 0.6 + оценка_экзамена * 0.4
  const rkAverage = rkGrades.reduce((sum, grade) => sum + grade, 0) / rkGrades.length;

  if (finalControlColumns.length === 0) {
    return rkAverage.toFixed(1);
  }

  const finalGrades: number[] = [];
  for (const { mark, index: canonicalIndex } of finalControlColumns) {
    const storeColIndex = getStoreIndexForCanonicalIndex(canonicalIndex);

    if (storeColIndex == null || storeColIndex < 0) continue;
    if (storeColIndex >= studentMarks.length) continue;

    const markValues = studentMarks[storeColIndex].values;
    const finalValue = markValues?.[0];

    if (finalValue === null || finalValue === "" || finalValue === undefined) {
      continue;
    }

    const numericValue = Number(finalValue);
    if (isNaN(numericValue)) {
      continue;
    }

    finalGrades.push(numericValue);
  }

  if (finalGrades.length === 0) {
    return "—";
  }

  const finalControlAverage =
    finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length;
    
  const intWeight = localJournalSettings.value.finalGradeFormula?.intermediateWeight ?? 0.6;
  const finWeight = localJournalSettings.value.finalGradeFormula?.finalWeight ?? 0.4;
  const weighted = rkAverage * intWeight + finalControlAverage * finWeight;

  return weighted.toFixed(1);
};

const tableHeaders = computed(() => {
  const canonical = canonicalTemplate.value || [];
  return canonical.map((mark: any, index: number) => ({
    type: mark.type,
    label: headerLabelFor(mark),
    index,
    dynamicRows: getCanonicalRows(index),
    isoDate: mark.isoDate,
  }));
});

const visibleHeaders = computed(() => {
  const baseHeaders = tableHeaders.value
    .map((header, displayIndex) => ({
      ...header,
      displayIndex,
      isFinalSummary: false,
    }))
    .filter(
      (h) => h.type !== "date" || (h.label && String(h.label).trim() !== "")
    );

  const finalHeader = {
    type: "final-summary",
    label: FINAL_SUMMARY_LABEL,
    index: -1,
    displayIndex: baseHeaders.length,
    isFinalSummary: true,
    dynamicRows: 1,
  };

  return [...baseHeaders, finalHeader];
});
// Canonical template derived from current event/sessions/schedules
const canonicalTemplate = computed(() => generateDates());

const getCanonicalRows = (canonicalCol: number): number => {
  if (canonicalCol < 0) return 1;
  const col = canonicalTemplate.value?.[canonicalCol];
  return Array.isArray(col?.values) ? col.values.length : 2;
};

const getRowIndices = (canonicalCol: number): number[] => {
  const n = getCanonicalRows(canonicalCol);
  return Array.from({ length: n }, (_, i) => i);
};

// Map canonical column index to current store column index (using first student's marks)
const getStoreIndexForCanonicalIndex = (
  canonicalCol: number
): number | null => {
  if (canonicalCol == null || canonicalCol < 0) return null;
  const canonical = canonicalTemplate.value?.[canonicalCol] as any;
  if (!canonical) return null;
  const firstStudentId = getStudentIdByIndex(0);
  if (!firstStudentId || !props.journalId) return null;
  const studentMarks =
    marksStore.getStudentMarks(props.journalId, firstStudentId) || [];
  const findBy = (predicate: (m: any) => boolean) =>
    studentMarks.findIndex(predicate);
  if (canonical.type === "date") {
    const iso = canonical.isoDate;
    if (!iso) return null;
    return findBy((m: any) => m.type === "date" && m.isoDate === iso);
  }
  if (canonical.type === "session") {
    const sessionId = canonical.sessionId;
    if (sessionId) {
      return findBy(
        (m: any) => m.type === "session" && m.sessionId === sessionId
      );
    }
    const label = canonical.label;
    return findBy((m: any) => m.type === "session" && m.label === label);
  }
  // Fallback by type
  return findBy((m: any) => m.type === canonical.type);
};
watch(
  () => visibleHeaders.value,
  (headers) => {
    debugGroup("visibleHeaders changed", () => {
      debugLog(
        "headers",
        headers.map((h) => ({ index: h.index, type: h.type, label: h.label }))
      );
    });
  },
  { deep: true, immediate: true }
);

const visibleColumnIndices = computed(() => {
  return visibleHeaders.value.map((h) => h.index);
});

// Increased delay from 150ms to 500ms to ensure user edits (300ms) complete first
const scheduleRecomputeSessionGrades = debounce(async () => {
  await computeAllSessionGrades();
}, 500);

watch(
  () => JSON.stringify(props.journalSettings),
  () => {
    scheduleRecomputeSessionGrades();
  }
);

// Rebuild marks when sessions list changes (ensures session columns appear on load)
const rebuildMarks = async () => {
  if (!(props.journalId && currentJournal.value?.students?.length)) return;

  // If user is editing, wait for completion
  if (userEditInProgress.value) {
    console.log("[JournalTab] Deferring rebuildMarks - user edit in progress");
    // Wait for current update to complete
    await nextTick();
  }

  // Initialize journal in backend if needed
  const event = currentEvent.value;
  const semester = academicYearSemesterStore.getActiveAcademicYearSemester;
  
  if (event && semester) {
    try {
      await marksStore.initializeJournalBackend(
        props.journalId,
        currentJournal.value.disciplineId,
        currentJournal.value.group,
        semester.academicYearId,
        semester.id,
        currentJournal.value.students
      );
    } catch (err) {
      console.warn("[JournalTab] Failed to initialize journal in backend:", err);
      // Continue anyway - marks will work locally
    }
  }

  const markTemplate = generateDates();
  marksStore.initializeJournalMarks(
    props.journalId,
    currentJournal.value.students,
    markTemplate
  );
  
  // Load marks from backend to merge with the template
  try {
    console.log("[JournalTab] Loading marks from backend for journal:", props.journalId);
    console.time(`journal-tab-load-marks-${props.journalId}`);
    await marksStore.loadJournalMarks(props.journalId);
    console.timeEnd(`journal-tab-load-marks-${props.journalId}`);
    console.log("[JournalTab] Marks loaded successfully from backend");
  } catch (err) {
    console.timeEnd(`journal-tab-load-marks-${props.journalId}`);
    console.warn("[JournalTab] Failed to load marks from backend:", err);
    // Continue - marks will work with local template
  }
  
  scheduleRecomputeSessionGrades();
  console.timeEnd(`journal-tab-mounted-${props.journalId}`);
};

const scheduleRebuildMarks = debounce(() => {
  rebuildMarks();
}, 250);

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
const updateStudent = async (updatedStudent: any) => {
  if (!updatedStudent || !props.journalId) return;

  // Update marks in store
  if (updatedStudent.marks) {
    marksStore.updateStudentMarks(
      props.journalId,
      updatedStudent.studentId,
      updatedStudent.marks
    );
  }
  scheduleRecomputeSessionGrades();
};

const updateStudents = async (updatedStudents: any[]) => {
  if (updatedStudents && props.journalId) {
    // Update all students' marks in store
    const studentMarksToUpdate = updatedStudents.map((student) => ({
      studentId: student.studentId,
      marks: student.marks,
    }));

    marksStore.updateMultipleStudentMarks(
      props.journalId,
      studentMarksToUpdate
    );
    scheduleRecomputeSessionGrades();
  }
};

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
  window.addEventListener("keydown", handleGlobalKeydown);
});

onUpdated(() => {
  // Empty
});

onUnmounted(() => {
  if (renderInterval) clearInterval(renderInterval);
  window.removeEventListener("keydown", handleGlobalKeydown);
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
