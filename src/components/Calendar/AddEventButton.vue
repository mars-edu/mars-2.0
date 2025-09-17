<template>
  <div>
    <f7-fab
      id="add-button"
      position="right-bottom"
      @click="openAddEventPopover"
    >
      <f7-icon ios="f7:plus" md="material:add" size="16px"></f7-icon>
    </f7-fab>

    <!-- Framework7 Popover -->
    <f7-popover
      id="add-event-popover"
      style="width: 500px !important"
      :arrow="false"
      close-on-escape
    >
      <div class="event-popover bg-card text-card-foreground">
        <!-- Header with buttons -->
        <div class="fixed-header">
          <PopoverHeader
            title="Создать"
            save-text="Добавить"
            :disabled="!isFormValid"
            :on-cancel="closeAddEventPopover"
            :on-save="handleAddEvent"
          />

          <div v-if="formError" class="px-4 pb-2 text-destructive text-sm">
            {{ formError }}
          </div>
        </div>

        <div class="scrollable-content">
          <div class="p-4 space-y-4">
            <Select
              label="Результат обучения/дисциплина"
              placeholder="Выберите результат обучения/дисциплину"
              v-model="class9Id"
              :options="class9Options"
              name="event-class9"
              id="event-class9"
              searchable
              @before-open="closeAddEventPopover"
              @after-close="openAddEventPopover"
            />

            <!-- Custom Period Checkbox -->
            <div class="flex items-center">
              <f7-checkbox
                id="use-custom-period"
                v-model:checked="useCustomPeriod"
              ></f7-checkbox>
              <label
                for="use-custom-period"
                class="ml-2 text-sm text-foreground"
              >
                Установить свой период
              </label>
            </div>

            <!-- Semester Date Range Display -->
            <div
              v-if="!useCustomPeriod && semesterDates"
              class="mt-2 p-3 bg-muted rounded-lg border"
            >
              <div class="text-sm text-muted-foreground mb-1">Период:</div>
              <div class="text-sm font-medium text-foreground">
                {{ semesterDates.startDate }} - {{ semesterDates.endDate }}
              </div>
            </div>

            <!-- Start Date -->
            <div
              v-if="useCustomPeriod"
              class="flex justify-between items-center"
            >
              <span class="text-sm text-foreground">Начало</span>
              <div class="w-1/2">
                <f7-input
                  class="text-right"
                  type="datepicker"
                  placeholder="Дата"
                  v-model:value="startDate"
                  readonly
                  :calendar-params="{
                    ...DATE_PICKER_PARAMS,
                    valueDateFormat: 'dd/MM/yyyy',
                  }"
                ></f7-input>
              </div>
            </div>

            <!-- End Date -->
            <div
              v-if="useCustomPeriod"
              class="flex justify-between items-center"
            >
              <span class="text-sm text-foreground">Конец</span>
              <div class="w-1/2">
                <f7-input
                  class="text-right"
                  type="datepicker"
                  placeholder="Дата"
                  v-model:value="endDate"
                  readonly
                  :calendar-params="{
                    ...DATE_PICKER_PARAMS,
                    valueDateFormat: 'dd/MM/yyyy',
                  }"
                ></f7-input>
              </div>
            </div>

            <!-- Date validation error -->
            <div
              v-if="useCustomPeriod && dateValidationError"
              class="text-destructive text-sm"
            >
              {{ dateValidationError }}
            </div>

            <!-- Participants -->
            <div
              class="flex justify-between items-center cursor-pointer"
              id="add-event-participants"
              @click="openStreamSelection"
            >
              <span class="text-sm text-foreground">Обучающиеся</span>
              <span class="text-muted-foreground flex items-center">
                {{ participants.length || "Не выбрано" }}
                <i class="f7-icons text-muted-foreground ml-1">chevron_right</i>
              </span>
            </div>

            <!-- Color Picker -->
            <ColorPicker v-model="eventColor" target-id="color-picker-target" />

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

            <template v-for="day in selectedWeekDays" :key="day.weekId">
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
                />
                <span class="text-muted-foreground text-sm">до</span>
                <Select
                  v-model="day.endId"
                  :options="endTimeOptions"
                  placeholder="Выберите время"
                  class="w-full"
                />
              </div>
            </template>

            <div
              class="flex justify-between items-center cursor-pointer"
              id="add-event-ktp"
              @click="openKtpPopup"
            >
              <span class="text-sm text-foreground">РУП/КТП</span>
              <span class="text-muted-foreground flex items-center">
                Открыть
                <i class="f7-icons text-muted-foreground ml-1">chevron_right</i>
              </span>
            </div>

            <div class="bg-secondary p-4 border-t border-input">
              <div class="flex justify-between mb-2">
                <span class="text-foreground">Запланировано на семестр:</span>
                <span class="text-foreground font-medium"
                  >{{ semesterPlannedHours }} часов</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-primary">Запланировано на весь предмет:</span>
                <span class="text-primary font-medium"
                  >{{ totalPlannedHours }} часов</span
                >
              </div>
            </div>
          </div>
        </div>
      </div>
    </f7-popover>

    <StudentSelectionPopup
      ref="studentPopup"
      :selected-students="participants"
      @save="handleStudentsSave"
      @close="handleStudentPopupClose"
    />
    <KtpDetailPopup
      :opened="isKtpPopupOpen"
      :class9-id="class9Id"
      @update:opened="(v:boolean)=>{ isKtpPopupOpen=v }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import Select from "../ui/Select.vue";
import PopoverHeader from "../ui/PopoverHeader.vue";
import ColorPicker from "../ui/ColorPicker.vue";
import StudentSelectionPopup from "./StudentSelectionPopup.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useRupStore } from "@/stores/rupStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useSemesterStore } from "@/stores/semesterStore";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
import { WEEK_DAYS, DATE_PICKER_PARAMS } from "@/constants/calendar";

const emit = defineEmits<{
  (e: "event-added", event: CalendarEvent): void;
  (e: "import-ktp-existing"): void;
}>();

const calendarStore = useCalendarStore();
const { class9Options } = storeToRefs(calendarStore);
const selectedItemsStore = useSelectedItemsStore();
const educationScheduleStore = useEducationScheduleStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);
const semesterStore = useSemesterStore();
const { getActiveSemester } = storeToRefs(semesterStore);

const rupStore = useRupStore();

const class9Id = ref("");
const useCustomPeriod = ref(false);
const startDate = ref(dayjs().format("DD/MM/YYYY"));
const endDate = ref(dayjs().format("DD/MM/YYYY"));
const participants = ref<string[]>([]);
const formError = ref<string | null>(null);
const eventColor = ref({ hex: "#3F51B5" });

const selectedWeekDays = ref<
  {
    weekId: number;
    russianWeekDay: string;
    startId: string;
    endId: string;
  }[]
>([]);
const studentPopup = ref<{ open: (p: string[]) => void } | null>(null);
const isKtpPopupOpen = ref(false);

const isFormValid = computed(() => {
  const hasRequiredFields = !!class9Id.value;

  if (useCustomPeriod.value) {
    // When using custom period, validate date range
    const hasValidDateRange =
      startDate.value &&
      endDate.value &&
      dayjs(endDate.value, "DD/MM/YYYY").isAfter(
        dayjs(startDate.value, "DD/MM/YYYY"),
        "day"
      );
    return hasRequiredFields && hasValidDateRange;
  } else {
    // When using semester dates, only require class9Id
    return hasRequiredFields && !!semesterDates.value;
  }
});

const semesterPlannedHours = computed(() => {
  return rupStore.selectedClass9SemesterHours;
});

const totalPlannedHours = computed(() => {
  return rupStore.selectedClass9TotalHours;
});

const dateValidationError = computed(() => {
  if (!useCustomPeriod.value) return null;
  if (!startDate.value || !endDate.value) return null;

  const start = dayjs(startDate.value, "DD/MM/YYYY");
  const end = dayjs(endDate.value, "DD/MM/YYYY");

  if (!end.isAfter(start, "day")) {
    return "Дата окончания должна быть как минимум на один день позже даты начала";
  }

  return null;
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

const semesterDates = computed(() => {
  const activeSemester = getActiveSemester.value;
  if (activeSemester) {
    return {
      startDate: dayjs(activeSemester.startDate, "YYYY-MM-DD").format(
        "DD/MM/YYYY"
      ),
      endDate: dayjs(activeSemester.endDate, "YYYY-MM-DD").format("DD/MM/YYYY"),
    };
  }
  return null;
});

const handleAddEvent = async () => {
  try {
    formError.value = null;

    // Validate date range only when using custom period
    if (useCustomPeriod.value) {
      if (!startDate.value || !endDate.value) {
        formError.value = "Пожалуйста, выберите дату начала и окончания.";
        return;
      }

      const startParsed = dayjs(startDate.value, "DD/MM/YYYY");
      const endParsed = dayjs(endDate.value, "DD/MM/YYYY");

      if (!endParsed.isAfter(startParsed, "day")) {
        formError.value =
          "Дата окончания должна быть как минимум на один день позже даты начала.";
        return;
      }
    } else {
      // When using semester dates, ensure we have active semester
      if (!semesterDates.value) {
        formError.value =
          "Активный семестр не найден. Пожалуйста, установите свой период.";
        return;
      }
    }

    const eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> = {
      class9Id: class9Id.value,
      startDate: useCustomPeriod.value
        ? startDate.value
        : semesterDates.value?.startDate || "",
      endDate: useCustomPeriod.value
        ? endDate.value
        : semesterDates.value?.endDate || "",
      participants: participants.value,
      weeklySchedules: selectedWeekDays.value,
      color: eventColor.value.hex,
      useCustomPeriod: useCustomPeriod.value,
      semester: getActiveSemester.value?.id ?? "",
    };

    const newEvent = await calendarStore.addEvent(eventData);

    emit("event-added", newEvent);
    closeAddEventPopover();
    resetForm();
  } catch (error) {
    formError.value = "Ошибка при добавлении события.";
  }
};

const resetForm = () => {
  class9Id.value = "";
  useCustomPeriod.value = false;
  participants.value = [];
  selectedWeekDays.value = [];
  formError.value = null;
  eventColor.value = { hex: "#3F51B5" };
};

const selectWeekDay = (day: {
  weekId: number;
  russianAbbreviation: string;
  isStartDate: boolean;
  isSelected: boolean;
  name: string;
}) => {
  const index = selectedWeekDays.value.findIndex(
    (selectedDay) => selectedDay.weekId === day.weekId
  );

  if (index === -1) {
    selectedWeekDays.value.push({
      weekId: day.weekId,
      russianWeekDay: day.name,
      startId: "",
      endId: "",
    });
  } else {
    selectedWeekDays.value.splice(index, 1);
  }
};

const weekDays = computed(() =>
  WEEK_DAYS.map((day) => ({
    ...day,
    isStartDate: false,
    isSelected: selectedWeekDays.value.some(
      (selected) => selected.weekId === day.weekId
    ),
  }))
);

const openStreamSelection = () => {
  closeAddEventPopover();
  studentPopup.value?.open(participants.value);
};

const handleStudentsSave = (selectedIds: string[]) => {
  participants.value = selectedIds;
};

const handleStudentPopupClose = () => {
  openAddEventPopover();
};

const openAddEventPopover = () => {
  f7.popover.open("#add-event-popover");
};

const closeAddEventPopover = () => {
  f7.popover.close("#add-event-popover");
};

const openKtpPopup = () => {
  isKtpPopupOpen.value = true;
};

watch(class9Id, (newId) => {
  selectedItemsStore.setSelectedClass9ItemId(newId);
  rupStore.setSelectedClass9ItemId(newId);
});

watch(
  [useCustomPeriod, semesterDates],
  ([newUseCustomPeriod, newSemesterDates]) => {
    if (!newUseCustomPeriod && newSemesterDates) {
      startDate.value = newSemesterDates.startDate;
      endDate.value = newSemesterDates.endDate;
    } else if (!newUseCustomPeriod && !newSemesterDates) {
      startDate.value = dayjs().format("DD/MM/YYYY");
      endDate.value = dayjs().format("DD/MM/YYYY");
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.event-popover {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 100dvh;
}

.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
  border-bottom: 1px solid var(--f7-border-color);
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  height: calc(100dvh - 120px); /* Adjust height as needed */
}
#add-event-popover {
  left: 50%;
  transform: translateX(-50%);
}
</style>
