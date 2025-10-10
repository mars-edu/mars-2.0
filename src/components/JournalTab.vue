<template>
  <div>
    <div class="mb-3 flex flex-wrap gap-2 items-center justify-end">
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
              :key="header.index"
              class="px-1 py-2 text-center text-xs border-r border-border w-16 min-w-[56px] cursor-pointer hover:bg-muted"
              :class="{
                'bg-muted/50 text-muted-foreground':
                  header.type === 'session' ||
                  header.type === 'pk' ||
                  header.type === 'e' ||
                  header.type === 'z' ||
                  header.type === 'ku',
              }"
              @click="openDateFocus(header, header.index)"
            >
              <div class="flex flex-col items-center">
                <f7-icon
                  v-if="header.type === 'date'"
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
              :key="header.index"
              class="px-1 py-2 text-center border-r border-border min-w-[56px]"
              :class="{
                'bg-muted/90':
                  header.type === 'session' ||
                  header.type === 'pk' ||
                  header.type === 'e' ||
                  header.type === 'z' ||
                  header.type === 'ku',
              }"
            >
              <div class="flex flex-col gap-1">
                <div
                  v-for="mIdx in getRowIndices(vColIdx)"
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
                    @click="editCell(studentIndex, header.index, mIdx)"
                    class="cursor-pointer w-full"
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
          <f7-button small fill @click="recalcRk1" class="w-full"
            >РК1</f7-button
          >
          <f7-button small fill @click="recalcRk2" class="w-full"
            >РК2</f7-button
          >
          <f7-button small fill @click="recalcFinal" class="w-full"
            >Итоговую</f7-button
          >
          <f7-button small fill @click="recalcAll" class="w-full"
            >Все</f7-button
          >
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
import { getEventDays } from "@/utils/eventDate";
import { f7, f7Icon, f7Button } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import MarkCell from "@/components/ui/MarkCell.vue";
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";
import KtpDetailViewPopover from "@/components/KtpDetailViewPopover.vue";
import { useCalendarStore } from "@/stores/calendarStore";
import { useStudentStore } from "@/stores/studentStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useMarksStore } from "@/stores/marksStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import { useJournalStore } from "@/stores/journalStore";
import { useClass9Store } from "@/stores/class9Store";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { storeToRefs } from "pinia";
import type { Mark } from "@/types/marks";
import type { EducationSchedule } from "@/stores/educationScheduleStore";
import type { StudentWithMarks } from "@/types/student";

// Central source of truth for mark types and helpers
const MARK_TYPES = [
  { type: "date", defaultLabel: null, singleRow: false },
  { type: "session", defaultLabel: "Сессия", singleRow: true },
  { type: "pk", defaultLabel: "РК", singleRow: true },
  { type: "e", defaultLabel: "Э", singleRow: true },
  { type: "z", defaultLabel: "З", singleRow: true },
  { type: "i", defaultLabel: "И", singleRow: true },
  { type: "ku", defaultLabel: "КУ", singleRow: true },
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
  if (mark.type === "session")
    return mark.label || MARK_TYPE_MAP.session.defaultLabel || "";
  const def = MARK_TYPE_MAP[mark.type as MarkType];
  return (def?.defaultLabel ?? "") as string;
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
const sessionStore = useSessionStore();
const marksStore = useMarksStore();
const educationScheduleStore = useEducationScheduleStore();
const ktpStore = useKtpStore();
const journalStore = useJournalStore();
const class9Store = useClass9Store();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);
const { getActiveAcademicYearSemester } = storeToRefs(
  academicYearSemesterStore
);

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

const currentEvent = computed(() => {
  if (!props.journalId) return null;
  return calendarStore.getEventById(props.journalId);
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
  const days = getEventDays(currentEvent.value as any);

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

  // Inject session columns after session end dates if overlapping with journal days
  const sessionStore = useSessionStore();
  let marksWithSessions: Mark[] = [...dateMarks];

  const sessions = sessionStore.sortedSessions as unknown as Array<{
    id: string;
    shortName: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  }>;

  // Build insertion plan
  const insertionPlan: Array<{
    insertAfter: number;
    session: any;
    indices: number[];
  }> = [];

  debugGroup("sessions overlap analysis", () => {
    debugLog(
      "sessions",
      sessions.map((s) => ({
        id: s.id,
        shortName: s.shortName,
        startDate: s.startDate,
        endDate: s.endDate,
      }))
    );
  });

  sessions.forEach((session) => {
    const indices: number[] = [];
    dateMarks.forEach((m, i) => {
      const iso = m.isoDate;
      if (!iso) return;
      if (iso >= session.startDate && iso <= session.endDate) {
        indices.push(i);
      }
    });
    if (indices.length > 0) {
      debugLog("session indices", {
        shortName: session.shortName,
        indices,
        insertAfter: indices[indices.length - 1],
      });
      insertionPlan.push({
        insertAfter: indices[indices.length - 1],
        session,
        indices,
      });
    }
  });

  // Sort by insert position and insert
  const sortedPlans = insertionPlan.sort(
    (a, b) => a.insertAfter - b.insertAfter
  );

  let lastRk1End: number | null = null;
  sortedPlans.forEach((plan) => {
    const label = String(plan.session?.shortName || "").toUpperCase();
    const isRk1 = /РК\s*1/i.test(label);
    const isRk2 = /РК\s*2/i.test(label);
    if (isRk1) {
      lastRk1End = plan.insertAfter;
    } else if (isRk2 && lastRk1End != null) {
      const cumulative: number[] = [];
      for (let i = lastRk1End + 1; i <= plan.insertAfter; i++)
        cumulative.push(i);
      plan.indices = cumulative;
    }
  });

  sortedPlans.forEach((plan, offset) => {
    const insertIndex = plan.insertAfter + 1 + offset;
    debugLog("inserting session column", {
      label: plan.session.shortName,
      insertIndex,
      afterDateIndex: plan.insertAfter,
      offset,
    });
    marksWithSessions.splice(insertIndex, 0, {
      type: "session",
      values: initialValuesForType("session", 2),
      label: plan.session.shortName,
      sessionId: plan.session.id,
      sessionDateIndices: plan.indices,
    } as Mark);
  });

  // Append summary column based on selected control form (exam/credit)
  const class9Id =
    (currentJournal.value as any)?.disciplineId ||
    (currentEvent.value as any)?.class9Id;
  const class9Item = class9Id
    ? (class9Store.getClass9ById as any)(class9Id)
    : null;
  const activeSem = getActiveAcademicYearSemester.value as any;

  let matchedEntry: any = null;
  if (class9Item && Array.isArray(class9Item.distributionEntries)) {
    const semesterNumber = String(activeSem?.semesterNumber ?? "");
    const activeYearId = activeSem?.academicYearId;
    matchedEntry =
      class9Item.distributionEntries.find((entry: any) => {
        const entrySemesterId = String(entry.semesterId ?? "");
        const matchesSemester =
          (activeSem &&
            (entrySemesterId === String(activeSem.id) ||
              entrySemesterId === semesterNumber)) ||
          (!!(currentEvent.value as any)?.semester &&
            entrySemesterId === String((currentEvent.value as any).semester));
        const matchesYear =
          !entry.academicYearId || !activeYearId
            ? matchesSemester
            : entry.academicYearId === activeYearId && matchesSemester;
        return matchesYear;
      }) || null;
  }

  debugGroup("control form analysis", () => {
    debugLog("class9Id", class9Id);
    debugLog("activeSemester", {
      id: activeSem?.id,
      semesterNumber: activeSem?.semesterNumber,
      academicYearId: activeSem?.academicYearId,
    });
    debugLog("matchedEntry", matchedEntry);
  });

  if (matchedEntry?.examEnabled) {
    const hasExamSession = marksWithSessions.some(
      (m: any) =>
        m.type === "session" &&
        (m.label === "Э" ||
          m.label === "ЭКЗ" ||
          m.label?.toUpperCase?.() === "Э")
    );
    if (!hasExamSession) {
      marksWithSessions.push({
        type: "e",
        values: initialValuesForType("e", 2),
      } as Mark);
      debugLog("appended control column", { type: "e" });
    } else {
      debugLog("skipped control column due to existing matching session", {
        type: "e",
      });
    }
  } else if (matchedEntry?.creditEnabled) {
    const hasCreditSession = marksWithSessions.some(
      (m: any) =>
        m.type === "session" &&
        (m.label === "З" || m.label?.toUpperCase?.() === "З")
    );
    if (!hasCreditSession) {
      marksWithSessions.push({
        type: "z",
        values: initialValuesForType("z", 2),
      } as Mark);
      debugLog("appended control column", { type: "z" });
    } else {
      debugLog("skipped control column due to existing matching session", {
        type: "z",
      });
    }
  } else if (matchedEntry?.controlLessonEnabled) {
    const hasKuSession = marksWithSessions.some(
      (m: any) =>
        m.type === "session" &&
        (m.label === "КУ" || m.label?.toUpperCase?.() === "КУ")
    );
    if (!hasKuSession) {
      marksWithSessions.push({
        type: "ku",
        values: initialValuesForType("ku", 2),
      } as Mark);
      debugLog("appended control column", { type: "ku" });
    } else {
      debugLog("skipped control column due to existing matching session", {
        type: "ku",
      });
    }
  }

  // Always append final Итог (И)
  marksWithSessions.push({
    type: "i",
    values: initialValuesForType("i", 2),
  } as Mark);
  debugLog("appended final column", { type: "i" });

  debugGroup("final marks template summary", () => {
    const summary = marksWithSessions.map((m, idx) => ({
      idx,
      type: (m as any).type,
      label: (m as any).label || (m as any).date || null,
      values: m.values?.length,
    }));
    debugLog("columns", summary);
  });

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

  // Map canonical column index to store column index
  const storeColIndex = getStoreIndexForCanonicalIndex(colIndex);
  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks || storeColIndex == null || storeColIndex < 0) return "";
  if (storeColIndex >= studentMarks.length) return "";

  const mark = studentMarks[storeColIndex].values[markIndex];
  if (mark === null) return "";
  return String(mark ?? "");
};

const setMark = (
  studentIndex: number,
  colIndex: number,
  markIndex: number,
  value: string
) => {
  const studentId = getStudentIdByIndex(studentIndex);
  if (!studentId || !props.journalId) return;

  const newValue = value === "+" || value === "" ? null : value;
  const storeColIndex = getStoreIndexForCanonicalIndex(colIndex);
  if (storeColIndex == null || storeColIndex < 0) {
    scheduleRebuildMarks();
    return;
  }
  marksStore.updateStudentMark(
    props.journalId,
    studentId,
    storeColIndex,
    markIndex,
    newValue
  );
  emit("update-students", students.value);
};

const editCell = (
  studentIndex: number,
  colIndex: number,
  markIndex: number
) => {
  const studentId = getStudentIdByIndex(studentIndex);
  if (!studentId || !props.journalId) return;

  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  const storeColIndex = getStoreIndexForCanonicalIndex(colIndex);
  if (!studentMarks || storeColIndex == null || storeColIndex < 0) return;

  const markType = studentMarks[storeColIndex].type;
  if (
    (markType === "session" || markType === "i") &&
    props.journalSettings?.calculationType === "calculated"
  ) {
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

const navigate = (direction: "up" | "down" | "left" | "right") => {
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

const onPaperclipClick = async (
  header: { type: string; label: string },
  index: number
) => {
  if (header.type !== "date") return;

  // Find the date for this header to get KTP details
  const currentEventData = currentEvent.value;
  if (!currentEventData || !currentJournal.value?.disciplineId) return;

  const days = getEventDays(currentEventData as any);

  // Map the column index to actual day index
  // We need to find which day this column represents by looking at the visible headers
  const visibleHeader = visibleHeaders.value.find(
    (h) => h.index === visibleHeaders.value[index]?.index
  );
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

const onSettingsClick = () => emit("open-settings");
const onCloseJournalClick = () => emit("close-journal");
const onDownloadClick = () => emit("download");
const onUploadClick = () => emit("upload");
const onShareClick = () => emit("share");
const onRecalcClick = () => {
  f7.popover.open("#recalc-popover", "#recalc-button");
};

const recalcRk1 = () => {
  computeAllSessionGrades({ force: true, labels: [/РК\s*1/i] });
  computeFinalGrades({ force: true });
  f7.popover.close("#recalc-popover");
};

const recalcRk2 = () => {
  computeAllSessionGrades({ force: true, labels: [/РК\s*2/i] });
  computeFinalGrades({ force: true });
  f7.popover.close("#recalc-popover");
};

const recalcFinal = () => {
  computeFinalGrades({ force: true });
  f7.popover.close("#recalc-popover");
};

const recalcAll = () => {
  computeAllSessionGrades({ force: true });
  computeFinalGrades({ force: true });
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

const computeAllSessionGrades = (opts?: {
  force?: boolean;
  labels?: Array<string | RegExp>;
}) => {
  const force = !!opts?.force;
  if (
    (props.journalSettings?.calculationType !== "calculated" ||
      !props.journalId) &&
    !force
  )
    return;
  const method = props.journalSettings?.calculationMethod || "only-assigned";

  const journalStudentMarks = marksStore.getJournalStudentMarks(
    props.journalId
  );

  journalStudentMarks.forEach((studentMark) => {
    studentMark.marks.forEach((mark, mIdx) => {
      if (mark.type === "session") {
        if (opts?.labels && opts.labels.length > 0) {
          const label = String((mark as any).label || "");
          const match = opts.labels.some((f) =>
            typeof f === "string"
              ? label.toUpperCase() === String(f).toUpperCase()
              : (f as RegExp).test(label)
          );
          if (!match) return;
        }
        const indices = (mark as any).sessionDateIndices as
          | number[]
          | undefined;
        if (!indices || indices.length === 0) return;
        const grade = computeSessionGradeForStudent(
          studentMark.studentId,
          indices,
          method
        );
        const currentValue0 = mark.values?.[0] ?? null;
        const currentValue1 = mark.values?.[1] ?? null;
        if (currentValue0 !== grade) {
          marksStore.updateStudentMark(
            props.journalId,
            studentMark.studentId,
            mIdx,
            0,
            grade
          );
        }
        if (currentValue1 !== null) {
          marksStore.updateStudentMark(
            props.journalId,
            studentMark.studentId,
            mIdx,
            1,
            null
          );
        }
      }
    });
  });
};

const computeFinalGrades = (opts?: { force?: boolean }) => {
  const force = !!opts?.force;
  if (
    (props.journalSettings?.calculationType !== "calculated" ||
      !props.journalId) &&
    !force
  )
    return;

  const journalStudentMarks = marksStore.getJournalStudentMarks(
    props.journalId
  );

  journalStudentMarks.forEach((studentMark) => {
    const isExamSessionLabel = (label: any) => {
      const s = String(label || "").toUpperCase();
      return s === "Э" || s === "ЭКЗ" || s === "З";
    };

    const rkValues: number[] = [];
    studentMark.marks.forEach((mark) => {
      if (mark.type === "pk") {
        const v0 = mark.values?.[0];
        const n =
          v0 !== null && v0 !== "" && !isNaN(Number(v0)) ? Number(v0) : null;
        if (n !== null) rkValues.push(n);
      } else if (
        mark.type === "session" &&
        !isExamSessionLabel((mark as any).label)
      ) {
        const v0 = mark.values?.[0];
        const n =
          v0 !== null && v0 !== "" && !isNaN(Number(v0)) ? Number(v0) : null;
        if (n !== null) rkValues.push(n);
      }
    });

    const rkAvg =
      rkValues.length > 0
        ? rkValues.reduce((sum, v) => sum + v, 0) / rkValues.length
        : null;

    let exam: number | null = null;
    const trySetExam = (predicate: (m: any) => boolean) => {
      if (exam !== null) return;
      const idx = studentMark.marks.findIndex(predicate);
      if (idx >= 0) {
        const vv = studentMark.marks[idx].values?.[0];
        const num =
          vv !== null && vv !== "" && !isNaN(Number(vv)) ? Number(vv) : null;
        if (num !== null) exam = num;
      }
    };

    trySetExam((m) => m.type === "e");
    trySetExam((m) => m.type === "z");
    trySetExam(
      (m) =>
        m.type === "session" &&
        typeof m.label === "string" &&
        ["Э", "ЭКЗ", "З"].includes(String(m.label).toUpperCase())
    );

    let finalStr: string | null = null;
    if (rkAvg !== null && exam !== null) {
      finalStr = (0.6 * rkAvg + 0.4 * exam).toFixed(1);
    } else if (rkAvg !== null) {
      finalStr = rkAvg.toFixed(1);
    } else {
      finalStr = null;
    }

    const iIndex = studentMark.marks.findIndex((m) => m.type === "i");
    if (iIndex >= 0) {
      const current0 = studentMark.marks[iIndex].values?.[0] ?? null;
      if (current0 !== finalStr) {
        marksStore.updateStudentMark(
          props.journalId,
          studentMark.studentId,
          iIndex,
          0,
          finalStr
        );
      }
      const current1 = studentMark.marks[iIndex].values?.[1] ?? null;
      if (current1 !== null) {
        marksStore.updateStudentMark(
          props.journalId,
          studentMark.studentId,
          iIndex,
          1,
          null
        );
      }
    }
  });
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
  const canonical = canonicalTemplate.value;
  return canonical.map((mark: any) => ({
    type: mark.type,
    label: headerLabelFor(mark),
  }));
});

const visibleHeaders = computed(() => {
  return tableHeaders.value
    .map((header, index) => ({ ...header, index }))
    .filter(
      (h) => h.type !== "date" || (h.label && String(h.label).trim() !== "")
    );
});
// Canonical template derived from current event/sessions/schedules
const canonicalTemplate = computed(() => generateDates());

const getCanonicalRows = (canonicalCol: number): number => {
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
    const label = canonical.label;
    return findBy((m: any) => m.type === "session" && m.label === label);
  }
  // Control columns by type
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

const scheduleRecomputeFinalGrades = debounce(() => {
  /* manual trigger only */
}, 150);

const scheduleRecomputeSessionGrades = debounce(() => {
  /* manual trigger only */
}, 150);

watch(
  () => props.journalSettings,
  () => {
    /* manual trigger only */
  },
  { deep: true }
);

// Rebuild marks when sessions list changes (ensures session columns appear on load)
const rebuildMarks = () => {
  if (!(props.journalId && currentJournal.value?.students?.length)) return;
  const markTemplate = generateDates();
  marksStore.initializeJournalMarks(
    props.journalId,
    currentJournal.value.students,
    markTemplate
  );
  /* manual trigger only */
};

const scheduleRebuildMarks = debounce(() => {
  rebuildMarks();
}, 250);

watch(
  () => sessionStore.sortedSessions,
  () => {
    console.log("[JournalTab] Sessions changed:", {
      sessionCount: sessionStore.sortedSessions?.length || 0,
      journalId: props.journalId,
      hasStudents: !!currentJournal.value?.students?.length,
    });
    scheduleRebuildMarks();
  },
  { deep: true, immediate: true }
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
  () => getActiveYearSchedules.value,
  () => {
    scheduleRebuildMarks();
  },
  { deep: true }
);

const updateStudent = (updatedStudent: any) => {
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
  scheduleRecomputeFinalGrades();
};

const updateStudents = (updatedStudents: any[]) => {
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
    scheduleRecomputeFinalGrades();
  }
};

defineExpose({
  updateStudent,
  updateStudents,
  tableHeaders: computed(() => tableHeaders.value),
  students: computed(() => students.value),
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
