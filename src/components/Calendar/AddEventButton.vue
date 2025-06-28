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
        <PopoverHeader
          title="Создать"
          save-text="Добавить"
          :disabled="!isFormValid"
          :on-cancel="closeAddEventPopover"
          :on-save="handleAddEvent"
        />

        <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
          {{ formError }}
        </div>

        <div class="p-4 space-y-4">
          <Select
            label="Модуль"
            placeholder="Выберите модуль"
            v-model="eventTitle"
            :options="moduleOptions"
            name="event-module"
            id="event-module"
            searchable
            @before-open="closeAddEventPopover"
            @after-close="openAddEventPopover"
          />

          <Select
            label="Результат обучения/дисциплин"
            :placeholder="
              eventTitle
                ? 'Выберите результат обучения'
                : 'Сначала выберите модуль'
            "
            v-model="eventResult"
            :options="filteredLearningOutcomes"
            name="event-learning-outcome"
            id="event-learning-outcome"
            :disabled="!eventTitle"
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
                  closeOnSelect: true,
                  dateFormat: 'dd/MM/yyyy',
                  locale: 'ru',
                  monthNames: [
                    'Январь',
                    'Февраль',
                    'Март',
                    'Апрель',
                    'Май',
                    'Июнь',
                    'Июль',
                    'Август',
                    'Сентябрь',
                    'Октябрь',
                    'Ноябрь',
                    'Декабрь',
                  ],
                  monthNamesShort: [
                    'Янв',
                    'Фев',
                    'Мар',
                    'Апр',
                    'Май',
                    'Июн',
                    'Июл',
                    'Авг',
                    'Сен',
                    'Окт',
                    'Ноя',
                    'Дек',
                  ],
                  dayNames: [
                    'Воскресенье',
                    'Понедельник',
                    'Вторник',
                    'Среда',
                    'Четверг',
                    'Пятница',
                    'Суббота',
                  ],
                  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
                  firstDay: 1,
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
                  closeOnSelect: true,
                  dateFormat: 'dd/MM/yyyy',
                  locale: 'ru',
                  monthNames: [
                    'Январь',
                    'Февраль',
                    'Март',
                    'Апрель',
                    'Май',
                    'Июнь',
                    'Июль',
                    'Август',
                    'Сентябрь',
                    'Октябрь',
                    'Ноябрь',
                    'Декабрь',
                  ],
                  monthNamesShort: [
                    'Янв',
                    'Фев',
                    'Мар',
                    'Апр',
                    'Май',
                    'Июн',
                    'Июл',
                    'Авг',
                    'Сен',
                    'Окт',
                    'Ноя',
                    'Дек',
                  ],
                  dayNames: [
                    'Воскресенье',
                    'Понедельник',
                    'Вторник',
                    'Среда',
                    'Четверг',
                    'Пятница',
                    'Суббота',
                  ],
                  dayNamesShort: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'],
                  firstDay: 1,
                }"
              ></f7-input>
            </div>
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

          <div class="border border-input rounded-lg p-3">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm text-foreground">РУП/КТП</span>
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
              <span class="text-foreground font-medium"
                >{{ plannedHours }} часов</span
              >
            </div>
            <div class="flex justify-between">
              <span class="text-primary">Запланировано:</span>
              <span class="text-primary font-medium">38 часов</span>
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
import { ref, computed, onMounted, watch } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import { storeToRefs } from "pinia";
import Select from "../ui/Select.vue";
import PopoverHeader from "../ui/PopoverHeader.vue";
import StudentSelectionPopup from "./StudentSelectionPopup.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useClass9Store } from "@/stores/class9Store";
import { useRupStore } from "@/stores/rupStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import dayjs from "dayjs";
import "dayjs/locale/ru";

const emit = defineEmits<{
  (e: "event-added", event: CalendarEvent): void;
}>();

const calendarStore = useCalendarStore();
const { moduleOptions, learningOutcomeOptions: allLearningOutcomeOptions } =
  storeToRefs(calendarStore);
const class9Store = useClass9Store();
const selectedItemsStore = useSelectedItemsStore();
const educationScheduleStore = useEducationScheduleStore();
const { schedules } = storeToRefs(educationScheduleStore);

const { selectedClass9Item } = storeToRefs(selectedItemsStore);

const eventTitle = ref("");
const eventResult = ref("");
const rupFile = ref<File | null>(null);
const startDate = ref(dayjs().locale("ru").format("DD/MM/YYYY"));
const endDate = ref(dayjs().locale("ru").format("DD/MM/YYYY"));
const participants = ref<string[]>([]);
const formError = ref<string | null>(null);
const selectedWeekDays = ref<
  {
    weekId: number;
    russianWeekDay: string;
    startTime: string;
    endTime: string;
  }[]
>([]);
const studentPopup = ref<{ open: (p: string[]) => void } | null>(null);

const isFormValid = computed(() => !!eventTitle.value && !!eventResult.value);

const filteredLearningOutcomes = computed(() => {
  if (eventTitle.value) {
    return allLearningOutcomeOptions.value.filter(
      (o) => o.moduleId === eventTitle.value
    );
  }
  return [];
});

const plannedHours = computed(() => {
  return selectedClass9Item.value?.totalHours ?? "0";
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

const handleAddEvent = async () => {
  const eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> = {
    title: eventTitle.value,
    result: eventResult.value,
    rup: rupFile.value?.name ?? "",
    file: rupFile.value,
    startDate: startDate.value,
    endDate: endDate.value,
    participants: participants.value,
  };

  try {
    formError.value = null;
    const newEvent = await calendarStore.addEvent(eventData);
    emit("event-added", newEvent);
    closeAddEventPopover();
    resetForm();
  } catch (error) {
    formError.value = "Ошибка при добавлении события.";
    console.error(error);
  }
};

const resetForm = () => {
  eventTitle.value = "";
  eventResult.value = "";
  rupFile.value = null;
  startDate.value = dayjs().locale("ru").format("DD/MM/YYYY");
  endDate.value = dayjs().locale("ru").format("DD/MM/YYYY");
  participants.value = [];
  selectedWeekDays.value = [];
  formError.value = null;
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
      startTime: "",
      endTime: "",
    });
  } else {
    selectedWeekDays.value.splice(index, 1);
  }
};

const weekDays = computed(() =>
  [
    { weekId: 0, russianAbbreviation: "ПН", name: "Понедельник" },
    { weekId: 1, russianAbbreviation: "ВТ", name: "Вторник" },
    { weekId: 2, russianAbbreviation: "СР", name: "Среда" },
    { weekId: 3, russianAbbreviation: "ЧТ", name: "Четверг" },
    { weekId: 4, russianAbbreviation: "ПТ", name: "Пятница" },
    { weekId: 5, russianAbbreviation: "СБ", name: "Суббота" },
    { weekId: 6, russianAbbreviation: "ВС", name: "Воскресенье" },
  ].map((day) => ({
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
  f7.popover.open("#add-event-popover", "#add-button");
};

const closeAddEventPopover = () => {
  f7.popover.close("#add-event-popover");
};

const handleRupFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    rupFile.value = input.files[0];
  }
};

watch(eventTitle, (newVal) => {
  if (!newVal) {
    eventResult.value = "";
  }
});

watch(eventResult, (newId) => {
  selectedItemsStore.setSelectedClass9ItemId(newId);
});
</script>
