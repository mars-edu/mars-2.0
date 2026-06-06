<template>
  <f7-popup
    id="individual-journals-config-popup"
    :opened="isOpen"
    @popup:closed="isOpen = false"
    class="individual-journals-config-popup"
  >
    <div class="flex flex-col h-full bg-background text-foreground">
      <div class="flex items-center justify-between p-4 border-b border-border">
        <div class="text-lg font-bold">Индивидуальные журналы</div>
        <button class="text-muted-foreground hover:text-foreground" @click="isOpen = false">
          <IconX class="text-xl" />
        </button>
      </div>

      <div class="flex-1 overflow-y-auto p-4">
        <IndividualJournalsEditor
          ref="editorRef"
          v-model:useIndividualJournals="useIndividualJournals"
          v-model:gradingType="gradingType"
          v-model:individualJournals="drafts"
          :rup-entry-id="mainEvent?.rupEntryId ?? ''"
          :semester-id="mainEvent?.semester ?? ''"
          :week-count="weekCount"
          :student-pool="mainEvent?.participants ?? []"
          :semester-planned-hours="semesterPlannedHours"
          :week-days="weekDays"
          :start-time-options="startTimeOptions"
          :end-time-options="endTimeOptions"
          :get-end-time-options-for-start="getEndTimeOptionsForStart"
          hide-toggle
        />
      </div>

      <div class="p-4 border-t border-border">
        <button
          class="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold disabled:opacity-50"
          :disabled="!canSave || isSaving"
          @click="handleSave"
        >
          Сохранить
        </button>
      </div>
    </div>
  </f7-popup>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { f7, f7Popup } from "framework7-vue";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { ConvexError } from "convex/values";
import IconX from "~icons/lucide/x";
import IndividualJournalsEditor from "@/components/Calendar/IndividualJournalsEditor.vue";
import { useCalendarStore } from "@/stores/calendarStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { getWeekDays, DATE_UI_FORMAT } from "@/constants/calendar";
import { storeToRefs } from "pinia";
import type { IndividualJournalDraft } from "@/components/Calendar/useAddEventWizard";

dayjs.extend(customParseFormat);

const calendarStore = useCalendarStore();
const educationScheduleStore = useEducationScheduleStore();
const rupEntryStore = useRupEntryStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();

const { getSchedulesBySemester, getActiveYearSchedules } = storeToRefs(educationScheduleStore);

const isOpen = ref(false);
const isSaving = ref(false);
const mainEventId = ref<string>("");
const useIndividualJournals = ref(true);
const gradingType = ref<"combined" | "separate" | "">("");
const drafts = ref<IndividualJournalDraft[]>([]);
const editorRef = ref<InstanceType<typeof IndividualJournalsEditor> | null>(null);

const mainEvent = computed(() => calendarStore.getEventById(mainEventId.value));

const weekDays = computed(() => getWeekDays());

const weekCount = computed(() => {
  if (!mainEvent.value) return 0;
  const start = dayjs(mainEvent.value.startDate, DATE_UI_FORMAT, true);
  const end = dayjs(mainEvent.value.endDate, DATE_UI_FORMAT, true);
  if (!start.isValid() || !end.isValid()) return 0;
  const daysDiff = end.diff(start, "day") + 1;
  return daysDiff > 0 ? Math.ceil(daysDiff / 7) : 0;
});

const semesterPlannedHours = computed(() => {
  if (!mainEvent.value) return "0";
  const entry = rupEntryStore.getRupEntryById(mainEvent.value.rupEntryId);
  if (!entry) return "0";
  const semesterId = mainEvent.value.semester;
  const semester = semesterId
    ? academicYearSemesterStore.getAcademicYearSemesterById(semesterId)
    : null;
  if (!semester) return "0";

  const semesterNumber = String(semester.semesterNumber ?? "");
  const activeYearId = semester.academicYearId;
  const matchedEntry = (entry.distributionEntries ?? []).find((e: any) => {
    const entrySemesterId = String((e as any).semesterId ?? "");
    const matchesSemester =
      entrySemesterId === String(semester.id ?? "") ||
      entrySemesterId === semesterNumber;
    const matchesYear =
      !e.academicYearId || !activeYearId
        ? matchesSemester
        : e.academicYearId === activeYearId && matchesSemester;
    return matchesYear;
  });
  return matchedEntry?.hours ? String(matchedEntry.hours) : "0";
});

// Time options — same derivation as AddEventWizard
const activeSemesterSchedules = computed(() => {
  const semId = mainEvent.value?.semester;
  if (!semId) return getActiveYearSchedules.value;
  const schedules = getSchedulesBySemester.value(semId);
  return [...schedules].sort((a: any, b: any) => a.lessonNumber - b.lessonNumber);
});

const startTimeOptions = computed(() =>
  activeSemesterSchedules.value.map((s: any) => ({ value: s.id, text: s.startTime }))
);

const endTimeOptions = computed(() =>
  activeSemesterSchedules.value.map((s: any) => ({ value: s.id, text: s.endTime }))
);

function getEndTimeOptionsForStart(startId: string) {
  const schedules = activeSemesterSchedules.value;
  const startIndex = startId ? schedules.findIndex((s: any) => s.id === startId) : -1;
  if (startIndex === -1) return [];
  return schedules
    .filter((_: any, i: number) => i >= startIndex)
    .map((s: any) => ({ value: s.id, text: s.endTime }));
}

const canSave = computed(
  () =>
    !!gradingType.value &&
    drafts.value.length > 0 &&
    (editorRef.value?.isIndividualHoursMatching ?? false) &&
    drafts.value.every(
      (j) =>
        j.studentIds.length > 0 &&
        j.daySlots.length > 0 &&
        j.daySlots.every((s) => !!s.startId && !!s.endId)
    )
);

function childrenOf(eventId: string) {
  return calendarStore.events.filter((e) => e.sourceGroupEventId === eventId);
}

const LOCKED_MESSAGE =
  "В индивидуальных журналах уже выставлены оценки — редактирование запрещено";

async function open(eventId: string) {
  mainEventId.value = eventId;

  // Full lock pre-check (server re-validates on save)
  const locked = await convex.query(
    api.journals.queries.hasMarksInIndividualJournals,
    { mainEventId: eventId }
  );
  if (locked) {
    f7.dialog.alert(LOCKED_MESSAGE, "Редактирование невозможно");
    return;
  }

  const ev = calendarStore.getEventById(eventId);
  gradingType.value = ev?.gradingType ?? "";
  drafts.value = childrenOf(eventId).map((child) => ({
    id: child.id,
    studentIds: [...child.participants],
    daySlots: (child.weeklySchedules ?? []).map((ws) => ({
      weekId: ws.weekId,
      russianWeekDay: getWeekDays().find((d) => d.weekId === ws.weekId)?.name ?? "",
      startId: ws.startId ?? "",
      endId: ws.endId ?? "",
    })),
  }));
  isOpen.value = true;
}

async function handleSave() {
  if (!canSave.value) return;
  isSaving.value = true;
  try {
    const existingIds = new Set(childrenOf(mainEventId.value).map((c) => c.id));
    await convex.mutation(
      api.calendarEvents.mutations.updateIndividualJournalsConfig,
      {
        mainEventId: mainEventId.value as any,
        gradingType: gradingType.value as "combined" | "separate",
        individualJournals: drafts.value.map((j) => ({
          eventId: existingIds.has(j.id) ? j.id : undefined,
          studentIds: j.studentIds,
          weeklySchedules: j.daySlots.map(({ weekId, startId, endId }) => ({
            weekId,
            startId,
            endId,
          })),
        })),
      }
    );
    await calendarStore.fetchEventsWithRoleAccess();
    isOpen.value = false;
  } catch (err) {
    const message =
      err instanceof ConvexError
        ? String((err as ConvexError).data)
        : err instanceof Error
          ? err.message
          : String(err);
    if (message.includes("INDIVIDUAL_JOURNALS_LOCKED")) {
      f7.dialog.alert(LOCKED_MESSAGE, "Редактирование невозможно");
    } else {
      f7.dialog.alert(message, "Ошибка");
    }
  } finally {
    isSaving.value = false;
  }
}

defineExpose({ open });
</script>
