<template>
  <div>
    <button
      id="add-button"
      class="w-10 h-10 bg-card border border-input rounded-full flex items-center justify-center"
      aria-label="Add"
      type="button"
      @click="openAddEventPopover"
    >
      <i
        class="f7-icons text-foreground text-lg flex items-center justify-center"
      >
        plus
      </i>
    </button>

    <!-- Framework7 Popover -->
    <f7-popover
      id="add-event-popover"
      style="width: 500px !important"
      target="#add-button"
      close-on-escape
      vertical-position="right"
    >
      <div class="event-popover bg-card text-card-foreground">
        <!-- Header with buttons -->
        <div
          class="flex justify-between px-2 py-3 border-b border-input text-center"
        >
          <button
            class="text-muted-foreground hover:text-foreground disabled:opacity-50"
            @click="closeAddEventPopover"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold">Создать</span>
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!!formError"
            @click="handleAddEvent"
          >
            Добавить
          </button>
        </div>

        <div v-if="formError" class="px-4 text-destructive text-sm">
          {{ formError }}
        </div>

        <div class="p-4 space-y-4">
          <SmartSelect
            label="Модуль"
            placeholder="Выберите модуль"
            v-model="eventTitle"
            :options="moduleOptions"
            name="event-module"
            id="event-module"
          />

          <SmartSelect
            label="Результат обучения/дисциплин"
            placeholder="Сначала выберите модуль"
            v-model="eventResult"
            :options="learningOutcomeOptions"
            name="event-learning-outcome"
            id="event-learning-outcome"
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
            <span class="text-sm text-foreground">Обучающиеся</span>
            <span class="text-muted-foreground flex items-center">
              {{ participants.length || "Не выбрано" }}
              <i class="f7-icons text-muted-foreground ml-1">chevron_right</i>
            </span>
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

          <template v-for="(day, index) in selectedWeekDays" :key="index">
            <div class="text-foreground font-semibold mb-3">
              Время на {{ day.russianWeekDay.toLowerCase() }}
            </div>
            <div class="flex items-center gap-2 mb-2">
              <span class="text-muted-foreground text-sm">от</span>
              <select
                class="w-full bg-card border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">...</option>
                <option>08:00</option>
                <option>08:45</option>
                <option>08:50</option>
                <option>09:35</option>
                <option>09:45</option>
              </select>
              <span class="text-muted-foreground text-sm">до</span>
              <select
                class="w-full bg-card border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
              >
                <option value="">...</option>
                <option>08:45</option>
                <option>09:35</option>
              </select>
            </div>
          </template>

          <div class="border border-input rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-foreground">РУП</span>
              <span v-if="rupFile" class="text-sm text-muted-foreground">{{
                rupFile.name
              }}</span>
            </div>
            <label
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

          <div class="bg-secondary p-4 border-t border-input">
            <div class="flex justify-between mb-2">
              <span class="text-foreground">По плану:</span>
              <span class="text-foreground font-medium">36 часов</span>
            </div>
            <div class="flex justify-between">
              <span class="text-primary">Запланировано:</span>
              <span class="text-primary font-medium">38 часов</span>
            </div>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { f7, f7Popover } from "framework7-vue";
import DateTimeSelector from "./DateTimeSelector.vue";
import SmartSelect from "../ui/SmartSelect.vue";
import type { EventData } from "./EventService";
import { useEventService } from "./EventService";
import { useClass9Store } from "@/stores/class9Store";
import { useRupStore } from "@/stores/rupStore";
import dayjs from "dayjs";
import "dayjs/locale/ru";

const emit = defineEmits<{
  (e: "event-added", event: EventData): void;
}>();

const { eventService } = useEventService();
const class9Store = useClass9Store();
const rupStore = useRupStore();

const eventTitle = ref("");
const eventResult = ref("");
const rupFile = ref<File | null>(null);
const startDate = ref(dayjs().format("DD MMMM YYYY"));
const startTime = ref("09:00");
const endDate = ref(dayjs().add(1, "hour").format("DD MMMM YYYY"));
const endTime = ref("10:00");
const participants = ref<string[]>([]);
const formError = ref("");
const selectedWeekDays = ref<{ weekId: number; russianWeekDay: string }[]>([]);

const moduleOptions = computed(() => {
    return class9Store.getAllModulesAndOutcomes.modules;
});

const learningOutcomeOptions = computed(() => {
    return class9Store.getAllModulesAndOutcomes.outcomes;
});

const openAddEventPopover = () => {
  f7.popover.open("#add-event-popover", "#add-button");
};

const closeAddEventPopover = () => {
  f7.popover.close("#add-event-popover");
};

const handleRupFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    rupFile.value = input.files[0];
  }
};

const validateForm = () => {
  if (!eventTitle.value || !eventResult.value || !rupFile.value) {
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
    rup: "",
    file: rupFile.value,
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
  rupFile.value = null;
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
      isStartDate: false,
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
