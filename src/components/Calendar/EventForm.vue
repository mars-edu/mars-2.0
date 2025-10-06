<template>
  <div class="p-4 space-y-4">
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

    <!-- Planned Hours Display -->
    <div class="bg-secondary p-4 border-t border-input">
      <div class="flex justify-between mb-2">
        <span class="text-foreground">Выбрано:</span>
        <span
          class="font-medium"
          :class="isSelectedHoursExceeded ? 'text-red-700' : 'text-foreground'"
          >{{ selectedHours }} часов</span
        >
      </div>
      <div class="flex justify-between mb-2">
        <span class="text-foreground">Запланировано на семестр:</span>
        <span class="text-foreground font-medium"
          >{{ semesterPlannedHours }} часов</span
        >
      </div>
      <div class="flex justify-between">
        <span class="text-foreground">Запланировано на весь предмет:</span>
        <span class="text-foreground font-medium"
          >{{ totalPlannedHours }} часов</span
        >
      </div>
    </div>

    <div v-if="hoursExceededError" class="text-destructive text-sm mt-2">
      {{ hoursExceededError }}
    </div>

    <StudentSelectionPopup
      ref="studentPopup"
      :selected-students="participantsModel"
      :class9-id="class9IdModel"
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
import { computed, ref, watch, watchEffect, onUnmounted } from "vue";
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

// Helper to avoid emitting unchanged weekly schedules
function areWeekDaySchedulesEqual(
  a: WeekDaySchedule[] | undefined,
  b: WeekDaySchedule[] | undefined
): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    const ai = a[i];
    const bi = b[i];
    if (!bi) return false;
    if (
      ai.weekId !== bi.weekId ||
      ai.russianWeekDay !== bi.russianWeekDay ||
      ai.startId !== bi.startId ||
      ai.endId !== bi.endId
    ) {
      return false;
    }
  }
  return true;
}

const props = defineProps<{
  class9Id: string;
  useCustomPeriod: boolean;
  startDate?: string;
  endDate?: string;
  participants: string[];
  color: string;
  selectedWeekDays: WeekDaySchedule[];
  parentPopoverId: string;
  mode?: "add" | "edit";
}>();

// Add watchers to track prop changes
watch(
  () => props.class9Id,
  (newVal, oldVal) => {
    console.log("🔄 PROPS class9Id changed:", { oldVal, newVal });
  },
  { immediate: true }
);

watch(
  () => props.useCustomPeriod,
  (newVal, oldVal) => {
    console.log("🔄 PROPS useCustomPeriod changed:", { oldVal, newVal });
  },
  { immediate: true }
);

watch(
  () => props.startDate,
  (newVal, oldVal) => {
    console.log("🔄 PROPS startDate changed:", { oldVal, newVal });
  },
  { immediate: true }
);

watch(
  () => props.endDate,
  (newVal, oldVal) => {
    console.log("🔄 PROPS endDate changed:", { oldVal, newVal });
  },
  { immediate: true }
);

watch(
  () => props.participants,
  (newVal, oldVal) => {
    console.log("🔄 PROPS participants changed:", { oldVal, newVal });
  },
  { deep: true, immediate: true }
);

watch(
  () => props.color,
  (newVal, oldVal) => {
    console.log("🔄 PROPS color changed:", { oldVal, newVal });
  },
  { immediate: true }
);

watch(
  () => props.selectedWeekDays,
  (newVal, oldVal) => {
    console.log("🔄 PROPS selectedWeekDays changed:", { oldVal, newVal });
  },
  { deep: true, immediate: true }
);

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

// Watch store changes
watch(
  class9Options,
  (newVal, oldVal) => {
    console.log("🔄 STORE class9Options changed:", {
      oldLength: oldVal?.length,
      newLength: newVal?.length,
    });
  },
  { deep: true, immediate: true }
);

const educationScheduleStore = useEducationScheduleStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

// Watch store changes
watch(
  getActiveYearSchedules,
  (newVal, oldVal) => {
    console.log("🔄 STORE getActiveYearSchedules changed:", {
      oldLength: oldVal?.length,
      newLength: newVal?.length,
    });
  },
  { deep: true, immediate: true }
);

const academicYearSemesterStore = useAcademicYearSemesterStore();
const { getActiveAcademicYearSemester } = storeToRefs(
  academicYearSemesterStore
);

// Watch store changes
watch(
  getActiveAcademicYearSemester,
  (newVal, oldVal) => {
    console.log("🔄 STORE getActiveAcademicYearSemester changed:", {
      oldVal,
      newVal,
    });
  },
  { deep: true, immediate: true }
);

const selectedItemsStore = useSelectedItemsStore();
const { selectedClass9Item } = storeToRefs(selectedItemsStore);

// Watch store changes
watch(
  selectedClass9Item,
  (newVal, oldVal) => {
    console.log("🔄 STORE selectedClass9Item changed:", { oldVal, newVal });
  },
  { immediate: true }
);

const rupStore = useRupStore();

const ktpStore = useKtpStore();
const { getKtpIdForClass9, getModuleTitleForKtp } = storeToRefs(ktpStore);

// Watch store changes
watch(
  getKtpIdForClass9,
  (newVal, oldVal) => {
    console.log("🔄 STORE getKtpIdForClass9 changed:", { oldVal, newVal });
  },
  { immediate: true }
);

watch(
  getModuleTitleForKtp,
  (newVal, oldVal) => {
    console.log("🔄 STORE getModuleTitleForKtp changed:", { oldVal, newVal });
  },
  { immediate: true }
);

const checkboxId = computed(() => {
  callCounters.checkboxId.calls++;
  const result =
    props.mode === "edit" ? "use-custom-period-edit" : "use-custom-period";
  console.log(
    `🔄 checkboxId computed called (call #${callCounters.checkboxId.calls})`,
    { mode: props.mode, result }
  );
  return result;
});

const totalPlannedHours = computed(() => {
  callCounters.totalPlannedHours.calls++;
  console.log(
    `🔄 totalPlannedHours computed called (call #${callCounters.totalPlannedHours.calls})`,
    {
      class9IdModel: class9IdModel.value,
    }
  );
  const selectedClass9 = class9Store.getClass9ById(class9IdModel.value);
  if (!selectedClass9) {
    console.log("✅ totalPlannedHours result: '0' (no class9 found)");
    return "0";
  }
  const result = selectedClass9.totalHours || "0";
  console.log("✅ totalPlannedHours result:", result, {
    selectedClass9: selectedClass9.totalHours,
  });
  return result;
});

const semesterPlannedHours = computed(() => {
  callCounters.semesterPlannedHours.calls++;
  console.log(
    `🔄 semesterPlannedHours computed called (call #${callCounters.semesterPlannedHours.calls})`,
    {
      class9IdModel: class9IdModel.value,
      activeSemester: getActiveAcademicYearSemester.value,
    }
  );

  const selectedClass9 = class9Store.getClass9ById(class9IdModel.value);
  const activeSemester = getActiveAcademicYearSemester.value as any;

  if (!selectedClass9 || !activeSemester) {
    console.log("✅ semesterPlannedHours result: '0' (no class9 or semester)");
    return "0";
  }

  const semesterNumber = String(activeSemester.semesterNumber ?? "");
  const activeYearId = activeSemester.academicYearId;

  const matchedEntry = selectedClass9.distributionEntries.find((entry) => {
    const entrySemesterId = String(entry.semesterId ?? "");
    const matchesSemester =
      entrySemesterId === String(activeSemester.id) ||
      entrySemesterId === semesterNumber;
    const matchesYear =
      !entry.academicYearId || !activeYearId
        ? matchesSemester
        : entry.academicYearId === activeYearId && matchesSemester;
    return matchesYear;
  });

  if (
    !matchedEntry ||
    matchedEntry.hours === undefined ||
    matchedEntry.hours === null
  ) {
    console.log("✅ semesterPlannedHours result: '0' (no matching entry)");
    return "0";
  }

  const result = String(matchedEntry.hours);
  console.log("✅ semesterPlannedHours result:", result, {
    matchedEntry: matchedEntry.hours,
  });
  return result;
});

const selectedHours = computed(() => {
  callCounters.selectedHours.calls++;
  console.log(
    `🔄 selectedHours computed called (call #${callCounters.selectedHours.calls})`,
    {
      selectedWeekDaysModel: selectedWeekDaysModel.value,
      schedulesCount: getActiveYearSchedules.value.length,
    }
  );

  let hoursPerWeek = 0;
  const schedules = getActiveYearSchedules.value;

  for (const day of selectedWeekDaysModel.value) {
    if (!day.startId || !day.endId) {
      continue;
    }

    const startIndex = schedules.findIndex((s) => s.id === day.startId);
    const endIndex = schedules.findIndex((s) => s.id === day.endId);

    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      const hours = endIndex - startIndex + 1;
      hoursPerWeek += hours;
      console.log(
        `📊 Day ${day.russianWeekDay}: ${hours} hours (${startIndex} to ${endIndex})`
      );
    }
  }

  let startDate: dayjs.Dayjs | null = null;
  let endDate: dayjs.Dayjs | null = null;

  if (useCustomPeriodModel.value) {
    if (startDateModel.value?.length && endDateModel.value?.length) {
      startDate = dayjs(startDateModel.value[0]);
      endDate = dayjs(endDateModel.value[0]);
    }
  } else if (semesterDates.value) {
    startDate = dayjs(semesterDates.value.startDate, DATE_UI_FORMAT);
    endDate = dayjs(semesterDates.value.endDate, DATE_UI_FORMAT);
  }

  let weekCount = 0;
  if (startDate && endDate && startDate.isValid() && endDate.isValid()) {
    const daysDiff = endDate.diff(startDate, "day") + 1;
    weekCount = Math.ceil(daysDiff / 7);
    console.log(`📊 Date range: ${daysDiff} days = ${weekCount} weeks`);
  }

  const totalHours = hoursPerWeek * weekCount;
  console.log("✅ selectedHours result:", totalHours, {
    hoursPerWeek,
    weekCount,
  });
  return String(totalHours);
});

const isSelectedHoursExceeded = computed(() => {
  callCounters.isSelectedHoursExceeded.calls++;
  const selected = Number(selectedHours.value);
  const planned = Number(semesterPlannedHours.value);
  const result = selected > planned;
  console.log(
    `🔄 isSelectedHoursExceeded computed called (call #${callCounters.isSelectedHoursExceeded.calls})`,
    {
      selected,
      planned,
      exceeded: result,
    }
  );
  return result;
});

const hoursExceededError = computed(() => {
  callCounters.hoursExceededError.calls++;
  if (isSelectedHoursExceeded.value) {
    const result = `Выбранное количество часов (${selectedHours.value}) превышает запланированное на семестр (${semesterPlannedHours.value})`;
    console.log("✅ hoursExceededError result:", result);
    return result;
  }
  console.log("✅ hoursExceededError result: null");
  return null;
});

const class9IdModel = computed({
  get: () => {
    callCounters.class9IdModel.calls++;
    console.log(
      `🔄 class9IdModel GETTER called (call #${callCounters.class9IdModel.calls})`,
      {
        propsClass9Id: props.class9Id,
      }
    );
    return props.class9Id;
  },
  set: (v: string) => {
    console.log("🔄 class9IdModel SETTER called", {
      v,
      current: props.class9Id,
    });
    emit("update:class9Id", v);
  },
});
const useCustomPeriodModel = computed({
  get: () => {
    callCounters.useCustomPeriodModel.calls++;
    console.log(
      `🔄 useCustomPeriodModel GETTER called (call #${callCounters.useCustomPeriodModel.calls})`,
      {
        propsUseCustomPeriod: props.useCustomPeriod,
      }
    );
    return props.useCustomPeriod;
  },
  set: (v: boolean) => {
    console.log("🔄 useCustomPeriodModel SETTER called", {
      v,
      current: props.useCustomPeriod,
    });
    emit("update:useCustomPeriod", v);
  },
});
const startDateModel = computed({
  get: () => {
    callCounters.startDateModel.calls++;
    console.log(
      `🔄 startDateModel GETTER called (call #${callCounters.startDateModel.calls})`,
      {
        propsStartDate: props.startDate,
        semesterDates: semesterDates.value,
        currentValue: props.startDate
          ? dayjs(props.startDate, DATE_UI_FORMAT, true).isValid()
          : "invalid",
      }
    );

    // Use prop value if provided and valid
    if (props.startDate) {
      const parsed = dayjs(props.startDate, DATE_UI_FORMAT, true);
      if (parsed.isValid()) {
        console.log(
          "✅ startDateModel using props.startDate:",
          props.startDate
        );
        return [parsed.toDate()];
      }
    }

    // Use semester dates if available
    if (semesterDates.value) {
      const parsed = dayjs(semesterDates.value.startDate, DATE_UI_FORMAT, true);
      if (parsed.isValid()) {
        console.log(
          "✅ startDateModel using semesterDates.startDate:",
          semesterDates.value.startDate
        );
        return [parsed.toDate()];
      }
    }

    // Fallback to current date
    console.log("✅ startDateModel fallback to current date");
    return [new Date()];
  },
  set: (v: Date[]) => {
    console.log("🔄 startDateModel SETTER called", {
      v,
      propsStartDate: props.startDate,
    });
    if (Array.isArray(v) && v.length > 0) {
      const formatted = dayjs(v[0]).format(DATE_UI_FORMAT);
      if (formatted !== props.startDate) {
        console.log("📤 startDateModel emitting update:startDate:", formatted);
        emit("update:startDate", formatted);
      } else {
        console.log("⚠️ startDateModel no change needed");
      }
    }
  },
});
const endDateModel = computed({
  get: () => {
    callCounters.endDateModel.calls++;
    console.log(
      `🔄 endDateModel GETTER called (call #${callCounters.endDateModel.calls})`,
      {
        propsEndDate: props.endDate,
        semesterDates: semesterDates.value,
        currentValue: props.endDate
          ? dayjs(props.endDate, DATE_UI_FORMAT, true).isValid()
          : "invalid",
      }
    );

    // Use prop value if provided and valid
    if (props.endDate) {
      const parsed = dayjs(props.endDate, DATE_UI_FORMAT, true);
      if (parsed.isValid()) {
        console.log("✅ endDateModel using props.endDate:", props.endDate);
        return [parsed.toDate()];
      }
    }

    // Use semester dates if available
    if (semesterDates.value) {
      const parsed = dayjs(semesterDates.value.endDate, DATE_UI_FORMAT, true);
      if (parsed.isValid()) {
        console.log(
          "✅ endDateModel using semesterDates.endDate:",
          semesterDates.value.endDate
        );
        return [parsed.toDate()];
      }
    }

    // Fallback to current date
    console.log("✅ endDateModel fallback to current date");
    return [new Date()];
  },
  set: (v: Date[]) => {
    console.log("🔄 endDateModel SETTER called", {
      v,
      propsEndDate: props.endDate,
    });
    if (Array.isArray(v) && v.length > 0) {
      const formatted = dayjs(v[0]).format(DATE_UI_FORMAT);
      if (formatted !== props.endDate) {
        console.log("📤 endDateModel emitting update:endDate:", formatted);
        emit("update:endDate", formatted);
      } else {
        console.log("⚠️ endDateModel no change needed");
      }
    }
  },
});
const participantsModel = computed({
  get: () => {
    callCounters.participantsModel.calls++;
    console.log(
      `🔄 participantsModel GETTER called (call #${callCounters.participantsModel.calls})`,
      {
        propsParticipants: props.participants,
      }
    );
    return props.participants;
  },
  set: (v: string[]) => {
    console.log("🔄 participantsModel SETTER called", {
      v,
      current: props.participants,
    });
    emit("update:participants", v);
  },
});
const selectedWeekDaysModel = computed<WeekDaySchedule[]>({
  get: () => {
    callCounters.selectedWeekDaysModel.calls++;
    console.log(
      `🔄 selectedWeekDaysModel GETTER called (call #${callCounters.selectedWeekDaysModel.calls})`,
      {
        selectedWeekDays: props.selectedWeekDays,
      }
    );
    return props.selectedWeekDays;
  },
  set: (v: WeekDaySchedule[]) => {
    console.log("🔄 selectedWeekDaysModel SETTER called", {
      v,
      current: props.selectedWeekDays,
    });
    if (areWeekDaySchedulesEqual(v, props.selectedWeekDays)) {
      console.log("⚠️ selectedWeekDaysModel no change needed (deep equal)");
      return;
    }
    emit("update:selectedWeekDays", v);
  },
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
  callCounters.semesterDates.calls++;
  console.log(
    `🔄 semesterDates computed called (call #${callCounters.semesterDates.calls})`,
    {
      activeSemester: getActiveAcademicYearSemester.value,
    }
  );
  const activeSemester = getActiveAcademicYearSemester.value as any;
  if (activeSemester && activeSemester.startDate) {
    const result = {
      startDate: dayjs(activeSemester.startDate, DATE_STORAGE_FORMAT).format(
        DATE_UI_FORMAT
      ),
      endDate: dayjs(activeSemester.endDate, DATE_STORAGE_FORMAT).format(
        DATE_UI_FORMAT
      ),
    };
    console.log("✅ semesterDates result:", result);
    return result;
  }
  console.log("✅ semesterDates result: null");
  return null;
});

const dateValidationError = computed(() => {
  callCounters.dateValidationError.calls++;
  console.log(
    `🔄 dateValidationError computed called (call #${callCounters.dateValidationError.calls})`,
    {
      useCustomPeriodModel: useCustomPeriodModel.value,
      startDateModelLength: startDateModel.value?.length,
      endDateModelLength: endDateModel.value?.length,
    }
  );

  if (!useCustomPeriodModel.value) {
    console.log(
      "✅ dateValidationError result: null (not using custom period)"
    );
    return null;
  }
  if (!startDateModel.value?.length || !endDateModel.value?.length) {
    console.log("✅ dateValidationError result: null (missing dates)");
    return null;
  }
  const start = dayjs(startDateModel.value[0]);
  const end = dayjs(endDateModel.value[0]);
  if (!end.isAfter(start, "day")) {
    const result =
      "Дата окончания должна быть как минимум на один день позже даты начала";
    console.log("✅ dateValidationError result:", result);
    return result;
  }
  console.log("✅ dateValidationError result: null (valid dates)");
  return null;
});

const isFormValid = computed(() => {
  callCounters.isFormValid.calls++;
  console.log(
    `🔄 isFormValid computed called (call #${callCounters.isFormValid.calls})`,
    {
      class9IdModel: class9IdModel.value,
      useCustomPeriodModel: useCustomPeriodModel.value,
      startDateModelLength: startDateModel.value?.length,
      endDateModelLength: endDateModel.value?.length,
      isSelectedHoursExceeded: isSelectedHoursExceeded.value,
    }
  );

  const hasRequiredFields = !!class9IdModel.value;
  const hoursNotExceeded = !isSelectedHoursExceeded.value;

  if (useCustomPeriodModel.value) {
    const hasValidDateRange =
      !!startDateModel.value?.length &&
      !!endDateModel.value?.length &&
      dayjs(endDateModel.value[0]).isAfter(
        dayjs(startDateModel.value[0]),
        "day"
      );
    const result = hasRequiredFields && hasValidDateRange && hoursNotExceeded;
    console.log("✅ isFormValid result:", result, {
      hasRequiredFields,
      hasValidDateRange,
      hoursNotExceeded,
    });
    return result;
  }
  const result = hasRequiredFields && hoursNotExceeded;
  console.log("✅ isFormValid result:", result, {
    hasRequiredFields,
    hoursNotExceeded,
  });
  return result;
});

// Add call counters for debugging
const callCounters = {
  startDateModel: { calls: 0 },
  endDateModel: { calls: 0 },
  selectedWeekDaysModel: { calls: 0 },
  isFormValid: { calls: 0 },
  semesterDates: { calls: 0 },
  dateValidationError: { calls: 0 },
  totalPlannedHours: { calls: 0 },
  semesterPlannedHours: { calls: 0 },
  selectedHours: { calls: 0 },
  isSelectedHoursExceeded: { calls: 0 },
  hoursExceededError: { calls: 0 },
  class9IdModel: { calls: 0 },
  useCustomPeriodModel: { calls: 0 },
  participantsModel: { calls: 0 },
  weekDays: { calls: 0 },
  startTimeOptions: { calls: 0 },
  endTimeOptions: { calls: 0 },
  checkboxId: { calls: 0 },
};

watchEffect(() => {
  callCounters.isFormValid.calls++;
  console.log(
    `🔄 WATCH_EFFECT [isFormValid] called (call #${callCounters.isFormValid.calls})`,
    {
      isFormValid: isFormValid.value,
      dependencies: {
        class9IdModel: class9IdModel.value,
        useCustomPeriodModel: useCustomPeriodModel.value,
        startDateModelLength: startDateModel.value?.length,
        endDateModelLength: endDateModel.value?.length,
      },
    }
  );
  emit("update:valid", isFormValid.value);
});

const startTimeOptions = computed(() => {
  callCounters.startTimeOptions.calls++;
  console.log(
    `🔄 startTimeOptions computed called (call #${callCounters.startTimeOptions.calls})`,
    {
      schedulesCount: getActiveYearSchedules.value.length,
    }
  );
  const result = getActiveYearSchedules.value.map((schedule) => ({
    value: schedule.id,
    text: schedule.startTime,
  }));
  console.log("✅ startTimeOptions result:", result.length, "options");
  return result;
});
const endTimeOptions = computed(() => {
  callCounters.endTimeOptions.calls++;
  console.log(
    `🔄 endTimeOptions computed called (call #${callCounters.endTimeOptions.calls})`,
    {
      schedulesCount: getActiveYearSchedules.value.length,
    }
  );
  const result = getActiveYearSchedules.value.map((schedule) => ({
    value: schedule.id,
    text: schedule.endTime,
  }));
  console.log("✅ endTimeOptions result:", result.length, "options");
  return result;
});

const weekDays = computed(() => {
  callCounters.weekDays.calls++;
  console.log(
    `🔄 weekDays computed called (call #${callCounters.weekDays.calls})`,
    {
      weekDaysCount: WEEK_DAYS.length,
      selectedWeekDaysModelCount: selectedWeekDaysModel.value.length,
    }
  );

  const result = WEEK_DAYS.map((day) => ({
    ...day,
    isStartDate: false,
    isSelected: selectedWeekDaysModel.value.some(
      (selected) => selected.weekId === day.weekId
    ),
  }));

  console.log("✅ weekDays result:", result.length, "days");
  return result;
});

const selectWeekDay = (day: {
  weekId: number;
  russianAbbreviation: string;
  isStartDate: boolean;
  isSelected: boolean;
  name: string;
}) => {
  console.log("🔄 selectWeekDay called", {
    day,
    selectedWeekDaysModelBefore: selectedWeekDaysModel.value,
  });

  const current = selectedWeekDaysModel.value || [];
  const index = current.findIndex((d) => d.weekId === day.weekId);

  if (index === -1) {
    const updated = [
      ...current,
      { weekId: day.weekId, russianWeekDay: day.name, startId: "", endId: "" },
    ];
    console.log("➕ selectWeekDay adding day:", day.name);
    selectedWeekDaysModel.value = updated;
  } else {
    const updated = [...current];
    updated.splice(index, 1);
    console.log("➖ selectWeekDay removing day:", day.name);
    selectedWeekDaysModel.value = updated;
  }

  console.log("✅ selectWeekDay after update:", selectedWeekDaysModel.value);
};

const onSelectedWeekDayChanged = () => {
  console.log("🔄 onSelectedWeekDayChanged called", {
    selectedWeekDaysModelBefore: selectedWeekDaysModel.value,
  });
  // Re-emit only if actual change occurred (avoid self-triggering loops)
  const cloned = [...selectedWeekDaysModel.value];
  if (!areWeekDaySchedulesEqual(cloned, selectedWeekDaysModel.value)) {
    selectedWeekDaysModel.value = cloned;
  } else {
    // Force emit with a normalized array order to ensure stability without churn
    // Sort by weekId to keep deterministic reference if order changed elsewhere
    const normalized = [...cloned].sort((a, b) => a.weekId - b.weekId);
    if (!areWeekDaySchedulesEqual(normalized, selectedWeekDaysModel.value)) {
      selectedWeekDaysModel.value = normalized;
    }
  }
  console.log("✅ onSelectedWeekDayChanged after update", {
    selectedWeekDaysModelAfter: selectedWeekDaysModel.value,
  });
};

const studentPopup = ref<{ open: (p: string[]) => void } | null>(null);
const isKtpPopupOpen = ref(false);

const openStreamSelection = () => {
  console.log("🔄 openStreamSelection called", {
    participantsModel: participantsModel.value,
    parentPopoverId: props.parentPopoverId,
  });
  closeParentPopover();
  studentPopup.value?.open(participantsModel.value || []);
};
const handleStudentsSave = (selectedIds: string[]) => {
  console.log("🔄 handleStudentsSave called", {
    selectedIds,
    previousParticipants: participantsModel.value,
  });
  participantsModel.value = selectedIds;
};
const handleStudentPopupClose = () => {
  console.log("🔄 handleStudentPopupClose called");
  openParentPopover();
};

const openKtpPopup = () => {
  console.log("🔄 openKtpPopup called", {
    class9IdModel: class9IdModel.value,
    ktpId: getKtpIdForClass9.value,
  });
  isKtpPopupOpen.value = true;
};

const openParentPopover = () => {
  console.log("🔄 openParentPopover called", {
    parentPopoverId: props.parentPopoverId,
  });
  f7.popover.open(props.parentPopoverId);
};
const closeParentPopover = () => {
  console.log("🔄 closeParentPopover called", {
    parentPopoverId: props.parentPopoverId,
  });
  f7.popover.close(props.parentPopoverId);
};

watch(class9IdModel, (newId, oldId) => {
  console.log("🔄 WATCHER class9IdModel changed", {
    oldId,
    newId,
    selectedClass9ItemBefore: selectedClass9Item.value,
    getKtpIdForClass9Before: getKtpIdForClass9.value,
  });
  selectedItemsStore.setSelectedClass9ItemId(newId);
  rupStore.setSelectedClass9ItemId?.(newId as any);
  console.log("✅ WATCHER class9IdModel after store updates", {
    selectedClass9ItemAfter: selectedClass9Item.value,
    getKtpIdForClass9After: getKtpIdForClass9.value,
  });
});

watch(
  [useCustomPeriodModel, semesterDates],
  (
    [newUseCustomPeriod, newSemesterDates],
    [oldUseCustomPeriod, oldSemesterDates]
  ) => {
    console.log("🔄 WATCHER [useCustomPeriodModel, semesterDates] called", {
      oldUseCustomPeriod,
      newUseCustomPeriod,
      oldSemesterDates,
      newSemesterDates,
      propsStartDate: props.startDate,
      propsEndDate: props.endDate,
      startDateModelValue: startDateModel.value,
      endDateModelValue: endDateModel.value,
    });

    if (!newUseCustomPeriod && newSemesterDates) {
      const nextStart = newSemesterDates.startDate;
      const nextEnd = newSemesterDates.endDate;

      console.log("🔍 WATCHER checking if updates needed", {
        nextStart,
        nextEnd,
        propsStartDate: props.startDate,
        propsEndDate: props.endDate,
        startDateModelLength: startDateModel.value?.length,
        endDateModelLength: endDateModel.value?.length,
      });

      // Only update if the current values are different from the new values
      // This prevents infinite loops when the computed setters trigger the watcher again
      // If props don't exist, we should update to semester dates
      if (!props.startDate || props.startDate !== nextStart) {
        console.log(
          "📤 WATCHER emitting update:startDate:",
          nextStart,
          "(different from props)"
        );
        emit("update:startDate", nextStart);
      } else {
        console.log(
          "⚠️ WATCHER no change needed for startDate (matches props)"
        );
      }
      if (!props.endDate || props.endDate !== nextEnd) {
        console.log(
          "📤 WATCHER emitting update:endDate:",
          nextEnd,
          "(different from props)"
        );
        emit("update:endDate", nextEnd);
      } else {
        console.log("⚠️ WATCHER no change needed for endDate (matches props)");
      }
    } else {
      console.log("⚠️ WATCHER no action needed", {
        useCustomPeriod: newUseCustomPeriod,
        hasSemesterDates: !!newSemesterDates,
      });
    }
  },
  { immediate: true }
);

// Log call counters summary when component unmounts
onUnmounted(() => {
  console.log(
    "📊 EventForm.vue COMPONENT UNMOUNTED - Call Counters Summary:",
    callCounters
  );
});
</script>

<style scoped></style>
