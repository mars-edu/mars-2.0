<template>
  <div>
    <div class="mb-3 flex flex-wrap gap-2 items-center justify-end">
      <f7-button
        small
        default
        @click="onOpenRupClick"
        class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
      >
        <f7-icon
          ios="f7:doc_text"
          md="material:description"
          size="16px"
          class="mr-2"
        />
        РУП
      </f7-button>
      <f7-button
        id="journal-settings-button"
        small
        default
        @click="onSettingsClick"
        class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
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
        id="journal-history-button"
        small
        default
        @click="onHistoryClick"
        class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
      >
        <f7-icon
          ios="f7:clock"
          md="material:history"
          size="16px"
          class="mr-2"
        />
        История
      </f7-button>
      <f7-button
        small
        default
        @click="onCloseJournalClick"
        class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
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
        class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
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
        class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
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
        class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
      >
        <f7-icon ios="f7:share" md="material:share" size="16px" class="mr-2" />
        Поделится
      </f7-button>
      <f7-button
        id="recalc-button"
        small
        default
        @click.stop="onRecalcClick"
        class="bg-gray-200 text-gray-700 hover:bg-primary hover:text-white transition-colors"
      >
        Рассчитать
      </f7-button>
    </div>

    <!-- Academic Year Mismatch Warning Banner -->
    <div
      v-if="academicYearMismatchInfo"
      class="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded-md"
      role="alert"
    >
      <div class="flex items-start">
        <f7-icon
          ios="f7:exclamationmark_triangle"
          md="material:warning"
          size="24px"
          class="text-yellow-600 mr-3 flex-shrink-0"
        />
        <div class="flex-1">
          <h3 class="font-semibold text-lg mb-2">
            Промежуточный контроль не настроен для этого учебного года
          </h3>
          <p class="mb-2">
            Колонки промежуточного контроля (РК1, РК2 и т.д.) не отображаются, потому что в
            расписании не настроены промежуточные контроли для учебного года
            {{ academicYearMismatchInfo.usingSemesterYear ? 'семестра' : 'дисциплины' }} этого журнала.
          </p>
          <div class="bg-white p-3 rounded border border-yellow-200 mb-3">
            <p class="text-sm mb-1">
              <strong>ID учебного года {{ academicYearMismatchInfo.usingSemesterYear ? '(из семестра)' : '(из РУП)' }}:</strong>
              <code class="bg-gray-100 px-2 py-1 rounded text-xs ml-1">
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
                <code class="bg-gray-100 px-2 py-1 rounded text-xs ml-1">{{ yearId }}</code>
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

    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-muted/50">
            <th class="p-2 text-left w-12 border-r border-border align-top">
              №
            </th>
            <th
              class="p-2 text-left w-12 border-r border-border align-top min-w-[250px]"
            >
              Обучающийся
            </th>
            <!-- Dynamic date columns -->
            <th
              v-for="(header, index) in visibleHeaders"
              :key="header.isFinalSummary ? 'final-summary' : header.index"
              class="px-1 py-2 text-center text-xs border-r border-border w-16 min-w-[56px]"
              :class="[
                header.isFinalSummary
                  ? 'bg-primary/10 text-primary font-semibold cursor-default'
                  : 'cursor-pointer hover:bg-muted',
                {
                  'bg-muted/50 text-muted-foreground':
                    header.type === 'session',
                },
              ]"
              @click="
                !header.isFinalSummary && header.index >= 0
                  ? openDateFocus(header, header.index)
                  : null
              "
            >
              <div class="flex flex-col items-center">
                <f7-icon
                  v-if="header.type === 'date' && getKtpForHeader(header.index) !== null"
                  f7="paperclip"
                  class="h-8 text-gray-400"
                  @click.stop="onPaperclipClick(header, index)"
                  :id="`paperclip-${index}`"
                ></f7-icon>
                <span v-html="header.label.replace('\n', '<br/>')"></span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(student, studentIndex) in students"
            :key="student.id"
            class="border-b border-border"
          >
            <td
              class="px-2 py-2 text-center border-r border-border text-sm align-top"
            >
              {{ studentIndex + 1 }}
            </td>
            <td
              class="px-2 py-2 border-r border-border text-sm align-top cursor-pointer hover:bg-muted/50 transition-colors min-w-[250px]"
              @click="showFloatingRow(student, studentIndex)"
            >
              <div class="flex items-center justify-between">
                <span>{{ student.name }}</span>
                <div
                  class="ml-2 px-2 py-1 rounded-full text-xs font-medium text-white min-w-[24px] text-center"
                  :class="
                    getScoreBadgeClass(
                      getStudentAverageScore(student.studentId)
                    )
                  "
                >
                  {{ getStudentAverageScore(student.studentId) }}
                </div>
              </div>
            </td>
            <td
              v-for="(header, vColIdx) in visibleHeaders"
              :key="header.isFinalSummary ? 'final-summary' : header.index"
              class="px-1 py-2 text-center border-r border-border min-w-[56px]"
              :class="[
                header.isFinalSummary ? 'bg-primary/5' : '',
                {
                  'bg-muted/90': header.type === 'session',
                  'bg-gray-100 cursor-not-allowed': header.type === 'date' && header.isoDate && isFutureDate(header.isoDate),
                },
              ]"
            >
              <div class="flex flex-col gap-1">
                <div
                  v-for="mIdx in getRowIndices(header.index)"
                  :key="mIdx"
                  class="h-8 flex items-center justify-center transition-transform duration-300"
                  :class="{
                    'scale-175 z-10':
                      editingCell?.studentIndex === studentIndex &&
                      editingCell?.colIndex === header.index &&
                      editingCell?.markIndex === mIdx,
                  }"
                >
                  <EditableMarkCell
                    v-if="
                      editingCell?.studentIndex === studentIndex &&
                      editingCell?.colIndex === header.index &&
                      editingCell?.markIndex === mIdx
                    "
                    v-model="editedValue"
                    @confirm="confirmEdit"
                    @cancel="cancelEdit"
                    @navigate="navigate"
                    :is-zoomed="true"
                  />
                  <div
                    v-else
                    @click="
                      !header.isFinalSummary
                        ? handleCellClick(studentIndex, header.index, mIdx)
                        : null
                    "
                    :class="[
                      header.isFinalSummary ? 'w-full' : 'cursor-pointer w-full',
                      {
                        'cursor-not-allowed': header.type === 'date' && header.isoDate && isFutureDate(header.isoDate),
                      }
                    ]"
                  >
                    <MarkCell
                      :mark="getMark(studentIndex, header.index, mIdx)"
                    />
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- KtpDetailViewPopover -->
    <KtpDetailViewPopover
      v-model:opened="ktpViewPopoverOpened"
      :target="ktpViewPopoverTarget"
      :detail="selectedKtpDetail"
    />

    <!-- Journal History Popover -->
    <JournalHistoryPopover
      :journal-id="props.journalId"
    />

    <!-- Journal Settings Popover (moved here for correct positioning) -->
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
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-foreground">
              Тип расчета сессии
            </h3>

            <div class="space-y-3">
              <div class="space-y-2">
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="calculation-type"
                    value="calculated"
                    v-model="localJournalSettings.calculationType"
                    class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                  />
                  <span class="text-sm text-foreground">Расчитываемая</span>
                </label>

                <div
                  v-if="localJournalSettings.calculationType === 'calculated'"
                  class="ml-7 space-y-2"
                >
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="calculation-method"
                      value="only-assigned"
                      v-model="localJournalSettings.calculationMethod"
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
                      v-model="localJournalSettings.calculationMethod"
                      class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                    />
                    <span class="text-sm text-muted-foreground">Всех дней</span>
                  </label>
                </div>
              </div>

              <div>
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="calculation-type"
                    value="manual"
                    v-model="localJournalSettings.calculationType"
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
    <!-- Recalculate Popover -->
    <f7-popover
      id="recalc-popover"
      style="width: 260px !important"
      close-on-escape
      target="#recalc-button"
    >
      <div class="bg-card text-card-foreground">
        <div class="p-3 border-b border-border text-sm font-medium">
          Выберите расчёт
        </div>
        <div class="p-2 space-y-2">
          <f7-button small fill @click="recalcSessions" class="w-full">
            Сессии
          </f7-button>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from "vue";
import { debounce } from "es-toolkit";
import dayjs from "dayjs";
import {
  DATE_DAY_MONTH_FORMAT,
  DATE_YEAR_FORMAT,
  DATE_STORAGE_FORMAT,
} from "@/constants/calendar";
import { getEventDays, type SemesterInfo } from "@/utils/eventDate";
import { f7, f7Icon, f7Button } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import MarkCell from "@/components/ui/MarkCell.vue";
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";
import KtpDetailViewPopover from "@/components/KtpDetailViewPopover.vue";
import JournalHistoryPopover from "@/components/JournalHistoryPopover.vue";
import { useCalendarStore } from "@/stores/calendarStore";
import { useStudentStore } from "@/stores/studentStore";
import { useMarksStore } from "@/stores/marksStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import { useJournalStore } from "@/stores/journalStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useClass9Store, type Class9Data } from "@/stores/class9Store";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { trpcClient } from "@/lib/trpcClient";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { storeToRefs } from "pinia";
import type { Mark } from "@/types/marks";
import type { EducationSchedule } from "@/stores/educationScheduleStore";
import type { StudentWithMarks } from "@/types/student";

// Central source of truth for mark types and helpers
const MARK_TYPES = [
  { type: "date", defaultLabel: null, singleRow: false },
  { type: "session", defaultLabel: null, singleRow: true },
] as const;

type MarkType = (typeof MARK_TYPES)[number]["type"];

const MARK_TYPE_MAP: Readonly<Record<MarkType, (typeof MARK_TYPES)[number]>> =
  Object.freeze(Object.fromEntries(MARK_TYPES.map((d) => [d.type, d])) as any);

const initialValuesForType = (type: MarkType, dynamicRows: number) =>
  MARK_TYPE_MAP[type]?.singleRow
    ? [null]
    : Array.from({ length: Math.max(1, dynamicRows) }, () => null);

const headerLabelFor = (mark: any): string => {
  if (mark.type === "date") return mark.date || "";
  if (mark.label) return mark.label;
  const def = MARK_TYPE_MAP[mark.type as MarkType];
  return (def?.defaultLabel ?? "") as string;
};

const exportHeaderLabelFor = (mark: any): string => {
  if (mark.type === "date") {
    const iso = mark?.isoDate;
    if (iso) {
      const parsed = dayjs(iso, DATE_STORAGE_FORMAT, true);
      if (parsed.isValid()) {
        return parsed.format("DD.MM.YYYY");
      }
    }
    const label = headerLabelFor(mark);
    return typeof label === "string" ? label.replace(/\n/g, " ").trim() : "";
  }
  const label = headerLabelFor(mark);
  return typeof label === "string" ? label.replace(/\n/g, " ").trim() : "";
};

interface Props {
  journalId: string;
  journalSettings?: {
    calculationType: "calculated" | "manual";
    calculationMethod: "only-assigned" | "all-days";
  };
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
  download: [];
  upload: [];
  share: [];
  "save-journal-settings": [any];
}>();

const calendarStore = useCalendarStore();
const studentStore = useStudentStore();
const { getStudentFullName } = studentStore;
const marksStore = useMarksStore();
const educationScheduleStore = useEducationScheduleStore();
const ktpStore = useKtpStore();
const journalStore = useJournalStore();
const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const class9Store = useClass9Store();
const intermediateControlStore = useIntermediateControlStore();
const finalControlStore = useFinalControlStore();
const scheduledIntermediateControlStore =
  useScheduledIntermediateControlStore();
const scheduledFinalControlStore = useScheduledFinalControlStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);
const { getClass9ById, class9Items } = storeToRefs(class9Store);
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

const currentJournal = computed(() => {
  if (!props.journalId) return null;
  return journalStore.getJournalById(props.journalId);
});
const DEBUG_JOURNAL_COLUMNS = true;
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

const currentClass9 = computed(() => {
  const class9Id =
    currentJournal.value?.disciplineId || currentEvent.value?.class9Id;
  if (!class9Id) return null;
  const lookup = getClass9ById.value;
  if (typeof lookup !== "function") return null;
  return (lookup(class9Id) as Class9Data | null | undefined) ?? null;
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
  const academicYearId = currentSemester?.academicYearId || currentClass9.value?.academicYearId;

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

const timeToMinutes = (time: string | undefined | null) => {
  if (!time || typeof time !== "string") return null;
  const parts = time.split(":");
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const normalizeTime = (time?: string) => {
  if (!time) return time;
  const parts = time.split(":");
  if (parts.length < 2) return time;
  const hh = String(Number(parts[0])).padStart(2, "0");
  const mm = String(Number(parts[1])).padStart(2, "0");
  return `${hh}:${mm}`;
};

const findScheduleIdByStartTime = (
  schedules: EducationSchedule[],
  startTime: string
) => {
  const normalized = normalizeTime(startTime);
  const exact = schedules.find(
    (s) => normalizeTime(s.startTime) === normalized
  );
  if (exact) return exact.id;
  const targetMin = timeToMinutes(normalized) ?? 0;
  const candidate = schedules
    .map((s) => ({ s, start: timeToMinutes(s.startTime) ?? 0 }))
    .filter((x) => x.start >= targetMin)
    .sort((a, b) => a.start - b.start)[0]?.s;
  return candidate?.id || schedules[0]?.id;
};

const findScheduleIdByEndTime = (
  schedules: EducationSchedule[],
  endTime: string
) => {
  const normalized = normalizeTime(endTime);
  const exact = schedules.find((s) => normalizeTime(s.endTime) === normalized);
  if (exact) return exact.id;
  const targetMin = timeToMinutes(normalized) ?? 24 * 60;
  const candidate = schedules
    .map((s) => ({ s, end: timeToMinutes(s.endTime) ?? 0 }))
    .filter((x) => x.end <= targetMin)
    .sort((a, b) => b.end - a.end)[0]?.s;
  return candidate?.id || schedules[schedules.length - 1]?.id;
};

const resolveScheduleIds = (
  daySchedule: any,
  schedules: EducationSchedule[]
): { startId?: string; endId?: string } => {
  let startId = daySchedule?.startId as string | undefined;
  let endId = daySchedule?.endId as string | undefined;
  if ((!startId || !endId) && daySchedule) {
    if (!startId && daySchedule?.startTime) {
      startId = findScheduleIdByStartTime(schedules, daySchedule.startTime);
    }
    if (!endId && daySchedule?.endTime) {
      endId = findScheduleIdByEndTime(schedules, daySchedule.endTime);
    }
  }
  return { startId, endId };
};

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
  const class9Item = currentClass9.value as
    | (ReturnType<NonNullable<typeof getClass9ById.value>> & {
        distributionEntries?: any[];
      })
    | null;
  const semesterFilter = event?.semester ? String(event.semester) : null;

  // Get academic year from semester (for intermediate/final controls)
  // instead of from discipline/РУП (class9Item)
  const currentSemester =
    semesterFilter && typeof getAcademicYearSemesterById.value === "function"
      ? getAcademicYearSemesterById.value(semesterFilter)
      : null;
  const academicYearId = currentSemester?.academicYearId || class9Item?.academicYearId;
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

  const relevantDistributionEntries = (class9Item?.distributionEntries || [])
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

  // Debug: Log distribution entries filtering in detail
  console.log("[JournalTab] РУП Distribution Entries Analysis:", {
    disciplineId: class9Item?.id,
    disciplineName: class9Item?.moduleName,
    totalDistributionEntries: class9Item?.distributionEntries?.length || 0,
    allDistributionEntries: class9Item?.distributionEntries?.map((e: any) => ({
      id: e.id,
      academicYearId: e.academicYearId,
      semesterId: e.semesterId,
      intermediateControlId: e.intermediateControlId,
      finalControlId: e.finalControlId,
    })),
    filters: {
      semesterUUID: semesterFilter,
      academicYearId,
    },
    matching: {
      info: "Entries match only by UUID: entry.semesterId === semesterUUID",
    },
    afterSemesterFilter: (class9Item?.distributionEntries || []).filter(
      (entry: any) => {
        if (!semesterFilter) return true;
        if (entry?.semesterId == null) return false;
        return String(entry.semesterId) === semesterFilter;
      }
    ).length,
    afterBothFilters: relevantDistributionEntries.length,
    relevantDistributionEntries: relevantDistributionEntries.map((e: any) => ({
      id: e.id,
      academicYearId: e.academicYearId,
      semesterId: e.semesterId,
      intermediateControlId: e.intermediateControlId,
      finalControlId: e.finalControlId,
    })),
  });

  debugGroup("Distribution Entries Analysis", () => {
    debugLog(
      "class9Item",
      class9Item
        ? { id: class9Item.id, moduleName: class9Item.moduleName }
        : null
    );
    debugLog("academicYearId", academicYearId);
    debugLog("semesterFilter", semesterFilter);
    debugLog(
      "All distribution entries in class9Item",
      class9Item?.distributionEntries?.length || 0
    );
    debugLog(
      "class9Item.distributionEntries (full):",
      class9Item?.distributionEntries
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

  console.log("[JournalTab] DEBUG - Extracted from distribution:", {
    distributionFinalControlIds,
    allDistributionEntries: relevantDistributionEntries.map((e: any) => {
      const finalControl =
        typeof getFinalControlById.value === "function"
          ? getFinalControlById.value(e.finalControlId)
          : null;
      return {
        id: e.id,
        finalControlId: e.finalControlId,
        finalControlName: finalControl?.name,
        finalControlShortName: finalControl?.shortName,
      };
    }),
  });

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

  // 🔍 DIAGNOSTIC: Check intermediate controls availability
  console.log("[JournalTab] 🔍 INTERMEDIATE CONTROLS DIAGNOSTIC:", {
    academicYearId,
    academicYearSource: currentSemester
      ? `semester (${currentSemester.id})`
      : "class9/РУП fallback",
    class9ItemExists: !!class9Item,
    class9AcademicYearId: class9Item?.academicYearId,
    semesterId: semesterFilter,
    semesterAcademicYearId: currentSemester?.academicYearId,
    scheduledIntermediateCount: scheduledIntermediateForYear.length,
    scheduledIntermediateDetails: scheduledIntermediateForYear.map((c: any) => ({
      id: c.id,
      intermediateControlId: c.intermediateControlId,
      shortName: c.shortName,
      startDate: c.startDate,
      endDate: c.endDate,
      academicYearId: c.academicYearId,
    })),
  });

  if (scheduledIntermediateForYear.length === 0) {
    console.warn(
      "⚠️ [JournalTab] NO INTERMEDIATE CONTROLS SCHEDULED FOR ACADEMIC YEAR:",
      academicYearId,
      "\n  This is why intermediate control columns (РК1, РК2, etc.) are NOT appearing!",
      "\n  To fix: Go to Education Schedule page → expand 'Промежуточный контроль' → add scheduled controls for this academic year"
    );

    // Show ALL scheduled controls in the store to diagnose academic year mismatch
    console.log("🔍 [JournalTab] ALL SCHEDULED INTERMEDIATE CONTROLS IN STORE:", {
      totalCount: scheduledIntermediateControls.value.length,
      allControls: scheduledIntermediateControls.value.map((c: any) => ({
        id: c.id,
        academicYearId: c.academicYearId,
        intermediateControlId: c.intermediateControlId,
        shortName: c.shortName,
        startDate: c.startDate,
        endDate: c.endDate,
      })),
    });

    if (scheduledIntermediateControls.value.length > 0) {
      const uniqueAcademicYears = Array.from(
        new Set(scheduledIntermediateControls.value.map((c: any) => c.academicYearId))
      );
      console.error(
        "❌ [JournalTab] ACADEMIC YEAR MISMATCH DETECTED!",
        "\n  Journal's academic year ID:",
        academicYearId,
        "\n  Scheduled controls exist for academic year IDs:",
        uniqueAcademicYears,
        "\n  FIX: Update the journal's class9 discipline to use the correct academic year ID,",
        "\n       OR add scheduled controls for academic year ID",
        academicYearId
      );
    }
  }

  console.log("[JournalTab] Scheduled final controls for year:", {
    academicYearId,
    count: scheduledFinalForYear.length,
    controls: scheduledFinalForYear.map((c: any) => {
      const finalControl =
        typeof getFinalControlById.value === "function"
          ? getFinalControlById.value(c.finalControlId)
          : null;
      return {
        id: c.id,
        finalControlId: c.finalControlId,
        finalControlName: finalControl?.name,
        finalControlShortName: finalControl?.shortName,
        shortName: c.shortName,
      };
    }),
  });

  // ALWAYS show intermediate controls (РК1, РК2) regardless of distribution
  const filteredScheduledIntermediate = scheduledIntermediateForYear;

  // Only show final controls that are specified in distribution
  const filteredScheduledFinal = scheduledFinalForYear.filter(
    (control: any) => {
      console.log("[JournalTab] Checking scheduled final control:", {
        controlId: control.id,
        finalControlId: control.finalControlId,
        distributionFinalControlIds,
        includesById: distributionFinalControlIds.includes(control.id),
        includesByFinalControlId: distributionFinalControlIds.includes(
          control.finalControlId
        ),
      });

      if (distributionFinalControlIds.length === 0) {
        return false;
      }
      return (
        distributionFinalControlIds.includes(control.id) ||
        distributionFinalControlIds.includes(control.finalControlId)
      );
    }
  );

  console.log("[JournalTab] After filtering scheduled final controls:", {
    filteredCount: filteredScheduledFinal.length,
    scheduled: scheduledFinalForYear.map((c: any) => ({
      id: c.id,
      finalControlId: c.finalControlId,
    })),
    filtered: filteredScheduledFinal.map((c: any) => ({
      id: c.id,
      finalControlId: c.finalControlId,
    })),
  });

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

  // 🔍 DIAGNOSTIC: Check extracted control IDs
  console.log("[JournalTab] 🔍 EXTRACTED CONTROL IDs:", {
    intermediateControlIds,
    intermediateControlIdsCount: intermediateControlIds.length,
    finalControlIds,
    finalControlIdsCount: finalControlIds.length,
  });

  if (intermediateControlIds.length === 0 && scheduledIntermediateForYear.length > 0) {
    console.error(
      "❌ [JournalTab] CRITICAL: Scheduled intermediate controls exist but intermediateControlIds is EMPTY!",
      "\n  scheduledIntermediateForYear:",
      scheduledIntermediateForYear,
      "\n  This means intermediate controls are missing 'intermediateControlId' field!",
      "\n  Check the data structure in scheduledIntermediateControlStore"
    );
  }

  console.log("[JournalTab] DEBUG - Extract from entries:", {
    relevantDistributionEntriesControlIds: relevantDistributionEntries.map(
      (e: any) => ({
        id: e.id,
        intermediateControlId: e.intermediateControlId,
        finalControlId: e.finalControlId,
      })
    ),
    distributionIntermediateControlIds,
    distributionFinalControlIds,
  });

  console.log("[JournalTab] DEBUG - Extract from scheduled:", {
    scheduledIntermediateForYear: scheduledIntermediateForYear.map(
      (c: any) => ({
        id: c.id,
        intermediateControlId: c.intermediateControlId,
      })
    ),
    scheduledFinalForYear: scheduledFinalForYear.map((c: any) => ({
      id: c.id,
      finalControlId: c.finalControlId,
    })),
    filteredScheduledIntermediateCount: filteredScheduledIntermediate.length,
    filteredScheduledFinalCount: filteredScheduledFinal.length,
  });

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
      return -1;
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

  // 🔍 DIAGNOSTIC: Final column summary
  const sessionColumns = marksWithSessions.filter((m: any) => m.type === "session");
  const intermediateColumns = sessionColumns.filter((m: any) =>
    m.sessionType === "intermediate"
  );
  const finalColumns = sessionColumns.filter((m: any) =>
    m.sessionType === "final"
  );

  console.log("[JournalTab] 🔍 FINAL COLUMNS SUMMARY:", {
    totalColumns: marksWithSessions.length,
    dateColumns: marksWithSessions.filter((m: any) => m.type === "date").length,
    sessionColumns: sessionColumns.length,
    intermediateControlColumns: intermediateColumns.length,
    intermediateControlLabels: intermediateColumns.map((m: any) => m.label),
    finalControlColumns: finalColumns.length,
    finalControlLabels: finalColumns.map((m: any) => m.label),
  });

  if (intermediateColumns.length === 0) {
    console.warn(
      "⚠️ [JournalTab] NO INTERMEDIATE CONTROL COLUMNS were created!",
      "\n  Check the diagnostics above to see why."
    );
  } else {
    console.log(
      "✅ [JournalTab] Successfully created",
      intermediateColumns.length,
      "intermediate control columns:",
      intermediateColumns.map((m: any) => m.label).join(", ")
    );
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

  return currentJournal.value.students.map(
    (studentId: string, index: number) => {
      const studentMarks = marksStore.getStudentMarks(
        props.journalId,
        studentId
      );
      return {
        id: index + 1,
        name: getStudentFullName(studentId),
        marks: studentMarks || [],
        studentId: studentId,
      };
    }
  );
});

const getMark = (studentIndex: number, colIndex: number, markIndex: number) => {
  const studentId = getStudentIdByIndex(studentIndex);
  if (!studentId || !props.journalId) return "";

  if (colIndex < 0) {
    // Final summary column - use getStudentFinalGrade instead of average
    return markIndex === 0 ? getStudentFinalGrade(studentId) : "";
  }

  // Map canonical column index to store column index
  const storeColIndex = getStoreIndexForCanonicalIndex(colIndex);
  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks || storeColIndex == null || storeColIndex < 0) return "";
  if (storeColIndex >= studentMarks.length) return "";

  const mark = studentMarks[storeColIndex].values[markIndex];
  if (mark === null) return "";
  return String(mark ?? "");
};

// Pending updates map for optimistic UI (no longer needed with direct tRPC)
const userEditInProgress = ref(false);

// Direct mark update function - no debounce, immediate save
const updateMark = async (
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
};

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

// Utility function to check if a date is in the future
const isFutureDate = (isoDate: string | undefined): boolean => {
  if (!isoDate) return false;
  const today = dayjs().startOf('day');
  const cellDate = dayjs(isoDate, DATE_STORAGE_FORMAT);
  return cellDate.isAfter(today);
};

const handleCellClick = (
  studentIndex: number,
  colIndex: number,
  markIndex: number
) => {
  const currentMark = getMark(studentIndex, colIndex, markIndex);
  const hasExistingValue = currentMark !== "" && currentMark !== null;

  if (hasExistingValue) {
    // Show confirmation dialog for existing values
    f7.dialog.create({
      title: 'Изменить оценку?',
      text: `Текущая оценка: ${currentMark}. Вы действительно хотите изменить её?`,
      buttons: [
        {
          text: 'Нет',
          close: true,
        },
        {
          text: 'Да',
          bold: true,
          onClick: () => {
            editCell(studentIndex, colIndex, markIndex);
          }
        }
      ],
      verticalButtons: false,
    }).open();
  } else {
    // Empty cell, edit directly
    editCell(studentIndex, colIndex, markIndex);
  }
};

const editCell = (
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

  const markType = studentMarks[storeColIndex].type;
  const calculationType =
    props.journalSettings?.calculationType ||
    localJournalSettings.value.calculationType;
  if (markType === "session" && calculationType === "calculated") {
    return;
  }

  // Check if this is a future date
  const mark = studentMarks[storeColIndex];
  if (mark.type === "date" && mark.isoDate && isFutureDate(mark.isoDate)) {
    f7.toast.create({
      text: 'Нельзя выставлять оценки за будущие даты',
      position: 'center',
      closeTimeout: 2000,
    }).open();
    return;
  }

  editingCell.value = { studentIndex, colIndex, markIndex };
  editedValue.value = getMark(studentIndex, colIndex, markIndex);
};

const confirmEdit = () => {
  if (!editingCell.value) return;
  const { studentIndex, colIndex, markIndex } = editingCell.value;
  setMark(studentIndex, colIndex, markIndex, editedValue.value);
  editingCell.value = null;
};

const cancelEdit = () => {
  editingCell.value = null;
};

const navigate = async (direction: "up" | "down" | "left" | "right") => {
  if (!editingCell.value) return;

  const {
    studentIndex: startStudent,
    colIndex: startCol,
    markIndex: startMark,
  } = editingCell.value;
  setMark(startStudent, startCol, startMark, editedValue.value);

  // No need to flush - updates are immediate with tRPC
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

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && editingCell.value) {
    cancelEdit();
  }
};

const ktpViewPopoverOpened = ref(false);
const ktpViewPopoverTarget = ref("");
const selectedKtpDetail = ref<KtpDetail | null>(null);

const localJournalSettings = ref({
  calculationType: props.journalSettings?.calculationType || "calculated",
  calculationMethod:
    props.journalSettings?.calculationMethod || "only-assigned",
});

const closeJournalSettings = () => {
  f7.popover.close("#journal-settings-popover");
};

const saveJournalSettings = () => {
  emit("save-journal-settings", localJournalSettings.value);
  closeJournalSettings();
};

/**
 * Get KTP detail for a specific header index.
 * Returns KtpDetail only if it exists and has a non-empty theme.
 * @param headerIndex - The index of the header in visibleHeaders
 * @returns KtpDetail if exists and has theme, null otherwise
 */
const getKtpForHeader = (headerIndex: number): KtpDetail | null => {
  const class9Id = currentJournal.value?.disciplineId;
  if (!class9Id) return null;

  // Find dayIndex - position of this date among all date columns
  let dayIndex = 0;
  for (let i = 0; i < visibleHeaders.value.length; i++) {
    const h = visibleHeaders.value[i];
    if (h.index === headerIndex) break;
    if (h.type === "date") dayIndex++;
  }

  // Get KTP details for the discipline
  const details = ktpStore.getDetailsByClass9Id(class9Id);
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

  // Get KTP details using class9Id from currentJournal
  try {
    const class9Id = currentJournal.value.disciplineId;
    const details = ktpStore.getDetailsByClass9Id(class9Id);

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
const onHistoryClick = () => {
  f7.popover.open('#journal-history-popover', '#journal-history-button');
};
const onCloseJournalClick = () => emit("close-journal");
const onDownloadClick = () => emit("download");
const onUploadClick = () => emit("upload");
const onShareClick = () => emit("share");
const onRecalcClick = () => {
  f7.popover.open("#recalc-popover", "#recalc-button");
};

const recalcSessions = async () => {
  await computeAllSessionGrades({ force: true });
  f7.popover.close("#recalc-popover");
};

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
  if (storeColIndex == null || storeColIndex < 0) return null;
  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks || storeColIndex >= studentMarks.length) return null;
  const values = studentMarks[storeColIndex]?.values || [];
  const nums = values
    .map((v) =>
      v !== null && v !== "" && !isNaN(Number(v)) ? Number(v) : null
    )
    .filter((v): v is number => v !== null);
  if (nums.length === 0) return null;
  const avg = nums.reduce((s, v) => s + v, 0) / nums.length;
  return avg;
};

const computeSessionGradeForStudent = (
  studentId: string,
  sessionDateIndices: number[],
  method: "only-assigned" | "all-days"
): string | null => {
  if (sessionDateIndices.length === 0) return null;

  if (method === "all-days") {
    const totalDays = sessionDateIndices.length;
    if (totalDays === 0) return null;
    let sum = 0;
    sessionDateIndices.forEach((idx) => {
      const dayAvg = computeDayAverage(studentId, idx);
      sum += dayAvg ?? 0;
    });
    const grade = sum / totalDays;
    return grade.toFixed(1);
  }

  // only-assigned
  let sum = 0;
  let count = 0;
  sessionDateIndices.forEach((idx) => {
    const dayAvg = computeDayAverage(studentId, idx);
    if (dayAvg !== null) {
      sum += dayAvg;
      count += 1;
    }
  });
  if (count === 0) return null;
  const grade = sum / count;
  return grade.toFixed(1);
};

const computeAllSessionGrades = async (opts?: {
  force?: boolean;
  labels?: Array<string | RegExp>;
}) => {
  const force = !!opts?.force;
  const calculationType =
    props.journalSettings?.calculationType ||
    localJournalSettings.value.calculationType ||
    "calculated";

  if (!props.journalId) return;
  if (!force && calculationType !== "calculated") return;

  const canonical = canonicalTemplate.value;
  if (!Array.isArray(canonical) || canonical.length === 0) return;

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

  const sessionColumns = canonical
    .map((mark, canonicalIndex) => ({ mark, canonicalIndex }))
    .filter(({ mark }) => mark?.type === "session" && matchesLabel(mark.label));

  if (sessionColumns.length === 0) return;

  const students = marksStore.getJournalStudentMarks(props.journalId);
  if (!Array.isArray(students) || students.length === 0) return;

  // Collect all update promises to await them together
  const updatePromises: Promise<boolean>[] = [];

  sessionColumns.forEach(({ mark, canonicalIndex }) => {
    const sessionMark = mark as Mark;
    const dateIndices = Array.isArray(sessionMark.sessionDateIndices)
      ? sessionMark.sessionDateIndices
      : [];
    const storeIndex = getStoreIndexForCanonicalIndex(canonicalIndex);
    if (storeIndex == null || storeIndex < 0) return;

    students.forEach((studentMark) => {
      const grade = computeSessionGradeForStudent(
        studentMark.studentId,
        dateIndices,
        calculationMethod
      );

      const existingValue =
        studentMark.marks?.[storeIndex]?.values?.[0] ?? null;
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
  const controlColumns = canonical.filter((col: Mark) => {
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

  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks) return "—";

  const allMarks: (string | null)[] = [];

  // Collect all marks from all columns
  studentMarks.forEach((mark) => {
    mark.values.forEach((value) => {
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

  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks) return "—";

  const canonical = canonicalTemplate.value || [];

  // DEBUG: Log all canonical columns to understand the structure
  console.log("[getStudentFinalGrade] All canonical columns:", {
    totalColumns: canonical.length,
    columns: canonical.map((mark: any, index: number) => ({
      index,
      type: mark?.type,
      controlType: mark?.controlType,
      label: mark?.label,
      shortName: mark?.shortName,
      // Show all keys to understand structure
      allKeys: Object.keys(mark || {}),
      fullMark: mark,
    })),
  });

  // Find all intermediate control columns (РК1, РК2, etc.)
  const intermediateControlColumns = canonical
    .map((mark: any, index: number) => ({ mark, index }))
    .filter(({ mark }) => mark?.type === "session" && mark?.controlType === "intermediate");

  console.log("[getStudentFinalGrade] Debug info:", {
    studentId,
    intermediateControlColumnsCount: intermediateControlColumns.length,
    intermediateControlColumns: intermediateControlColumns.map(({ mark, index }) => ({
      index,
      label: mark?.label,
      controlType: mark?.controlType,
      type: mark?.type,
    })),
  });

  // If no intermediate controls are scheduled, return "—"
  if (intermediateControlColumns.length === 0) {
    console.log("[getStudentFinalGrade] No intermediate controls found, returning —");
    return "—";
  }

  // Check if student has values for ALL intermediate controls
  const rkGrades: number[] = [];

  for (const { mark, index: canonicalIndex } of intermediateControlColumns) {
    const storeColIndex = getStoreIndexForCanonicalIndex(canonicalIndex);

    console.log("[getStudentFinalGrade] Checking РК column:", {
      canonicalIndex,
      storeColIndex,
      label: mark?.label,
    });

    if (storeColIndex == null || storeColIndex < 0) {
      console.log("[getStudentFinalGrade] Store column not found, returning —");
      return "—";
    }

    if (storeColIndex >= studentMarks.length) {
      console.log("[getStudentFinalGrade] Store column out of bounds, returning —");
      return "—";
    }

    const markValues = studentMarks[storeColIndex].values;

    console.log("[getStudentFinalGrade] Mark values:", {
      storeColIndex,
      markValues,
      firstValue: markValues?.[0],
    });

    // Get the first value from the РК column (usually there's only one value per session)
    const rkValue = markValues?.[0];

    if (rkValue === null || rkValue === "" || rkValue === undefined) {
      console.log("[getStudentFinalGrade] РК value is empty, returning —");
      return "—";
    }

    // Try to parse as number
    const numericValue = Number(rkValue);
    if (isNaN(numericValue)) {
      console.log("[getStudentFinalGrade] РК value is not a number, returning —", { rkValue });
      return "—";
    }

    console.log("[getStudentFinalGrade] Found valid РК grade:", numericValue);
    rkGrades.push(numericValue);
  }

  // If we collected fewer grades than expected, some РК are missing
  if (rkGrades.length < intermediateControlColumns.length) {
    console.log("[getStudentFinalGrade] Not all РК collected, returning —", {
      collected: rkGrades.length,
      expected: intermediateControlColumns.length,
    });
    return "—";
  }

  // Calculate average of РК grades only
  const average = rkGrades.reduce((sum, grade) => sum + grade, 0) / rkGrades.length;
  console.log("[getStudentFinalGrade] Calculated final grade:", {
    rkGrades,
    average: average.toFixed(1),
  });
  return average.toFixed(1);
};

const getScoreBadgeClass = (score: string): string => {
  if (score === "—") {
    return "bg-gray-400";
  }

  const numScore = parseFloat(score);

  if (numScore >= 4.5) {
    return "bg-emerald-500"; // Green for excellent (5-4.5)
  } else if (numScore >= 3.5) {
    return "bg-gradient-to-r from-yellow-400 to-emerald-500"; // Yellow-green gradient for good (4.4-3.5)
  } else if (numScore >= 2.5) {
    return "bg-yellow-500"; // Yellow for satisfactory (3.4-2.5)
  } else {
    return "bg-red-500"; // Red for poor (below 2.5)
  }
};

const tableHeaders = computed(() => {
  const canonical = canonicalTemplate.value || [];
  return canonical.map((mark: any, index: number) => ({
    type: mark.type,
    label: headerLabelFor(mark),
    index,
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
  () => props.journalSettings,
  () => {
    scheduleRecomputeSessionGrades();
  },
  { deep: true }
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
    await marksStore.loadJournalMarks(props.journalId);
    console.log("[JournalTab] Marks loaded successfully from backend");
  } catch (err) {
    console.warn("[JournalTab] Failed to load marks from backend:", err);
    // Continue - marks will work with local template
  }
  
  scheduleRecomputeSessionGrades();
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
  () => getActiveYearSchedules.value,
  () => {
    scheduleRebuildMarks();
  },
  { deep: true }
);

watch(
  () => scheduledIntermediateControls.value,
  () => {
    scheduleRebuildMarks();
  },
  { deep: true }
);

watch(
  () => scheduledFinalControls.value,
  () => {
    scheduleRebuildMarks();
  },
  { deep: true }
);

watch(
  () => currentClass9.value?.distributionEntries,
  () => {
    scheduleRebuildMarks();
  },
  { deep: true }
);
const updateStudent = async (updatedStudent: any) => {
  if (!updatedStudent || !props.journalId) return;

  // No need to flush - updates are immediate with tRPC

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
    // No need to flush - updates are immediate with tRPC

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
});

onMounted(() => {
  scheduleRebuildMarks();
  window.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
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
