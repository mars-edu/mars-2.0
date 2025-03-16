<template>
  <div>
    <button
      id="add-button"
      class="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center"
      aria-label="Add"
      type="button"
      @click="openAddEventPopover"
    >
      <i
        class="f7-icons text-gray-500 text-lg flex items-center justify-center"
      >
        plus
      </i>
    </button>

    <!-- Framework7 Popover -->
    <f7-popover id="add-event-popover" style="width: 500px !important">
      <div class="event-popover">
        <!-- Header with buttons -->
        <div
          class="flex justify-between px-2 py-3 border-b border-gray-200 text-center"
        >
          <button
            class="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            @click="closeAddEventPopover"
          >
            Отменить
          </button>
          <span class="text-gray-900 font-semibold">Создать</span>
          <button
            class="text-primary-600 hover:text-primary-700 disabled:text-gray-400"
            :disabled="!!formError"
            @click="handleAddEvent"
          >
            Добавить
          </button>
        </div>

        <div v-if="formError" class="px-4 text-red-500 text-sm">
          {{ formError }}
        </div>

        <div class="p-4 space-y-4">
          <!-- Title input -->
          <select-input
            placeholder="Модуль"
            empty-option-text="Выберите модуль"
            :options="moduleOptions"
            v-model="eventTitle"
          />

          <!-- Result input -->
          <select-input
            placeholder="Результат обучения"
            empty-option-text="Выберите результат"
            :options="learningOutcomeOptions"
            v-model="eventResult"
          />

          <!-- Start date/time -->
          <date-time-selector
            label="Начало"
            :initial-date="startDate"
            :initial-time="startTime"
            @update:date="startDate = $event"
            @update:time="startTime = $event"
          />

          <!-- End date/time -->
          <date-time-selector
            label="Конец"
            :initial-date="endDate"
            :initial-time="endTime"
            @update:date="endDate = $event"
            @update:time="endTime = $event"
          />

          <!-- Participants -->
          <div
            class="flex justify-between items-center cursor-pointer"
            @click="openStreamSelection"
          >
            <span class="text-sm text-gray-900">Обучающиеся</span>
            <span class="text-gray-400 flex items-center">
              {{ participants.length || "Не выбрано" }}
              <i class="f7-icons text-gray-400 ml-1">chevron_right</i>
            </span>
          </div>

          <div class="text-gray-700 font-semibold mb-3">Недели</div>
          <div class="flex justify-between gap-1">
            <div
              v-for="(day, index) in weekDays"
              :key="index"
              class="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
              :class="{
                // 'bg-primary-100 text-primary-600': day.isStartDate,
                'bg-mars-red-light text-white':
                  day.isSelected && !day.isStartDate,
                'bg-gray-100 text-gray-600 hover:bg-gray-200':
                  !day.isStartDate && !day.isSelected,
              }"
              @click="selectWeekDay(day)"
            >
              {{ day.russianAbbreviation }}
            </div>
          </div>

          <template v-for="(day, index) in selectedWeekDays" :key="index">
            <div class="text-gray-700 font-semibold mb-3">
              Время на {{ day.russianWeekDay.toLowerCase() }}
            </div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-gray-500 text-sm">от</span>
              <select
                class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">...</option>
                <option>08:00</option>
                <option>08:45</option>
                <option>08:50</option>
                <option>09:35</option>
                <option>09:45</option>
              </select>
              <span class="text-gray-500 text-sm">до</span>
              <select
                class="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">...</option>
                <option>08:45</option>
                <option>09:35</option>
              </select>
            </div>
          </template>

          <div class="bg-gray-50 p-4 border-t border-gray-200">
            <div class="flex justify-between mb-2">
              <span class="text-gray-700">По плану:</span>
              <span class="text-gray-700 font-medium">36 часов</span>
            </div>
            <div class="flex justify-between">
              <span class="text-primary-600">Запланировано:</span>
              <span class="text-primary-600 font-medium">38 часов</span>
            </div>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover } from "framework7-vue";
import DateTimeSelector from "./DateTimeSelector.vue";
import SelectInput from "./SelectInput.vue";
import type { EventData } from "./EventService";
import dayjs from "dayjs";
import "dayjs/locale/ru";

// Add default values:
withDefaults(
  defineProps<{
    moduleOptions: { value: string; text: string }[];
    learningOutcomeOptions: { value: string; text: string }[];
  }>(),
  {
    moduleOptions: () => [],
    learningOutcomeOptions: () => [],
  }
);

const emit = defineEmits<{
  (e: "event-added", event: EventData): void;
}>();

const eventTitle = ref("");
const eventResult = ref("");
const startDate = ref(dayjs().format("DD MMMM YYYY"));
const startTime = ref("09:00");
const endDate = ref(dayjs().add(1, "hour").format("DD MMMM YYYY"));
const endTime = ref("10:00");
const participants = ref<string[]>([]);
const formError = ref("");
const selectedWeekDays = ref<{ weekId: number; russianWeekDay: string }[]>([]);
const openAddEventPopover = () => {
  f7.popover.open("#add-event-popover", "#add-button");
};

const closeAddEventPopover = () => {
  f7.popover.close("#add-event-popover");
};

const validateForm = () => {
  if (!eventTitle.value || !eventResult.value) {
    formError.value = "Пожалуйста, заполните все обязательные поля";
    return false;
  }

  const start = dayjs(`${startDate.value} ${startTime.value}`);
  const end = dayjs(`${endDate.value} ${endTime.value}`);

  if (end.isBefore(start)) {
    formError.value = "Время окончания не может быть раньше начала";
    return false;
  }

  formError.value = "";
  return true;
};

const handleAddEvent = () => {
  if (!validateForm()) return;

  emit("event-added", {
    title: eventTitle.value,
    result: eventResult.value,
    startDate: startDate.value,
    startTime: startTime.value,
    endDate: endDate.value,
    endTime: endTime.value,
    participants: [...participants.value],
  });

  resetForm();
};

const resetForm = () => {
  eventTitle.value = "";
  eventResult.value = "";
  startDate.value = dayjs().format("DD MMMM YYYY");
  startTime.value = "09:00";
  endDate.value = dayjs().add(1, "hour").format("DD MMMM YYYY");
  endTime.value = "10:00";
  participants.value = [];
  selectedWeekDays.value = [];
  formError.value = "";
};

const selectWeekDay = (day: {
  date: dayjs.Dayjs;
  russianAbbreviation: string;
  isStartDate: boolean;
  isSelected: boolean;
  weekId: number;
}) => {
  dayjs.locale("ru");
  const dayObj = day.date;

  const index = selectedWeekDays.value.findIndex(
    (selectedDay) => selectedDay.weekId === day.weekId
  );

  if (index === -1) {
    // Add weekday if not already selected
    selectedWeekDays.value.push({
      weekId: day.weekId,
      russianWeekDay: dayObj.format("dddd"), // Full day name in Russian
    });
  } else {
    // Remove weekday if already selected
    selectedWeekDays.value.splice(index, 1);
  }
};

const weekDays = computed(() => {
  dayjs.locale("ru");
  const start = dayjs(startDate.value, "DD MMMM YYYY");
  const dayOfWeek = start.day();
  const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const monday = start.subtract(daysToSubtract, "day");

  return Array.from({ length: 7 }, (_, i) => {
    const currentDay = monday.add(i, "day");
    return {
      date: currentDay,
      russianAbbreviation: currentDay.format("dd").slice(0, 2).toUpperCase(),
      isStartDate: false, // currentDay.isSame(start, "day"),
      isSelected: selectedWeekDays.value.some(
        (day) => day.weekId === (currentDay.day() + 6) % 7
      ),
      weekId: (currentDay.day() + 6) % 7,
    };
  });
});

const openStreamSelection = () => {
  console.log("Stream selection opened");
};
</script>
