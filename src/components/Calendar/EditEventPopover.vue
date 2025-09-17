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

        <!-- Custom Period Checkbox -->
        <div class="flex items-center">
          <f7-checkbox
            id="use-custom-period-edit"
            v-model:checked="useCustomPeriod"
          ></f7-checkbox>
          <label
            for="use-custom-period-edit"
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
        <div v-if="useCustomPeriod" class="flex justify-between items-center">
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
        <div v-if="useCustomPeriod" class="flex justify-between items-center">
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
        <div
          v-if="useCustomPeriod && dateValidationError"
          class="text-destructive text-sm"
        >
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
        <ColorPicker
          v-model="eventColor"
          target-id="edit-color-picker-target"
        />

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

        <!-- RUP/KTP open like participants -->
        <div
          class="flex justify-between items-center cursor-pointer"
          id="edit-event-ktp"
          @click="openKtpPopup"
        >
          <span class="text-sm text-foreground">РУП/КТП</span>
          <span class="text-muted-foreground flex items-center">
            Открыть
            <i class="f7-icons text-muted-foreground ml-1">chevron_right</i>
          </span>
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
        <KtpDetailPopup
          :opened="isKtpPopupOpen"
          :class9-id="class9Id"
          @update:opened="(v:boolean)=>{ isKtpPopupOpen=v }"
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
import ColorPicker from "@/components/ui/ColorPicker.vue";
import StudentSelectionPopup from "./StudentSelectionPopup.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useClass9Store } from "@/stores/class9Store";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import { WEEK_DAYS, DATE_PICKER_PARAMS } from "@/constants/calendar";

const props = defineProps<{ event: CalendarEvent }>();

const emit = defineEmits<{
  (e: "updated", event: CalendarEvent): void;
  (e: "cancel"): void;
}>();

const calendarStore = useCalendarStore();
const class9Store = useClass9Store();
const selectedItemsStore = useSelectedItemsStore();
const educationScheduleStore = useEducationScheduleStore();
const semesterStore = useSemesterStore();

const { class9Options } = storeToRefs(calendarStore);
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);
const { selectedClass9Item } = storeToRefs(selectedItemsStore);
const { getActiveSemester } = storeToRefs(semesterStore);

const class9Id = ref(props.event.class9Id);
const isKtpPopupOpen = ref(false);
const useCustomPeriod = ref(false);
const startDate = ref([props.event.startDate]);
const endDate = ref([props.event.endDate]);
const participants = ref<string[]>([...props.event.participants]);
const eventColor = ref({ hex: props.event.color || "#3F51B5" }); // Initialize with event color or default

const formError = ref<string | null>(null);
const selectedWeekDays = ref<
  {
    weekId: number;
    russianWeekDay: string;
    startId: string;
    endId: string;
  }[]
>(
  props.event.weeklySchedules?.map((ws) => {
    const schedules = getActiveYearSchedules.value;
    const startId =
      ws.startId ||
      schedules.find((s) => s.startTime === ws.startTime)?.id ||
      "";
    const endId =
      ws.endId || schedules.find((s) => s.endTime === ws.endTime)?.id || "";
    return {
      weekId: ws.weekId,
      russianWeekDay: WEEK_DAYS.find((d) => d.weekId === ws.weekId)?.name || "",
      startId,
      endId,
    };
  }) || []
);

const studentPopup = ref<{ open: (p: string[]) => void } | null>(null);

/* --- COMPUTED --- */
const isFormValid = computed(() => {
  const hasRequiredFields = !!class9Id.value;

  if (useCustomPeriod.value) {
    // When using custom period, validate date range
    const hasValidDateRange =
      startDate.value[0] &&
      endDate.value[0] &&
      dayjs(endDate.value[0], "DD/MM/YYYY").isAfter(
        dayjs(startDate.value[0], "DD/MM/YYYY"),
        "day"
      );
    return hasRequiredFields && hasValidDateRange;
  } else {
    // When using semester dates, only require class9Id
    return hasRequiredFields && !!semesterDates.value;
  }
});

const plannedHours = computed(() => {
  return selectedClass9Item.value?.totalHours ?? "0";
});

const dateValidationError = computed(() => {
  if (!useCustomPeriod.value) return null;
  if (!startDate.value[0] || !endDate.value[0]) return null;

  const start = dayjs(startDate.value[0], "DD/MM/YYYY");
  const end = dayjs(endDate.value[0], "DD/MM/YYYY");

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

const isEventUsingSemesterDates = computed(() => {
  if (!semesterDates.value) return false;

  const eventStartDate = props.event.startDate;
  const eventEndDate = props.event.endDate;

  return (
    eventStartDate === semesterDates.value.startDate &&
    eventEndDate === semesterDates.value.endDate
  );
});

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
  f7.popover.close("#edit-event-popover");
  studentPopup.value?.open(participants.value);
};

const handleStudentsSave = (selectedIds: string[]) => {
  participants.value = selectedIds;
};

const handleStudentPopupClose = () => {
  f7.popover.open("#edit-event-popover");
};

const openKtpPopup = () => {
  isKtpPopupOpen.value = true;
};
const handleUpdateEvent = async () => {
  try {
    formError.value = null;

    // Validate date range only when using custom period
    if (useCustomPeriod.value) {
      if (!startDate.value[0] || !endDate.value[0]) {
        formError.value = "Пожалуйста, выберите дату начала и окончания.";
        return;
      }

      const startParsed = dayjs(startDate.value[0], "DD/MM/YYYY");
      const endParsed = dayjs(endDate.value[0], "DD/MM/YYYY");

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

    const updateData = {
      class9Id: class9Id.value,
      startDate: useCustomPeriod.value
        ? startDate.value[0]
        : semesterDates.value?.startDate || "",
      endDate: useCustomPeriod.value
        ? endDate.value[0]
        : semesterDates.value?.endDate || "",
      participants: participants.value,
      weeklySchedules: selectedWeekDays.value,
      color: eventColor.value.hex,
      useCustomPeriod: useCustomPeriod.value,
      semester: getActiveSemester.value?.id ?? "",
    };

    await calendarStore.updateEvent(props.event.id, updateData);

    const emitData = {
      ...props.event,
      class9Id: class9Id.value,
      startDate: useCustomPeriod.value
        ? startDate.value[0]
        : semesterDates.value?.startDate || "",
      endDate: useCustomPeriod.value
        ? endDate.value[0]
        : semesterDates.value?.endDate || "",
      participants: participants.value,
      weeklySchedules: selectedWeekDays.value,
      color: eventColor.value.hex,
      useCustomPeriod: useCustomPeriod.value,
      semester: getActiveSemester.value?.id ?? "",
    };

    emit("updated", emitData);

    closeEditEventPopover();
  } catch (err) {
    formError.value = "Ошибка при обновлении события.";
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

/* --- WATCHERS --- */
watch(class9Id, (newId) => {
  selectedItemsStore.setSelectedClass9ItemId(newId);
});
watch(
  [isEventUsingSemesterDates, semesterDates],
  ([isUsingSemesterDates, currentSemesterDates]) => {
    if (isUsingSemesterDates && currentSemesterDates) {
      useCustomPeriod.value = false;
      startDate.value = [currentSemesterDates.startDate];
      endDate.value = [currentSemesterDates.endDate];
    } else if (!isUsingSemesterDates && currentSemesterDates) {
      useCustomPeriod.value = true;
      // Keep existing event dates
    }
  },
  { immediate: true }
);

// Watch for changes in useCustomPeriod and semesterDates
watch(
  [useCustomPeriod, semesterDates],
  ([newUseCustomPeriod, newSemesterDates]) => {
    if (!newUseCustomPeriod && newSemesterDates) {
      startDate.value = [newSemesterDates.startDate];
      endDate.value = [newSemesterDates.endDate];
    }
  },
  { immediate: false }
);
</script>

<style scoped>
#edit-event-popover {
  left: 50%;
  transform: translateX(-50%);
}
</style>
