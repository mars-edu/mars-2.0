<template>
  <f7-popover
    id="edit-event-popover"
    style="width: 500px !important"
    :arrow="false"
    close-on-escape
    @popover:closed="onClosed"
  >
    <div class="event-popover bg-card text-card-foreground">
      <!-- Header with buttons -->
      <PopoverHeader
        title="Редактировать"
        save-text="Сохранить"
        :disabled="!isFormValid"
        :on-cancel="closeEditEventPopoverGuarded"
        :on-save="handleUpdateEventGuarded"
      />

      <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
        {{ formError }}
      </div>

      <div class="p-4 space-y-4">
        <!-- Class9 selection -->
        <Select
          label="Результат обучения"
          placeholder="Выберите результат обучения"
          v-model="class9Id"
          :options="class9Options"
          name="event-class9-edit"
          id="event-class9-edit"
          searchable
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
            />
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
            />
          </div>
        </div>

        <!-- Date validation error -->
        <div v-if="dateValidationError" class="text-destructive text-sm">
          {{ dateValidationError }}
        </div>

        <!-- Participants -->
        <div
          class="flex justify-between items-center cursor-pointer"
          id="edit-event-participants"
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
            id="edit-color-picker-target"
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
              targetEl: '#edit-color-picker-target',
              palette: [
                [
                  '#FFEBEE', '#FFCDD2', '#EF9A9A', '#E57373', '#EF5350',
                  '#F44336', '#E53935', '#D32F2F', '#C62828', '#B71C1C',
                ],
                [
                  '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC',
                  '#9C27B0', '#8E24AA', '#7B1FA2', '#6A1B9A', '#4A148C',
                ],
                [
                  '#E8EAF6', '#C5CAE9', '#9FA8DA', '#7986CB', '#5C6BC0',
                  '#3F51B5', '#3949AB', '#303F9F', '#283593', '#1A237E',
                ],
                [
                  '#E1F5FE', '#B3E5FC', '#81D4FA', '#4FC3F7', '#29B6F6',
                  '#03A9F4', '#039BE5', '#0288D1', '#0277BD', '#01579B',
                ],
                [
                  '#E0F2F1', '#B2DFDB', '#80CBC4', '#4DB6AC', '#26A69A',
                  '#009688', '#00897B', '#00796B', '#00695C', '#004D40',
                ],
                [
                  '#F1F8E9', '#DCEDC8', '#C5E1A5', '#AED581', '#9CCC65',
                  '#8BC34A', '#7CB342', '#689F38', '#558B2F', '#33691E',
                ],
                [
                  '#FFFDE7', '#FFF9C4', '#FFF59D', '#FFF176', '#FFEE58',
                  '#FFEB3B', '#FDD835', '#FBC02D', '#F9A825', '#F57F17',
                ],
                [
                  '#FFF3E0', '#FFE0B2', '#FFCC80', '#FFB74D', '#FFA726',
                  '#FF9800', '#FB8C00', '#F57C00', '#EF6C00', '#E65100',
                ],
              ],
              formatValue(value: any) {
                return value.hex;
              },
            }"
          />
        </div>

        <!-- Week days -->
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

        <!-- Time selectors for selected days -->
        <template v-for="day in selectedWeekDays" :key="day.weekId">
          <div class="text-foreground font-semibold mb-3">
            Время на {{ day.russianWeekDay.toLowerCase() }}
          </div>
          <div class="flex items-center gap-2 mb-2">
            <span class="text-muted-foreground text-sm">от</span>
            <Select
              v-model="day.startTime"
              :options="startTimeOptions"
              placeholder="Выберите время"
              class="w-full"
            />
            <span class="text-muted-foreground text-sm">до</span>
            <Select
              v-model="day.endTime"
              :options="endTimeOptions"
              placeholder="Выберите время"
              class="w-full"
            />
          </div>
        </template>

        <!-- RUP/KTP File -->
        <div class="border border-input rounded-lg p-3">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-foreground">РУП/КТП</span>
            <template v-if="rupFileName">
              <div class="flex items-center gap-2">
                <button
                  type="button"
                  class="text-primary underline text-sm"
                  @click="downloadRupFile"
                >
                  Скачать
                </button>
                <button
                  type="button"
                  class="text-destructive hover:text-destructive/80"
                  @click="removeRupFile"
                >
                  <i class="f7-icons">trash</i>
                </button>
              </div>
            </template>
            <template v-else>
              <span class="text-sm text-muted-foreground">Файл не выбран</span>
            </template>
          </div>

          <label
            v-if="!rupFileName"
            class="flex items-center justify-center w-full h-20 border border-dashed border-input rounded-lg cursor-pointer hover:bg-secondary"
          >
            <input
              type="file"
              class="hidden"
              @change="handleRupFileChange"
              accept=".pdf,.doc,.docx,.xls,.xlsx"
            />
            <div class="text-center">
              <i class="f7-icons text-muted-foreground text-2xl mb-1"
                >arrow_up_doc</i
              >
              <p class="text-sm text-muted-foreground">Загрузите файл РУП</p>
            </div>
          </label>
        </div>

        <!-- Planned hours information -->
        <div class="bg-secondary p-4 border-t border-input">
          <div class="flex justify-between mb-2">
            <span class="text-foreground">По плану:</span>
            <span class="text-foreground font-medium"
              >{{ plannedHours }} часов</span
            >
          </div>
          <div class="flex justify-between">
            <span class="text-primary">Запланировано:</span>
            <span class="text-primary font-medium">38 часов</span>
          </div>
        </div>

        <!-- Delete button -->
        <div class="pt-4 border-t border-border">
          <button
            class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
            @click="showDeleteConfirmation"
            :disabled="calendarStore.isLoading"
          >
            <f7-icon
              ios="f7:trash"
              md="material:delete"
              size="18px"
              class="mr-2"
            />
            Удалить
          </button>
        </div>

        <StudentSelectionPopup
          ref="studentPopup"
          :selected-students="participants"
          @save="handleStudentsSave"
          @close="handleStudentPopupClose"
        />
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7 } from "framework7-vue";
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import StudentSelectionPopup from "./StudentSelectionPopup.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useClass9Store } from "@/stores/class9Store";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { uploadFile } from "@/composables/useFileUpload";
import { WEEK_DAYS, DATE_PICKER_PARAMS } from "@/constants/calendar";

const props = defineProps<{ event: CalendarEvent }>();

const emit = defineEmits<{
  (e: "updated", event: CalendarEvent): void;
  (e: "cancel"): void;
}>();

/* --- STORES --- */
const calendarStore = useCalendarStore();
const class9Store = useClass9Store();
const selectedItemsStore = useSelectedItemsStore();
const educationScheduleStore = useEducationScheduleStore();

const { class9Options } = storeToRefs(calendarStore);
const { schedules } = storeToRefs(educationScheduleStore);
const { selectedClass9Item } = storeToRefs(selectedItemsStore);

/* --- REACTIVE STATE --- */
const class9Id = ref(props.event.class9Id);
const rupFile = ref<File | null>(null);
const rupFileName = ref(props.event.rup);
const startDate = ref([props.event.startDate]);
const endDate = ref([props.event.endDate]);
const participants = ref<string[]>([...props.event.participants]);
const eventColor = ref({ hex: props.event.color || "#3F51B5" }); // Initialize with event color or default

watch(
  eventColor,
  (newVal) => {
    if (newVal && (newVal as any).hex) {
      try {
        (f7 as any).colorPicker?.close?.();
      } catch {
        console.error("🔴 [EditEventPopover] Error closing color picker");
      }
    }
  },
  { deep: false }
);

// Verbose logging for debugging
console.log("🔍 [EditEventPopover] Initial props.event:", props.event);
console.log("🔍 [EditEventPopover] Initial startDate:", props.event.startDate);
console.log("🔍 [EditEventPopover] Initial endDate:", props.event.endDate);
console.log("🔍 [EditEventPopover] startDate ref value:", startDate.value);
console.log("🔍 [EditEventPopover] endDate ref value:", endDate.value);
const formError = ref<string | null>(null);
const selectedWeekDays = ref<
  {
    weekId: number;
    russianWeekDay: string;
    startTime: string;
    endTime: string;
  }[]
>(
  props.event.weeklySchedules?.map((ws) => ({
    weekId: ws.weekId,
    russianWeekDay: WEEK_DAYS.find((d) => d.weekId === ws.weekId)?.name || "",
    startTime: ws.startTime,
    endTime: ws.endTime,
  })) || []
);

const studentPopup = ref<{ open: (p: string[]) => void } | null>(null);

/* --- COMPUTED --- */
const isFormValid = computed(() => {
  const hasRequiredFields = !!class9Id.value;
  const hasValidDateRange =
    startDate.value[0] &&
    endDate.value[0] &&
    dayjs(endDate.value[0], "DD/MM/YYYY").isAfter(
      dayjs(startDate.value[0], "DD/MM/YYYY"),
      "day"
    );

  return hasRequiredFields && hasValidDateRange;
});

const plannedHours = computed(() => {
  return selectedClass9Item.value?.totalHours ?? "0";
});

const dateValidationError = computed(() => {
  if (!startDate.value[0] || !endDate.value[0]) return null;

  const start = dayjs(startDate.value[0], "DD/MM/YYYY");
  const end = dayjs(endDate.value[0], "DD/MM/YYYY");

  if (!end.isAfter(start, "day")) {
    return "Дата окончания должна быть как минимум на один день позже даты начала";
  }

  return null;
});

const startTimeOptions = computed(() =>
  schedules.value.map((schedule) => ({
    value: schedule.startTime,
    text: schedule.startTime,
  }))
);

const endTimeOptions = computed(() =>
  schedules.value.map((schedule) => ({
    value: schedule.endTime,
    text: schedule.endTime,
  }))
);

/* --- METHODS --- */
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
      startTime: "",
      endTime: "",
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
  // Close popover before opening popup to avoid overlay issues
  f7.popover.close("#edit-event-popover");
  studentPopup.value?.open(participants.value);
};

const handleStudentsSave = (selectedIds: string[]) => {
  participants.value = selectedIds;
};

const handleStudentPopupClose = () => {
  // reopen popover after closing students popup
  f7.popover.open("#edit-event-popover");
};

const handleRupFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    rupFile.value = input.files[0];
    rupFileName.value = input.files[0].name;
  }
};

const removeRupFile = () => {
  rupFileName.value = "";
  rupFile.value = null;
};

// Open existing RUP file in a new browser tab using JS
const downloadRupFile = () => {
  if (rupFileDownloadUrl.value) {
    window.open(rupFileDownloadUrl.value, "_blank");
  }
};

const rupFileDownloadUrl = computed(() => {
  if (rupFileName.value) {
    return props.event.rup;
  }
  return "#";
});
const handleUpdateEvent = async () => {
  try {
    formError.value = null;

    console.log("🚀 [EditEventPopover] handleUpdateEvent called");
    console.log(
      "🚀 [EditEventPopover] Current startDate.value:",
      startDate.value
    );
    console.log("🚀 [EditEventPopover] Current endDate.value:", endDate.value);
    console.log(
      "🚀 [EditEventPopover] startDate.value[0]:",
      startDate.value[0]
    );
    console.log("🚀 [EditEventPopover] endDate.value[0]:", endDate.value[0]);

    // Validate date range
    if (!startDate.value[0] || !endDate.value[0]) {
      formError.value = "Пожалуйста, выберите дату начала и окончания.";
      return;
    }

    const startParsed = dayjs(startDate.value[0], "DD/MM/YYYY");
    const endParsed = dayjs(endDate.value[0], "DD/MM/YYYY");

    console.log("🚀 [EditEventPopover] startParsed:", startParsed.format());
    console.log("🚀 [EditEventPopover] endParsed:", endParsed.format());
    console.log(
      "🚀 [EditEventPopover] startParsed.isValid():",
      startParsed.isValid()
    );
    console.log(
      "🚀 [EditEventPopover] endParsed.isValid():",
      endParsed.isValid()
    );

    if (!endParsed.isAfter(startParsed, "day")) {
      formError.value =
        "Дата окончания должна быть как минимум на один день позже даты начала.";
      return;
    }

    let uploadedFileUrl = rupFileName.value;
    if (rupFile.value) {
      uploadedFileUrl = await uploadFile(rupFile.value);
    }

    const updateData = {
      class9Id: class9Id.value,
      rup: uploadedFileUrl,
      startDate: startDate.value[0],
      endDate: endDate.value[0],
      participants: participants.value,
      weeklySchedules: selectedWeekDays.value,
      color: eventColor.value.hex,
    };

    console.log("🚀 [EditEventPopover] updateData:", updateData);

    await calendarStore.updateEvent(props.event.id, updateData);

    const emitData = {
      ...props.event,
      class9Id: class9Id.value,
      rup: uploadedFileUrl,
      startDate: startDate.value[0],
      endDate: endDate.value[0],
      participants: participants.value,
      weeklySchedules: selectedWeekDays.value,
      color: eventColor.value.hex,
    };

    console.log("🚀 [EditEventPopover] emitData:", emitData);

    emit("updated", emitData);

    closeEditEventPopover();
  } catch (err) {
    formError.value = "Ошибка при обновлении события.";
    console.error(err);
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close("#edit-event-popover");
  const eventTitle = calendarStore.getEventTitle(props.event);
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить событие \"${eventTitle}\"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление события",
    async () => {
      try {
        await calendarStore.deleteEvent(props.event.id);
        emit("updated", props.event);
      } catch (error) {
        f7.dialog.alert(
          "Произошла ошибка при удалении события.",
          "Ошибка",
          () => {
            f7.popover.open("#edit-event-popover");
          }
        );
      }
    },
    () => {
      f7.popover.open("#edit-event-popover");
    }
  );
};

const closeEditEventPopover = () => {
  f7.popover.close("#edit-event-popover");
  emit("cancel");
};

const closeEditEventPopoverGuarded = () => {
  f7.popover.close("#edit-event-popover");
  emit("cancel");
};

const handleUpdateEventGuarded = () => {
  handleUpdateEvent();
};

const onClosed = () => {
  emit("cancel");
};

const openColorPicker = () => {
  // The Framework7 color picker will be triggered automatically via targetEl
};

/* --- WATCHERS --- */
watch(class9Id, (newId) => {
  selectedItemsStore.setSelectedClass9ItemId(newId);
});

// Watch for changes in startDate and endDate
watch(
  startDate,
  (newValue, oldValue) => {
    console.log(
      "👀 [EditEventPopover] startDate changed from:",
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
      "👀 [EditEventPopover] endDate changed from:",
      oldValue,
      "to:",
      newValue
    );
  },
  { deep: true }
);
</script>

<style scoped>
#edit-event-popover {
  left: 50%;
  transform: translateX(-50%);
}
</style>
