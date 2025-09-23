<template>
  <div class="p-4 space-y-4">
    <div v-if="showDebug" class="px-4 py-2" :class="debugBgClass">
      <strong>Debug Info (EventForm):</strong><br />
      useCustomPeriod: {{ useCustomPeriodModel }}<br />
      startDate: {{ startDateModel }}<br />
      endDate: {{ endDateModel }}<br />
      semesterDates: {{ semesterDates }}<br />
      isFormValid: {{ isFormValid }}
    </div>

    <Select
      label="Результат обучения/дисциплина"
      placeholder="Выберите результат обучения/дисциплину"
      v-model="class9IdModel"
      :options="class9Options"
      name="event-class9-generic"
      id="event-class9-generic"
      searchable
      @before-open="closeParentPopover"
      @after-close="openParentPopover"
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
    </div>

    <div v-if="useCustomPeriodModel" class="flex justify-between items-center">
      <span class="text-sm text-foreground">Начало</span>
      <div class="w-1/2">
        <f7-input
          class="text-right"
          type="datepicker"
          placeholder="Дата"
          v-model:value="startDateModel"
          readonly
          :calendar-params="DATE_PICKER_PARAMS"
        ></f7-input>
      </div>
    </div>

    <div v-if="useCustomPeriodModel" class="flex justify-between items-center">
      <span class="text-sm text-foreground">Конец</span>
      <div class="w-1/2">
        <f7-input
          class="text-right"
          type="datepicker"
          placeholder="Дата"
          v-model:value="endDateModel"
          readonly
          :calendar-params="DATE_PICKER_PARAMS"
        ></f7-input>
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
        <i class="f7-icons text-muted-foreground ml-1">chevron_right</i>
      </span>
    </div>

    <ColorPicker v-model="eventColorObj" target-id="color-picker-generic" />

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
        {{ day.russianAbbreviation }}
      </div>
    </div>

    <template v-for="day in selectedWeekDaysModel" :key="day.weekId">
      <div class="text-foreground font-semibold mb-3">
        Время на {{ day.russianWeekDay.toLowerCase() }}
      </div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-muted-foreground text-sm">от</span>
        <Select
          v-model="day.startId"
          :options="startTimeOptions"
          placeholder="Выберите время"
          class="w-full"
          @update:modelValue="onSelectedWeekDayChanged()"
        />
        <span class="text-muted-foreground text-sm">до</span>
        <Select
          v-model="day.endId"
          :options="endTimeOptions"
          placeholder="Выберите время"
          class="w-full"
          @update:modelValue="onSelectedWeekDayChanged()"
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
        <i class="f7-icons text-muted-foreground ml-1">chevron_right</i>
      </span>
    </div>

    <StudentSelectionPopup
      ref="studentPopup"
      :selected-students="participantsModel"
      @save="handleStudentsSave"
      @close="handleStudentPopupClose"
    />

    <KtpDetailPopup
      :opened="isKtpPopupOpen"
      :ktp-id="getKtpIdForClass9(class9IdModel) || null"
      :module-title="getModuleTitleForKtp(getKtpIdForClass9(class9IdModel))"
      @update:opened="(v:boolean)=>{ isKtpPopupOpen=v }"
    />

    <slot />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from "vue";
import { f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Set Russian locale for consistent date parsing
dayjs.locale("ru");
dayjs.extend(customParseFormat);

import Select from "@/components/ui/Select.vue";
import ColorPicker from "@/components/ui/ColorPicker.vue";
import StudentSelectionPopup from "./StudentSelectionPopup.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";

import { useClass9Store } from "@/stores/class9Store";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupStore } from "@/stores/rupStore";
import { useKtpStore } from "@/stores/ktpStore";

import {
  WEEK_DAYS,
  DATE_PICKER_PARAMS,
  DATE_UI_FORMAT,
  DATE_STORAGE_FORMAT,
  DATE_PICKER_VALUE_FORMAT,
} from "@/constants/calendar";

type WeekDaySchedule = {
  weekId: number;
  russianWeekDay: string;
  startId: string;
  endId: string;
};

const props = defineProps<{
  class9Id: string;
  useCustomPeriod: boolean;
  startDate: string;
  endDate: string;
  participants: string[];
  color: string;
  selectedWeekDays: WeekDaySchedule[];
  parentPopoverId: string;
  mode?: "add" | "edit";
  showDebug?: boolean;
}>();

const emit = defineEmits<{
  (e: "update:class9Id", v: string): void;
  (e: "update:useCustomPeriod", v: boolean): void;
  (e: "update:startDate", v: string): void;
  (e: "update:endDate", v: string): void;
  (e: "update:participants", v: string[]): void;
  (e: "update:color", v: string): void;
  (e: "update:selectedWeekDays", v: WeekDaySchedule[]): void;
  (e: "update:valid", v: boolean): void;
}>();

const class9Store = useClass9Store();
const { class9Options } = storeToRefs(class9Store);

const educationScheduleStore = useEducationScheduleStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

const academicYearSemesterStore = useAcademicYearSemesterStore();
const { getActiveAcademicYearSemester } = storeToRefs(
  academicYearSemesterStore
);

const selectedItemsStore = useSelectedItemsStore();
const rupStore = useRupStore();

const ktpStore = useKtpStore();
const { getKtpIdForClass9, getModuleTitleForKtp } = storeToRefs(ktpStore);

const checkboxId = computed(() =>
  props.mode === "edit" ? "use-custom-period-edit" : "use-custom-period"
);
const showDebug = computed(() => props.showDebug ?? false);
const debugBgClass = computed(() =>
  props.mode === "edit" ? "bg-yellow-100 text-xs" : "bg-blue-100 text-xs"
);

const class9IdModel = computed({
  get: () => props.class9Id,
  set: (v: string) => emit("update:class9Id", v),
});
const useCustomPeriodModel = computed({
  get: () => props.useCustomPeriod,
  set: (v: boolean) => emit("update:useCustomPeriod", v),
});
const startDateModel = computed({
  get: () => {
    if (!props.startDate) return [new Date()];
    // Parse using the exact DD/MM/YYYY format
    const parsed = dayjs(props.startDate, DATE_UI_FORMAT, true);
    return parsed.isValid() ? [parsed.toDate()] : [new Date()];
  },
  set: (v: Date[]) => {
    if (Array.isArray(v) && v.length > 0) {
      const formatted = dayjs(v[0]).format(DATE_UI_FORMAT);
      if (formatted !== props.startDate) {
        emit("update:startDate", formatted);
      }
    }
  },
});
const endDateModel = computed({
  get: () => {
    if (!props.endDate) return [new Date()];
    // Parse using the exact DD/MM/YYYY format
    const parsed = dayjs(props.endDate, DATE_UI_FORMAT, true);
    return parsed.isValid() ? [parsed.toDate()] : [new Date()];
  },
  set: (v: Date[]) => {
    if (Array.isArray(v) && v.length > 0) {
      const formatted = dayjs(v[0]).format(DATE_UI_FORMAT);
      if (formatted !== props.endDate) {
        emit("update:endDate", formatted);
      }
    }
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

const eventColorObj = ref<{ hex: string }>({ hex: props.color || "#3F51B5" });
watch(
  () => props.color,
  (v) => {
    if (v && v !== eventColorObj.value.hex) {
      eventColorObj.value = { hex: v };
    }
  }
);
watch(
  () => eventColorObj.value.hex,
  (hex) => emit("update:color", hex)
);

const semesterDates = computed(() => {
  const activeSemester = getActiveAcademicYearSemester.value as any;
  if (activeSemester && activeSemester.startDate) {
    return {
      startDate: dayjs(activeSemester.startDate, DATE_STORAGE_FORMAT).format(
        DATE_UI_FORMAT
      ),
      endDate: dayjs(activeSemester.endDate, DATE_STORAGE_FORMAT).format(
        DATE_UI_FORMAT
      ),
    };
  }
  return null;
});

const dateValidationError = computed(() => {
  if (!useCustomPeriodModel.value) return null;
  if (!startDateModel.value?.length || !endDateModel.value?.length) return null;
  const start = dayjs(startDateModel.value[0]);
  const end = dayjs(endDateModel.value[0]);
  if (!end.isAfter(start, "day")) {
    return "Дата окончания должна быть как минимум на один день позже даты начала";
  }
  return null;
});

const isFormValid = computed(() => {
  const hasRequiredFields = !!class9IdModel.value;
  if (useCustomPeriodModel.value) {
    const hasValidDateRange =
      !!startDateModel.value?.length &&
      !!endDateModel.value?.length &&
      dayjs(endDateModel.value[0]).isAfter(
        dayjs(startDateModel.value[0]),
        "day"
      );
    return hasRequiredFields && hasValidDateRange;
  }
  return hasRequiredFields;
});

watchEffect(() => {
  emit("update:valid", isFormValid.value);
});

const startTimeOptions = computed(() =>
  getActiveYearSchedules.value.map((schedule) => ({
    value: schedule.id,
    text: schedule.startTime,
  }))
);
const endTimeOptions = computed(() =>
  getActiveYearSchedules.value.map((schedule) => ({
    value: schedule.id,
    text: schedule.endTime,
  }))
);

const weekDays = computed(() =>
  WEEK_DAYS.map((day) => ({
    ...day,
    isStartDate: false,
    isSelected: selectedWeekDaysModel.value.some(
      (selected) => selected.weekId === day.weekId
    ),
  }))
);

const selectWeekDay = (day: {
  weekId: number;
  russianAbbreviation: string;
  isStartDate: boolean;
  isSelected: boolean;
  name: string;
}) => {
  const current = selectedWeekDaysModel.value || [];
  const index = current.findIndex((d) => d.weekId === day.weekId);
  if (index === -1) {
    const updated = [
      ...current,
      { weekId: day.weekId, russianWeekDay: day.name, startId: "", endId: "" },
    ];
    selectedWeekDaysModel.value = updated;
  } else {
    const updated = [...current];
    updated.splice(index, 1);
    selectedWeekDaysModel.value = updated;
  }
};

const onSelectedWeekDayChanged = () => {
  // Trigger v-model sync after nested property change
  selectedWeekDaysModel.value = [...selectedWeekDaysModel.value];
};

const studentPopup = ref<{ open: (p: string[]) => void } | null>(null);
const isKtpPopupOpen = ref(false);

const openStreamSelection = () => {
  closeParentPopover();
  studentPopup.value?.open(participantsModel.value || []);
};
const handleStudentsSave = (selectedIds: string[]) => {
  participantsModel.value = selectedIds;
};
const handleStudentPopupClose = () => {
  openParentPopover();
};

const openKtpPopup = () => {
  isKtpPopupOpen.value = true;
};

const openParentPopover = () => {
  f7.popover.open(props.parentPopoverId);
};
const closeParentPopover = () => {
  f7.popover.close(props.parentPopoverId);
};

watch(class9IdModel, (newId) => {
  console.log("class9IdModel", newId);
  selectedItemsStore.setSelectedClass9ItemId(newId);
  rupStore.setSelectedClass9ItemId?.(newId as any);
});

watch(
  [useCustomPeriodModel, semesterDates],
  ([newUseCustomPeriod, newSemesterDates]) => {
    console.log("useCustomPeriodModel", newUseCustomPeriod);
    if (!newUseCustomPeriod && newSemesterDates) {
      const nextStart = newSemesterDates.startDate;
      const nextEnd = newSemesterDates.endDate;

      // Only update if the current values are different from the new values
      // This prevents infinite loops when the computed setters trigger the watcher again
      if (props.startDate !== nextStart) {
        emit("update:startDate", nextStart);
      }
      if (props.endDate !== nextEnd) {
        emit("update:endDate", nextEnd);
      }
    }
  },
  { immediate: true }
);
</script>

<style scoped></style>
