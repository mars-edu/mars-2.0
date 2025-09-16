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
                  header.type === 'i',
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
                  header.type === 'i',
              }"
            >
              <div class="flex flex-col gap-1">
                <div
                  v-for="(value, mIdx) in student.marks[header.index]?.values ||
                  []"
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
                    <MarkCell :mark="value" />
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- KtpDetailFormPopover -->
    <KtpDetailFormPopover
      v-model:opened="ktpPopoverOpened"
      :target="ktpPopoverTarget"
      :parent-id="props.journalId"
      :detail-to-edit="null"
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from "vue";
import { f7, f7Icon, f7Button } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import MarkCell from "@/components/ui/MarkCell.vue";
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";
import KtpDetailFormPopover from "@/components/KtpDetailFormPopover.vue";
import { useCalendarStore } from "@/stores/calendarStore";
import { useStudentStore } from "@/stores/studentStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useMarksStore } from "@/stores/marksStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { storeToRefs } from "pinia";
import type { Mark } from "@/types/marks";
import type { EducationSchedule } from "@/stores/educationScheduleStore";
import type { StudentWithMarks } from "@/types/student";

interface Props {
  journalId: string;
  currentJournal: any;
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
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

const editingCell = ref<{
  studentIndex: number;
  colIndex: number;
  markIndex: number;
} | null>(null);
const editedValue = ref("");

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
  if (currentEvent.value) {
    const startDate = new Date(currentEvent.value.startDate);
    const endDate = new Date(currentEvent.value.endDate);

    const dateMarks: Mark[] = [];
    const currentDate = new Date(startDate);

    // Get selected weekdays from weeklySchedules if available
    const weeklySchedules = currentEvent.value.weeklySchedules || [];
    const selectedWeekdays = weeklySchedules.map((ws) => ws.weekId) || [];

    while (currentDate <= endDate) {
      // Convert JavaScript day (0=Sunday) to weekId format (0=Monday)
      const jsDay = currentDate.getDay();
      const weekId = (jsDay + 6) % 7; // Convert Sunday=0 to Monday=0

      // Only include dates that match selected weekdays (if weeklySchedules exist)
      const shouldIncludeDate =
        selectedWeekdays.length === 0 || selectedWeekdays.includes(weekId);

      if (shouldIncludeDate) {
        const day = currentDate.getDate().toString().padStart(2, "0");
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
        const year = currentDate.getFullYear();
        const dateStr = `${day}.${month}\n${year}`;
        const isoDate = `${year}-${month}-${day}`;
        // determine rows per day from weekly schedule by lesson ids; fallback from times
        const daySchedule = weeklySchedules.find(
          (ws) => ws.weekId === weekId
        ) as any;
        const schedulesArr = (getActiveYearSchedules.value ||
          []) as EducationSchedule[];
        const { startId, endId } = resolveScheduleIds(
          daySchedule,
          schedulesArr
        );
        const rows = countLessonsInRange(startId, endId);
        dateMarks.push({
          type: "date",
          date: dateStr,
          values: Array.from({ length: rows }, () => null),
          label: dateStr,
          isoDate,
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

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
    dateMarks.forEach((_m, idx) => {});

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
        insertionPlan.push({
          insertAfter: indices[indices.length - 1],
          session,
          indices,
        });
      }
    });

    // Sort by insert position and insert
    insertionPlan
      .sort((a, b) => a.insertAfter - b.insertAfter)
      .forEach((plan, offset) => {
        const insertIndex = plan.insertAfter + 1 + offset;
        marksWithSessions.splice(insertIndex, 0, {
          type: "session",
          values: [null, null],
          label: plan.session.shortName,
          sessionId: plan.session.id,
          sessionDateIndices: plan.indices,
        } as Mark);
      });

    // Append summary columns
    marksWithSessions.push({ type: "pk", values: [null, null] });
    marksWithSessions.push({ type: "e", values: [null, null] });
    marksWithSessions.push({ type: "i", values: [null, null] });

    return marksWithSessions;
  }

  return Array.from({ length: 17 }, () => ({
    type: "date" as const,
    date: "",
    values: [null, null],
  }));
};

const getStudentIdByIndex = (index: number): string | null => {
  if (
    !props.currentJournal?.students ||
    index < 0 ||
    index >= props.currentJournal.students.length
  ) {
    return null;
  }
  return props.currentJournal.students[index];
};

const students = computed(() => {
  if (!props.journalId || !props.currentJournal?.students?.length) return [];

  return props.currentJournal.students.map(
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

  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks || colIndex >= studentMarks.length) return "";

  const mark = studentMarks[colIndex].values[markIndex];
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
  marksStore.updateStudentMark(
    props.journalId,
    studentId,
    colIndex,
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
  if (!studentMarks || colIndex >= studentMarks.length) return;

  const markType = studentMarks[colIndex].type;
  if (
    markType === "session" &&
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
    const getColRows = (col: number) => {
      const firstStudent = students.value[0];
      const marks = firstStudent?.marks?.[visibleHeaders.value[col]?.index];
      return Array.isArray(marks?.values) ? marks.values.length : 2;
    };
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

const ktpPopoverOpened = ref(false);
const ktpPopoverTarget = ref("");

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

const onPaperclipClick = (
  header: { type: string; label: string },
  index: number
) => {
  ktpPopoverTarget.value = `#paperclip-${index}`;
  ktpPopoverOpened.value = true;
};

const onSettingsClick = () => emit("open-settings");
const onCloseJournalClick = () => emit("close-journal");
const onDownloadClick = () => emit("download");
const onUploadClick = () => emit("upload");
const onShareClick = () => emit("share");

const computeDayAverage = (
  studentId: string,
  dayIndex: number
): number | null => {
  if (!studentId || !props.journalId) return null;

  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks || dayIndex < 0 || dayIndex >= studentMarks.length)
    return null;
  const values = studentMarks[dayIndex]?.values || [];
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

const computeAllSessionGrades = () => {
  if (
    props.journalSettings?.calculationType !== "calculated" ||
    !props.journalId
  )
    return;
  const method = props.journalSettings?.calculationMethod || "only-assigned";

  const journalStudentMarks = marksStore.getJournalStudentMarks(
    props.journalId
  );

  journalStudentMarks.forEach((studentMark) => {
    studentMark.marks.forEach((mark, mIdx) => {
      if (mark.type === "session") {
        const indices = (mark as any).sessionDateIndices as
          | number[]
          | undefined;
        if (!indices || indices.length === 0) return;
        const grade = computeSessionGradeForStudent(
          studentMark.studentId,
          indices,
          method
        );
        // Put into first slot; keep second empty
        marksStore.updateStudentMark(
          props.journalId,
          studentMark.studentId,
          mIdx,
          0,
          grade
        );
        marksStore.updateStudentMark(
          props.journalId,
          studentMark.studentId,
          mIdx,
          1,
          null
        );
      }
    });
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
  if (!props.journalId) return [];

  const journalStudentMarks = marksStore.getJournalStudentMarks(
    props.journalId
  );
  if (journalStudentMarks.length === 0) return [];

  return journalStudentMarks[0].marks.map((mark) => {
    if (mark.type === "date") {
      return { type: "date", label: mark.date || "" };
    }
    if (mark.type === "session") {
      return { type: "session", label: (mark as any).label || "Сессия" };
    }
    if (mark.type === "pk") {
      return { type: "pk", label: "РК" };
    }
    if (mark.type === "e") {
      return { type: "e", label: "Э" };
    }
    if (mark.type === "i") {
      return { type: "i", label: "И" };
    }
    return { type: "unknown", label: "" };
  });
});

const visibleHeaders = computed(() => {
  return tableHeaders.value
    .map((header, index) => ({ ...header, index }))
    .filter(
      (h) => h.type !== "date" || (h.label && String(h.label).trim() !== "")
    );
});

const visibleColumnIndices = computed(() => {
  return visibleHeaders.value.map((h) => h.index);
});

watch(
  () => props.journalSettings,
  () => {
    computeAllSessionGrades();
  },
  { deep: true }
);

// Rebuild marks when sessions list changes (ensures session columns appear on load)
watch(
  () => sessionStore.sortedSessions,
  () => {
    console.log("[JournalTab] Sessions changed:", {
      sessionCount: sessionStore.sortedSessions?.length || 0,
      journalId: props.journalId,
      hasStudents: !!props.currentJournal?.students?.length,
    });

    if (props.journalId && props.currentJournal?.students?.length) {
      console.log("[JournalTab] Sessions changed, rebuilding marks");
      // Regenerate marks template and update store
      const markTemplate = generateDates();
      console.log("[JournalTab] New mark template from sessions:", {
        templateLength: markTemplate.length,
        sessionColumns: markTemplate.filter((m) => m.type === "session").length,
      });

      marksStore.initializeJournalMarks(
        props.journalId,
        props.currentJournal.students,
        markTemplate
      );
      computeAllSessionGrades();
    }
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
    if (props.journalId && props.currentJournal?.students?.length) {
      const markTemplate = generateDates();
      marksStore.initializeJournalMarks(
        props.journalId,
        props.currentJournal.students,
        markTemplate
      );
      computeAllSessionGrades();
    }
  },
  { deep: false }
);

// Rebuild marks when active education schedules change (ensures correct row counts once schedules load)
watch(
  () => getActiveYearSchedules.value,
  () => {
    if (props.journalId && props.currentJournal?.students?.length) {
      const markTemplate = generateDates();
      marksStore.initializeJournalMarks(
        props.journalId,
        props.currentJournal.students,
        markTemplate
      );
      computeAllSessionGrades();
    }
  },
  { deep: true }
);

const updateStudent = (updatedStudent: any) => {
  if (!updatedStudent || !props.journalId) return;

  // Update marks in store
  if (updatedStudent.marks) {
    marksStore.updateStudentMarks(
      props.journalId,
      updatedStudent.id.toString(),
      updatedStudent.marks
    );
  }

  emit("update-students", students.value);
};

const updateStudents = (updatedStudents: any[]) => {
  if (updatedStudents && props.journalId) {
    // Update all students' marks in store
    const studentMarksToUpdate = updatedStudents.map((student) => ({
      studentId: student.id.toString(),
      marks: student.marks,
    }));

    marksStore.updateMultipleStudentMarks(
      props.journalId,
      studentMarksToUpdate
    );
    emit("update-students", students.value);
  }
};

defineExpose({
  updateStudent,
  updateStudents,
  tableHeaders: computed(() => tableHeaders.value),
  students: computed(() => students.value),
});

onMounted(() => {
  if (props.journalId && props.currentJournal?.students?.length) {
    // Initialize marks in store
    const markTemplate = generateDates();
    marksStore.initializeJournalMarks(
      props.journalId,
      props.currentJournal.students,
      markTemplate
    );
  }

  computeAllSessionGrades();
  window.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
});

watch(
  () => props.currentJournal,
  (newJournal) => {
    if (props.journalId && newJournal?.students?.length) {
      // Initialize marks in store for the new journal
      const markTemplate = generateDates();
      marksStore.initializeJournalMarks(
        props.journalId,
        newJournal.students,
        markTemplate
      );
      computeAllSessionGrades();
    }
  },
  { immediate: true }
);
</script>
