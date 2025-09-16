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

            <!-- Start Date -->
            <div class="flex justify-between items-center">
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
            <div class="flex justify-between items-center">
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
            <div v-if="dateValidationError" class="text-destructive text-sm">
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
            <div class="flex justify-between items-center">
              <span class="text-sm text-foreground">Цвет</span>
              <div
                class="flex items-center gap-2 cursor-pointer"
                id="color-picker-target"
                @click="openColorPicker"
              >
                <div
                  :style="`background-color: ${eventColor.hex || '#3F51B5'}`"
                  class="w-8 h-8 rounded-lg border border-input shadow-sm"
                ></div>
              </div>

              <f7-input
                v-model:value="eventColor"
                type="colorpicker"
                class="hidden"
                :color-picker-params="{
                  modules: ['palette'],
                  openIn: 'auto',
                  openInPhone: 'sheet',
                  targetEl: '#color-picker-target',
                  palette: [
                    [
                      '#FFEBEE',
                      '#FFCDD2',
                      '#EF9A9A',
                      '#E57373',
                      '#EF5350',
                      '#F44336',
                      '#E53935',
                      '#D32F2F',
                      '#C62828',
                      '#B71C1C',
                    ],
                    [
                      '#F3E5F5',
                      '#E1BEE7',
                      '#CE93D8',
                      '#BA68C8',
                      '#AB47BC',
                      '#9C27B0',
                      '#8E24AA',
                      '#7B1FA2',
                      '#6A1B9A',
                      '#4A148C',
                    ],
                    [
                      '#E8EAF6',
                      '#C5CAE9',
                      '#9FA8DA',
                      '#7986CB',
                      '#5C6BC0',
                      '#3F51B5',
                      '#3949AB',
                      '#303F9F',
                      '#283593',
                      '#1A237E',
                    ],
                    [
                      '#E1F5FE',
                      '#B3E5FC',
                      '#81D4FA',
                      '#4FC3F7',
                      '#29B6F6',
                      '#03A9F4',
                      '#039BE5',
                      '#0288D1',
                      '#0277BD',
                      '#01579B',
                    ],
                    [
                      '#E0F2F1',
                      '#B2DFDB',
                      '#80CBC4',
                      '#4DB6AC',
                      '#26A69A',
                      '#009688',
                      '#00897B',
                      '#00796B',
                      '#00695C',
                      '#004D40',
                    ],
                    [
                      '#F1F8E9',
                      '#DCEDC8',
                      '#C5E1A5',
                      '#AED581',
                      '#9CCC65',
                      '#8BC34A',
                      '#7CB342',
                      '#689F38',
                      '#558B2F',
                      '#33691E',
                    ],
                    [
                      '#FFFDE7',
                      '#FFF9C4',
                      '#FFF59D',
                      '#FFF176',
                      '#FFEE58',
                      '#FFEB3B',
                      '#FDD835',
                      '#FBC02D',
                      '#F9A825',
                      '#F57F17',
                    ],
                    [
                      '#FFF3E0',
                      '#FFE0B2',
                      '#FFCC80',
                      '#FFB74D',
                      '#FFA726',
                      '#FF9800',
                      '#FB8C00',
                      '#F57C00',
                      '#EF6C00',
                      '#E65100',
                    ],
                  ],
                  formatValue(value: any) {
                    return value.hex;
                  },
                }"
              />
            </div>

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

            <div class="border border-input rounded-lg p-3">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm text-foreground">РУП/КТП</span>
                <span v-if="rupFile" class="text-sm text-muted-foreground">{{
                  rupFile.name
                }}</span>
              </div>
              <AddKtpDialog
                @import-existing="handleImportExisting"
                @file-selected="handleRupFileChange"
              />
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import Select from "../ui/Select.vue";
import PopoverHeader from "../ui/PopoverHeader.vue";
import StudentSelectionPopup from "./StudentSelectionPopup.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useRupStore } from "@/stores/rupStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { uploadFile } from "@/composables/useFileUpload";
import AddKtpDialog from "@/components/AddKtpDialog.vue";
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

const rupStore = useRupStore();

const class9Id = ref("");
const rupFile = ref<File | null>(null);
const startDate = ref(dayjs().format("DD/MM/YYYY"));
const endDate = ref(dayjs().format("DD/MM/YYYY"));
const participants = ref<string[]>([]);
const formError = ref<string | null>(null);
const eventColor = ref({ hex: "#3F51B5" });

watch(
  eventColor,
  (newVal) => {
    if (newVal && (newVal as any).hex) {
      try {
        (f7 as any).colorPicker?.close?.();
      } catch {
        console.error("🔴 [AddEventButton] Error closing color picker");
      }
    }
  },
  { deep: false }
);

// Verbose logging for debugging
console.log("🔍 [AddEventButton] Initial startDate:", startDate.value);
console.log("🔍 [AddEventButton] Initial endDate:", endDate.value);
console.log(
  "🔍 [AddEventButton] dayjs().format('DD/MM/YYYY'):",
  dayjs().format("DD/MM/YYYY")
);
const selectedWeekDays = ref<
  {
    weekId: number;
    russianWeekDay: string;
    startId: string;
    endId: string;
  }[]
>([]);
const studentPopup = ref<{ open: (p: string[]) => void } | null>(null);

const isFormValid = computed(() => {
  const hasRequiredFields = !!class9Id.value;
  const hasValidDateRange =
    startDate.value &&
    endDate.value &&
    dayjs(endDate.value, "DD/MM/YYYY").isAfter(
      dayjs(startDate.value, "DD/MM/YYYY"),
      "day"
    );

  return hasRequiredFields && hasValidDateRange;
});

const semesterPlannedHours = computed(() => {
  return rupStore.selectedClass9SemesterHours;
});

const totalPlannedHours = computed(() => {
  return rupStore.selectedClass9TotalHours;
});

const dateValidationError = computed(() => {
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

const handleAddEvent = async () => {
  try {
    formError.value = null;

    console.log("🚀 [AddEventButton] handleAddEvent called");
    console.log(
      "🚀 [AddEventButton] Current startDate.value:",
      startDate.value
    );
    console.log("🚀 [AddEventButton] Current endDate.value:", endDate.value);
    console.log("🚀 [AddEventButton] startDate.value[0]:", startDate.value[0]);
    console.log("🚀 [AddEventButton] endDate.value[0]:", endDate.value[0]);

    // Validate date range
    if (!startDate.value || !endDate.value) {
      formError.value = "Пожалуйста, выберите дату начала и окончания.";
      return;
    }

    const startParsed = dayjs(startDate.value, "DD/MM/YYYY");
    const endParsed = dayjs(endDate.value, "DD/MM/YYYY");

    console.log("🚀 [AddEventButton] startParsed:", startParsed.format());
    console.log("🚀 [AddEventButton] endParsed:", endParsed.format());
    console.log(
      "🚀 [AddEventButton] startParsed.isValid():",
      startParsed.isValid()
    );
    console.log(
      "🚀 [AddEventButton] endParsed.isValid():",
      endParsed.isValid()
    );

    if (!endParsed.isAfter(startParsed, "day")) {
      formError.value =
        "Дата окончания должна быть как минимум на один день позже даты начала.";
      return;
    }

    const uploadedFileUrl = rupFile.value
      ? await uploadFile(rupFile.value)
      : "";

    const eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> = {
      class9Id: class9Id.value,
      rup: uploadedFileUrl || (rupFile.value?.name ?? ""),
      file: null,
      startDate: startDate.value,
      endDate: endDate.value,
      participants: participants.value,
      weeklySchedules: selectedWeekDays.value,
      color: eventColor.value.hex,
    };

    console.log("🚀 [AddEventButton] eventData:", eventData);

    const newEvent = await calendarStore.addEvent(eventData);

    console.log("🚀 [AddEventButton] newEvent from store:", newEvent);

    emit("event-added", newEvent);
    closeAddEventPopover();
    resetForm();
  } catch (error) {
    formError.value = "Ошибка при добавлении события.";
    console.error(error);
  }
};

const resetForm = () => {
  console.log("🔄 [AddEventButton] resetForm called");
  class9Id.value = "";
  rupFile.value = null;
  startDate.value = dayjs().format("DD/MM/YYYY");
  endDate.value = dayjs().format("DD/MM/YYYY");
  participants.value = [];
  selectedWeekDays.value = [];
  formError.value = null;
  eventColor.value = { hex: "#3F51B5" }; // Reset to default color
  console.log(
    "🔄 [AddEventButton] resetForm - new startDate:",
    startDate.value
  );
  console.log("🔄 [AddEventButton] resetForm - new endDate:", endDate.value);
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

const handleRupFileChange = (file: File) => {
  rupFile.value = file;
};

const handleImportExisting = () => {
  emit("import-ktp-existing");
};

const openColorPicker = () => {
  // The Framework7 color picker will be triggered automatically via targetEl
};

watch(class9Id, (newId) => {
  selectedItemsStore.setSelectedClass9ItemId(newId);
  rupStore.setSelectedClass9ItemId(newId);
});

// Watch for changes in startDate and endDate
watch(
  startDate,
  (newValue, oldValue) => {
    console.log(
      "👀 [AddEventButton] startDate changed from:",
      oldValue,
      "to:",
      newValue
    );
  },
  { deep: true }
);

watch(
  endDate,
  (newValue, oldValue) => {
    console.log(
      "👀 [AddEventButton] endDate changed from:",
      oldValue,
      "to:",
      newValue
    );
  },
  { deep: true }
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
