<template>
  <div class="p-4 space-y-4">
    <Select
      label="Результат обучения/дисциплина"
      placeholder="Выберите результат обучения/дисциплину"
      v-model="rupEntryIdModel"
      :options="rupEntryOptions"
      name="event-rupEntry-generic"
      id="event-rupEntry-generic"
      searchable
    />

    <div class="flex items-center">
      <f7-checkbox
        :id="checkboxId"
        v-model:checked="useCustomPeriodModel"
      ></f7-checkbox>
      <label :for="checkboxId" class="ml-2 text-sm text-foreground">
        Установить свой период
      </label>
    </div>

    <div
      v-if="!useCustomPeriodModel && semesterDates"
      class="mt-2 p-3 bg-muted rounded-lg border"
    >
      <div class="text-sm text-muted-foreground mb-1">Период:</div>
      <div class="text-sm font-medium text-foreground">
        {{ semesterDates.startDate }} - {{ semesterDates.endDate }}
      </div>
      <div
        v-if="semesterDates.semesterText"
        class="text-sm text-muted-foreground mt-1"
      >
        {{ semesterDates.semesterText }}
      </div>
    </div>

    <div v-if="useCustomPeriodModel" class="flex justify-between items-center">
      <span class="text-sm text-foreground">Начало</span>
      <div class="w-1/2">
        <DateInput
          v-model:value="startDateModel"
          placeholder="Дата"
        />
      </div>
    </div>

    <div v-if="useCustomPeriodModel" class="flex justify-between items-center">
      <span class="text-sm text-foreground">Конец</span>
      <div class="w-1/2">
        <DateInput
          v-model:value="endDateModel"
          placeholder="Дата"
        />
      </div>
    </div>

    <div
      v-if="useCustomPeriodModel && dateValidationError"
      class="text-destructive text-sm"
    >
      {{ dateValidationError }}
    </div>

    <div
      class="flex justify-between items-center cursor-pointer"
      id="event-form-participants"
      @click="openStreamSelection"
    >
      <span class="text-sm text-foreground">Обучающиеся</span>
      <span class="text-muted-foreground flex items-center">
        {{ participantsModel.length || "Не выбрано" }}
        <IconChevronRight class="text-muted-foreground ml-1" />
      </span>
    </div>

    <ColorPicker v-model="colorModelObj" target-id="color-picker-generic" />

    <div class="text-foreground font-semibold mb-3">Недели</div>
    <div class="flex justify-between gap-1">
      <div
        v-for="(day, index) in weekDays"
        :key="index"
        class="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
        :class="{
          'bg-primary text-primary-foreground':
            day.isSelected && !day.isStartDate,
          'bg-secondary text-secondary-foreground hover:bg-secondary/80':
            !day.isStartDate && !day.isSelected,
        }"
        @click="selectWeekDay(day)"
      >
        {{ day.abbreviation }}
      </div>
    </div>

    <template v-for="day in selectedWeekDaysModel" :key="day.weekId">
      <div class="text-foreground font-semibold mb-3">
        Время на {{ day.russianWeekDay.toLowerCase() }}
      </div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-muted-foreground text-sm">от</span>
        <Select
          :modelValue="day.startId"
          :options="startTimeOptions"
          placeholder="Выберите время"
          class="w-full"
          @update:modelValue="(v) => updateWeekDayTime(day.weekId, 'startId', v)"
        />
        <span class="text-muted-foreground text-sm">до</span>
        <Select
          :modelValue="day.endId"
          :options="endTimeOptions"
          placeholder="Выберите время"
          class="w-full"
          @update:modelValue="(v) => updateWeekDayTime(day.weekId, 'endId', v)"
        />
      </div>
    </template>

    <div
      class="flex justify-between items-center cursor-pointer"
      id="event-form-ktp"
      @click="openKtpPopup"
    >
      <span class="text-sm text-foreground">РУП/КТП</span>
      <span class="text-muted-foreground flex items-center">
        Открыть
        <IconChevronRight class="text-muted-foreground ml-1" />
      </span>
    </div>

    <!-- Planned Hours Display -->
    <div class="bg-secondary p-4 border-t border-input">
      <div class="flex justify-between mb-2">
        <span class="text-foreground">Выбрано:</span>
        <span
          class="font-medium"
          :class="isSelectedHoursExceeded ? 'text-red-700' : 'text-foreground'"
          >{{ selectedHoursText }} часов</span
        >
      </div>
      <div class="flex justify-between mb-2">
        <span class="text-foreground">Запланировано на семестр:</span>
        <span class="text-foreground font-medium"
          >{{ semesterPlannedHoursText }} часов</span
        >
      </div>
      <div class="flex justify-between">
        <span class="text-foreground">Запланировано на весь предмет:</span>
        <span class="text-foreground font-medium"
          >{{ totalPlannedHoursText }} часов</span
        >
      </div>
    </div>

    <div v-if="hoursExceededError" class="text-destructive text-sm mt-2">
      {{ hoursExceededError }}
    </div>

    <StudentSelectionPopup
      ref="studentPopup"
      :selected-students="participantsModel"
      :rup-entry-id="rupEntryIdModel"
      @save="handleStudentsSave"
      @close="handleStudentPopupClose"
    />

    <KtpDetailPopup
      :opened="isKtpPopupOpen"
      :ktp-id="currentKtpId"
      :module-title="currentKtpTitle"
      @update:opened="handleKtpPopupClosed"
    />

    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { f7 } from "framework7-vue";
import IconChevronRight from "~icons/lucide/chevron-right";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/ru";

import Select from "@/components/ui/Select.vue";
import ColorPicker from "@/components/ui/ColorPicker.vue";
import DateInput from "@/components/ui/DateInput.vue";
import StudentSelectionPopup from "./StudentSelectionPopup.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";

import {
  getWeekDays,
  DATE_UI_FORMAT,
} from "@/constants/calendar";

import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useKtpStore } from "@/stores/ktpStore";
import { useNestedPopover } from "@/composables/useNestedPopover";
import { useNestedPopup } from "@/composables/useNestedPopup";
import type { SemesterDates, WeekDaySchedule } from "./useEventFormDerived";

dayjs.extend(customParseFormat);
dayjs.locale("ru");

const props = defineProps<{
  rupEntryId: string;
  useCustomPeriod: boolean;
  startDate?: string;
  endDate?: string;
  participants: string[];
  color: string;
  selectedWeekDays: WeekDaySchedule[];
  parentPopoverId: string;
  parentPopoverType?: "popover" | "popup";
  mode?: "add" | "edit";
  semester?: string;
  eventId?: string;
  semesterDates?: SemesterDates | null;
  totalPlannedHours?: string;
  semesterPlannedHours?: string;
  selectedHours?: string;
  hoursExceededError?: string | null;
  dateValidationError?: string | null;
}>();

const emit = defineEmits<{
  (e: "update:rupEntryId", v: string): void;
  (e: "update:useCustomPeriod", v: boolean): void;
  (e: "update:startDate", v: string): void;
  (e: "update:endDate", v: string): void;
  (e: "update:participants", v: string[]): void;
  (e: "update:color", v: string): void;
  (e: "update:selectedWeekDays", v: WeekDaySchedule[]): void;
}>();

const rupEntryStore = useRupEntryStore();
const { rupEntryOptions } = storeToRefs(rupEntryStore);

const educationScheduleStore = useEducationScheduleStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

const academicYearSemesterStore = useAcademicYearSemesterStore();
const ktpStore = useKtpStore();

const popoverNested = useNestedPopover({
  parentPopoverId: computed(() => props.parentPopoverId),
});
const popupNested = useNestedPopup({
  parentPopupId: computed(() => props.parentPopoverId),
});
const isParentPopup = computed(() => (props.parentPopoverType ?? "popover") === "popup");

const closeParent = () => {
  if (isParentPopup.value) {
    popupNested.closeParent();
    return;
  }
  popoverNested.closeParent();
};

const openParent = () => {
  if (isParentPopup.value) {
    popupNested.openParent();
    return;
  }
  popoverNested.openParent();
};

const withParentToggle = <T extends (...args: any[]) => any>(fn: T): T => {
  return ((...args: any[]) => {
    closeParent();
    return fn(...args);
  }) as T;
};

const checkboxId = computed(() => {
  return props.mode === "edit" ? "use-custom-period-edit" : "use-custom-period";
});

const rupEntryIdModel = computed({
  get: () => props.rupEntryId,
  set: (v: string) => emit("update:rupEntryId", v),
});

const useCustomPeriodModel = computed({
  get: () => props.useCustomPeriod,
  set: (v: boolean) => emit("update:useCustomPeriod", v),
});

function parseUiDate(ui?: string): Date | null {
  if (!ui) return null;
  const parsed = dayjs(ui, DATE_UI_FORMAT, true);
  return parsed.isValid() ? parsed.toDate() : null;
}

const startDateModel = computed<Date[]>({
  get: () => {
    const explicit = parseUiDate(props.startDate);
    if (explicit) return [explicit];

    const fallback = parseUiDate(props.semesterDates?.startDate);
    if (fallback) return [fallback];

    return [new Date()];
  },
  set: (v: Date[]) => {
    const date = Array.isArray(v) ? v[0] : undefined;
    if (!date) return;
    emit("update:startDate", dayjs(date).format(DATE_UI_FORMAT));
  },
});

const endDateModel = computed<Date[]>({
  get: () => {
    const explicit = parseUiDate(props.endDate);
    if (explicit) return [explicit];

    const fallback = parseUiDate(props.semesterDates?.endDate);
    if (fallback) return [fallback];

    return [new Date()];
  },
  set: (v: Date[]) => {
    const date = Array.isArray(v) ? v[0] : undefined;
    if (!date) return;
    emit("update:endDate", dayjs(date).format(DATE_UI_FORMAT));
  },
});

const participantsModel = computed({
  get: () => props.participants,
  set: (v: string[]) => emit("update:participants", v),
});

const selectedWeekDaysModel = computed<WeekDaySchedule[]>({
  get: () => props.selectedWeekDays,
  set: (v: WeekDaySchedule[]) => emit("update:selectedWeekDays", v),
});

const colorModelObj = computed({
  get: () => ({ hex: props.color || "#3F51B5" }),
  set: (v: { hex: string }) => emit("update:color", v?.hex || "#3F51B5"),
});

const startTimeOptions = computed(() => {
  return getActiveYearSchedules.value.map((schedule) => ({
    value: schedule.id,
    text: schedule.startTime,
  }));
});

const endTimeOptions = computed(() => {
  return getActiveYearSchedules.value.map((schedule) => ({
    value: schedule.id,
    text: schedule.endTime,
  }));
});

const weekDays = computed(() => {
  return getWeekDays().map((day) => ({
    ...day,
    isStartDate: false,
    isSelected: selectedWeekDaysModel.value.some(
      (selected) => selected.weekId === day.weekId
    ),
  }));
});

function selectWeekDay(day: { weekId: number; name: string }) {
  const current = selectedWeekDaysModel.value || [];
  const exists = current.some((d) => d.weekId === day.weekId);
  if (exists) {
    selectedWeekDaysModel.value = current.filter((d) => d.weekId !== day.weekId);
    return;
  }
  selectedWeekDaysModel.value = [
    ...current,
    { weekId: day.weekId, russianWeekDay: day.name, startId: "", endId: "" },
  ];
}

function updateWeekDayTime(
  weekId: number,
  field: "startId" | "endId",
  value: string | number | Array<string | number>
) {
  const nextValue =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? String(value[0] ?? "")
        : String(value);

  const current = selectedWeekDaysModel.value || [];
  const index = current.findIndex((d) => d.weekId === weekId);
  if (index === -1) return;

  const existing = current[index];
  if (existing[field] === nextValue) return;

  const updated = { ...existing, [field]: nextValue };
  selectedWeekDaysModel.value = [
    ...current.slice(0, index),
    updated,
    ...current.slice(index + 1),
  ];
}

const studentPopup = ref<{ open: (p: string[]) => void } | null>(null);

const openStreamSelection = withParentToggle(() => {
  studentPopup.value?.open(participantsModel.value || []);
});

function handleStudentsSave(selectedIds: string[]) {
  participantsModel.value = selectedIds;
}

function handleStudentPopupClose() {
  openParent();
}

const isKtpPopupOpen = ref(false);
const currentKtpIdRef = ref<string | null>(null);

const effectiveSemesterId = computed(() => {
  return (
    props.semester ||
    (academicYearSemesterStore.getActiveAcademicYearSemester as any)?.id ||
    ""
  );
});

const semesterForKtp = computed(() => {
  if (!effectiveSemesterId.value) return null;
  return (
    academicYearSemesterStore.getAcademicYearSemesterById(effectiveSemesterId.value) ||
    null
  );
});

const currentKtpId = computed(() => {
  if (currentKtpIdRef.value) return currentKtpIdRef.value;
  if (!rupEntryIdModel.value || !semesterForKtp.value) return null;
  const existing = ktpStore.findKtpByRupEntryId(
    rupEntryIdModel.value,
    semesterForKtp.value.academicYearId,
    semesterForKtp.value.id,
    props.eventId
  );
  return existing?.id || null;
});

const currentKtpTitle = computed(() => {
  if (!currentKtpId.value || !rupEntryIdModel.value) return undefined;
  const rupEntryItem = rupEntryStore.getRupEntryById(rupEntryIdModel.value);
  if (!rupEntryItem) return undefined;
  return `${rupEntryItem.moduleIndex} - ${rupEntryItem.moduleName}`;
});

function handleKtpPopupClosed(isOpen: boolean) {
  isKtpPopupOpen.value = isOpen;
  if (!isOpen) openParent();
}

async function openKtpPopup() {
  if (!rupEntryIdModel.value) {
    f7.dialog.alert(
      "Пожалуйста, сначала выберите результат обучения/дисциплину",
      "Внимание"
    );
    return;
  }

  if (!semesterForKtp.value) {
    f7.dialog.alert("Не удалось определить семестр", "Ошибка");
    return;
  }

  try {
    const ktp = await ktpStore.ensureKtpForRupEntry(
      rupEntryIdModel.value,
      semesterForKtp.value.academicYearId,
      semesterForKtp.value.id,
      props.eventId
    );
    currentKtpIdRef.value = ktp.id;
    closeParent();
    isKtpPopupOpen.value = true;
  } catch (error) {
    console.error("Failed to ensure KTP:", error);
    f7.dialog.alert("Не удалось создать КТП", "Ошибка");
  }
}

const selectedHoursText = computed(() => props.selectedHours || "0");
const semesterPlannedHoursText = computed(() => props.semesterPlannedHours || "0");
const totalPlannedHoursText = computed(() => props.totalPlannedHours || "0");

const isSelectedHoursExceeded = computed(() => {
  return Number(selectedHoursText.value) > Number(semesterPlannedHoursText.value);
});
</script>

<style scoped></style>
