<template>
  <div class="rounded-xl border border-input bg-card p-3 space-y-3">
    <div v-if="!hideToggle" class="flex items-center justify-between">
      <div>
        <div
          class="text-base"
          :class="individualHoursAvailable ? 'text-foreground' : 'text-muted-foreground'"
        >
          Индивидуальные журналы
        </div>
        <div class="text-xs text-muted-foreground">
          {{
            individualHoursAvailable
              ? "Подгруппы студентов с собственным расписанием"
              : "Установите индивидуальные часы в РУП, чтобы активировать"
          }}
        </div>
      </div>
      <label
        class="relative inline-flex h-7 w-12 items-center"
        :class="individualHoursAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'"
      >
        <input
          v-model="useIndividualJournalsModel"
          type="checkbox"
          :disabled="!individualHoursAvailable"
          class="peer sr-only"
        />
        <span
          class="h-7 w-12 rounded-full bg-muted transition-colors peer-checked:bg-primary"
        ></span>
        <span
          class="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"
        ></span>
      </label>
    </div>

    <template v-if="useIndividualJournalsModel">
      <div class="flex items-center justify-between bg-secondary/40 rounded-xl px-4 py-2.5">
        <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          План: <span class="text-foreground">{{ props.semesterPlannedHours }} ч</span>
        </span>
        <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Инд.:
          <span :class="isIndividualHoursMatching ? 'text-green-600' : 'text-destructive'">
            {{ totalIndividualHours }} / {{ individualBudget }} ч
          </span>
        </span>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <button
          class="py-3 rounded-xl text-sm font-medium transition-colors border"
          :class="gradingTypeModel === 'combined'
            ? 'bg-foreground text-background border-foreground'
            : 'bg-card text-foreground border-input hover:bg-muted/50'"
          @click="gradingTypeModel = 'combined'"
        >
          Общая
        </button>
        <button
          class="py-3 rounded-xl text-sm font-medium transition-colors border"
          :class="gradingTypeModel === 'separate'
            ? 'bg-foreground text-background border-foreground'
            : 'bg-card text-foreground border-input hover:bg-muted/50'"
          @click="gradingTypeModel = 'separate'"
        >
          Раздельная
        </button>
      </div>

      <div
        v-for="(journal, idx) in individualJournalsModel"
        :key="journal.id"
        class="rounded-xl border border-input bg-secondary/40 p-4 space-y-3"
      >
        <div class="flex items-center justify-between">
          <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Журнал #{{ idx + 1 }}
          </div>
          <button
            class="w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center"
            @click="removeJournal(journal.id)"
            title="Удалить журнал"
          >
            <IconX class="text-sm" />
          </button>
        </div>

        <!-- Student picker -->
        <div class="relative">
          <button
            class="w-full flex items-center justify-between p-2.5 rounded-lg border border-input bg-card text-sm hover:bg-muted/50 transition-colors"
            @click="openStudentSelectorId = openStudentSelectorId === journal.id ? null : journal.id"
          >
            <span :class="journal.studentIds.length > 0 ? 'text-foreground' : 'text-muted-foreground'">
              {{ journal.studentIds.length > 0
                ? `Студентов: ${journal.studentIds.length}`
                : 'Выберите студентов'
              }}
            </span>
            <IconChevronUp v-if="openStudentSelectorId === journal.id" class="text-sm text-muted-foreground" />
            <IconChevronDown v-else class="text-sm text-muted-foreground" />
          </button>

          <div
            v-if="openStudentSelectorId === journal.id"
            class="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-input bg-card shadow-lg max-h-48 overflow-y-auto"
          >
            <div
              v-for="studentId in availableStudentsForJournal(journal.id)"
              :key="studentId"
              class="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
              @click="toggleJournalStudent(journal.id, studentId)"
            >
              <input
                type="checkbox"
                :checked="journal.studentIds.includes(studentId)"
                class="pointer-events-none"
              />
              <span class="text-foreground">{{ studentStore.getStudentFullName(studentId) }}</span>
            </div>
            <div
              v-if="availableStudentsForJournal(journal.id).length === 0"
              class="px-3 py-2 text-sm text-muted-foreground text-center"
            >
              Все студенты распределены
            </div>
          </div>
        </div>

        <!-- Day chips -->
        <div class="flex justify-between gap-1">
          <button
            v-for="day in props.weekDays"
            :key="day.weekId"
            class="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center cursor-pointer transition-colors"
            :class="{
              'bg-primary text-primary-foreground shadow-sm': journal.daySlots.some(s => s.weekId === day.weekId),
              'bg-secondary text-secondary-foreground hover:bg-secondary/80': !journal.daySlots.some(s => s.weekId === day.weekId),
            }"
            @click="toggleJournalDay(journal.id, day.weekId, day.name)"
          >
            {{ day.abbreviation }}
          </button>
        </div>

        <!-- Time slots per day -->
        <template v-for="dayGroup in groupedJournalSlots(journal)" :key="dayGroup.weekId">
          <div class="rounded-xl border border-input p-3 space-y-2 bg-card">
            <div class="text-sm font-semibold text-foreground">
              {{ dayGroup.russianWeekDay }}
            </div>

            <div
              v-for="slot in dayGroup.slots"
              :key="slot.index"
              class="flex items-center gap-2 w-full"
            >
              <div class="flex-1 min-w-0">
                <Select
                  :id="`journal-${journal.id}-start-${dayGroup.weekId}-${slot.slotOrder}`"
                  :modelValue="slot.value.startId"
                  :options="props.startTimeOptions"
                  placeholder="Начало"
                  class="w-full"
                  @update:modelValue="(v) => updateJournalSlotTime(journal.id, slot.index, 'startId', v)"
                />
              </div>
              <span class="text-muted-foreground text-sm shrink-0">—</span>
              <div class="flex-1 min-w-0">
                <Select
                  :id="`journal-${journal.id}-end-${dayGroup.weekId}-${slot.slotOrder}`"
                  :modelValue="slot.value.endId"
                  :options="slot.value.startId ? props.getEndTimeOptionsForStart(slot.value.startId) : props.endTimeOptions"
                  placeholder="Конец"
                  class="w-full"
                  @update:modelValue="
                    (v) => updateJournalSlotTime(journal.id, slot.index, 'endId', v)
                  "
                />
              </div>
              <button
                class="w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center shrink-0"
                @click="removeJournalSlot(journal.id, slot.index)"
                title="Удалить время"
              >
                <IconX class="text-sm" />
              </button>
            </div>

            <button
              class="flex items-center justify-center gap-1 text-primary text-sm font-medium hover:bg-primary/10 transition-colors rounded-md px-2 py-1"
              @click="addJournalSlot(journal.id, dayGroup.weekId, dayGroup.russianWeekDay)"
              title="Добавить время"
            >
              <span class="text-base leading-none">+</span>
            </button>
          </div>
        </template>

        <!-- KTP/RUP stub -->
        <button
          class="text-sm text-primary font-medium hover:underline"
          @click.prevent
        >
          Прикрепить КТП/РУП
        </button>
      </div>

      <button
        class="w-full py-4 border border-dashed border-input rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        @click="addJournal"
      >
        + Добавить журнал
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { storeToRefs } from "pinia";

import IconX from "~icons/lucide/x";
import IconChevronUp from "~icons/lucide/chevron-up";
import IconChevronDown from "~icons/lucide/chevron-down";

import Select from "@/components/ui/Select.vue";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useStudentStore } from "@/stores/studentStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { computeScheduleHours, resolveIndividualBudget } from "./scheduleHours";
import type { IndividualJournalDraft } from "./useAddEventWizard";
import type { WeekDaySchedule } from "./useEventFormDerived";

const props = defineProps<{
  useIndividualJournals: boolean;
  gradingType: "combined" | "separate" | "";
  individualJournals: IndividualJournalDraft[];
  rupEntryId: string;
  semesterId: string;
  weekCount: number;
  studentPool: string[];
  semesterPlannedHours: string;
  weekDays: Array<{ weekId: number; name: string; abbreviation: string }>;
  startTimeOptions: Array<{ value: string; label?: string; text?: string }>;
  endTimeOptions: Array<{ value: string; label?: string; text?: string }>;
  getEndTimeOptionsForStart: (startId: string) => Array<{ value: string; label?: string; text?: string }>;
  hideToggle?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:useIndividualJournals", v: boolean): void;
  (e: "update:gradingType", v: "combined" | "separate" | ""): void;
  (e: "update:individualJournals", v: IndividualJournalDraft[]): void;
}>();

const rupEntryStore = useRupEntryStore();
const studentStore = useStudentStore();
const educationScheduleStore = useEducationScheduleStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();

const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

// --- Gate fix (Task 6): only enable when the active semester budget is > 0 ---
const individualBudget = computed(() => {
  const entry = rupEntryStore.getRupEntryById(props.rupEntryId);
  const semester = academicYearSemesterStore.getAcademicYearSemesterById(props.semesterId);
  if (!semester) return 0;
  return resolveIndividualBudget(entry, {
    semesterId: String(semester.id ?? ""),
    semesterNumber: String(semester.semesterNumber ?? ""),
    academicYearId: semester.academicYearId,
  });
});

const individualHoursAvailable = computed(() => individualBudget.value > 0);

// Auto-reset the toggle when the budget gate closes (e.g. discipline
// changed to one without individual hours) — keeps parent state in sync
// so submit logic and step validation never see a stale `true`.
watch(individualHoursAvailable, (available) => {
  if (!available && props.useIndividualJournals) {
    emit("update:useIndividualJournals", false);
    emit("update:gradingType", "");
    emit("update:individualJournals", []);
  }
});

// --- Models ---

const useIndividualJournalsModel = computed({
  get: () => props.useIndividualJournals && individualHoursAvailable.value,
  set: (v: boolean) => {
    if (v && !individualHoursAvailable.value) return;
    emit("update:useIndividualJournals", v);
  },
});

const gradingTypeModel = computed({
  get: () => props.gradingType,
  set: (v: "combined" | "separate" | "") => emit("update:gradingType", v),
});

const individualJournalsModel = computed({
  get: () => props.individualJournals,
  set: (v: IndividualJournalDraft[]) => emit("update:individualJournals", v),
});

// --- Computed totals ---

const totalIndividualHours = computed(() => {
  const scheduleIds = getActiveYearSchedules.value.map((s: any) => s.id);
  let total = 0;
  for (const j of individualJournalsModel.value) {
    total += computeScheduleHours(j.daySlots, scheduleIds, props.weekCount);
  }
  return total;
});

const isIndividualHoursMatching = computed(
  () => totalIndividualHours.value === individualBudget.value
);

// --- State ---

const openStudentSelectorId = ref<string | null>(null);

// --- Functions ---

function addJournal() {
  individualJournalsModel.value = [
    ...individualJournalsModel.value,
    { id: crypto.randomUUID(), studentIds: [], daySlots: [] },
  ];
}

function removeJournal(id: string) {
  individualJournalsModel.value = individualJournalsModel.value.filter(
    (j) => j.id !== id
  );
}

function toggleJournalStudent(journalId: string, studentId: string) {
  individualJournalsModel.value = individualJournalsModel.value.map((j) => {
    if (j.id === journalId) {
      const has = j.studentIds.includes(studentId);
      return {
        ...j,
        studentIds: has
          ? j.studentIds.filter((id) => id !== studentId)
          : [...j.studentIds, studentId],
      };
    }
    // Remove student from other journals (exclusive assignment)
    if (j.studentIds.includes(studentId)) {
      return { ...j, studentIds: j.studentIds.filter((id) => id !== studentId) };
    }
    return j;
  });
}

function toggleJournalDay(journalId: string, weekId: number, dayName: string) {
  individualJournalsModel.value = individualJournalsModel.value.map((j) => {
    if (j.id !== journalId) return j;
    const exists = j.daySlots.some((s) => s.weekId === weekId);
    if (exists) {
      const filtered = j.daySlots.filter((s) => s.weekId !== weekId);
      return { ...j, daySlots: filtered };
    }
    return {
      ...j,
      daySlots: [
        ...j.daySlots,
        { weekId, russianWeekDay: dayName, startId: "", endId: "" },
      ],
    };
  });
}

function updateJournalSlotTime(
  journalId: string,
  slotIdx: number,
  field: "startId" | "endId",
  value: string | number | Array<string | number>
) {
  const nextValue =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? String(value[0] ?? "")
        : String(value);

  individualJournalsModel.value = individualJournalsModel.value.map((j) => {
    if (j.id !== journalId) return j;
    const slots = [...j.daySlots];
    if (!slots[slotIdx]) return j;
    slots[slotIdx] = { ...slots[slotIdx], [field]: nextValue };
    if (field === "startId") {
      slots[slotIdx].endId = nextValue;
    }
    return { ...j, daySlots: slots };
  });
}

function addJournalSlot(journalId: string, weekId: number, dayName: string) {
  individualJournalsModel.value = individualJournalsModel.value.map((j) => {
    if (j.id !== journalId) return j;
    return {
      ...j,
      daySlots: [
        ...j.daySlots,
        { weekId, russianWeekDay: dayName, startId: "", endId: "" },
      ],
    };
  });
}

function removeJournalSlot(journalId: string, slotIdx: number) {
  individualJournalsModel.value = individualJournalsModel.value.map((j) => {
    if (j.id !== journalId) return j;
    const slots = [...j.daySlots];
    const removed = slots[slotIdx];
    if (!removed) return j;
    slots.splice(slotIdx, 1);
    return { ...j, daySlots: slots };
  });
}

function availableStudentsForJournal(journalId: string) {
  const takenByOthers = new Set<string>();
  for (const j of individualJournalsModel.value) {
    if (j.id !== journalId) {
      j.studentIds.forEach((id) => takenByOthers.add(id));
    }
  }
  return props.studentPool.filter((id) => !takenByOthers.has(id));
}

function groupedJournalSlots(journal: IndividualJournalDraft) {
  const grouped = new Map<
    number,
    {
      weekId: number;
      russianWeekDay: string;
      slots: Array<{
        index: number;
        slotOrder: number;
        value: WeekDaySchedule;
      }>;
    }
  >();

  journal.daySlots.forEach((slot, index) => {
    const existing = grouped.get(slot.weekId);
    if (existing) {
      existing.slots.push({
        index,
        slotOrder: existing.slots.length,
        value: slot,
      });
      return;
    }
    grouped.set(slot.weekId, {
      weekId: slot.weekId,
      russianWeekDay: slot.russianWeekDay,
      slots: [{ index, slotOrder: 0, value: slot }],
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.weekId - b.weekId);
}

defineExpose({ isIndividualHoursMatching, individualBudget, totalIndividualHours, individualHoursAvailable });
</script>
