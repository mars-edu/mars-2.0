<template>
  <div id="add-event-popover" class="event-popover bg-card text-card-foreground">
    <div class="fixed-header">
      <PopoverHeader
        :title="currentStepMeta.title"
        :subtitle="currentStepMeta.subtitle"
        cancel-text="Закрыть"
        :on-cancel="handleExit"
      >
        <div class="flex gap-1.5 pt-4">
          <div
            v-for="step in steps"
            :key="step.id"
            class="h-1 flex-1 rounded-full overflow-hidden bg-muted"
          >
            <div
              class="h-full bg-primary transition-all duration-200"
              :class="steps.findIndex(s => s.id === step.id) <= currentStepIndex ? 'w-full' : 'w-0'"
            />
          </div>
        </div>
      </PopoverHeader>

      <div v-if="formError" class="px-4 py-2 text-destructive text-sm border-b border-input">
        {{ formError }}
      </div>
    </div>

    <div class="wizard-content px-8 py-4 space-y-5">
      <section v-if="currentStep === 1" class="space-y-5">
        <div class="space-y-1.5">
          <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
            Дисциплина
          </div>
          <DisciplineSelect
            id="event-rupEntry-generic"
            placeholder="Выберите дисциплину"
            v-model="rupEntryIdModel"
            :searchable="false"
          />
        </div>

        <div class="space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
            Нагрузка
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl border border-input bg-muted p-4">
              <div class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                План
              </div>
              <div class="mt-1 text-[34px] font-bold text-foreground leading-none">
                {{ totalPlannedHours }} ч.
              </div>
              <div class="mt-1 text-xs text-muted-foreground font-medium">Полный курс</div>
            </div>
            <div class="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
              <div class="text-[11px] font-semibold uppercase tracking-wide text-orange-600 dark:text-orange-400">
                Семестр
              </div>
              <div class="mt-1 text-[34px] font-bold text-orange-600 dark:text-orange-400 leading-none">
                {{ semesterPlannedHours }} ч.
              </div>
              <div class="mt-1 text-xs text-orange-500 dark:text-orange-400 font-medium">К распределению</div>
            </div>
          </div>
        </div>

        <ColorPicker
          v-model="colorModel"
          target-id="color-picker-generic"
          label="Цвет"
          vertical
        />
      </section>

      <section v-if="currentStep === 2" class="space-y-6">
        <div class="space-y-3">
          <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
            Период
          </div>

          <div class="bg-muted p-1 rounded-xl flex gap-1">
            <button 
              class="flex-1 py-1.5 text-sm font-medium rounded-lg transition-all"
              :class="!useCustomPeriodModel ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'"
              @click="useCustomPeriodModel = false"
            >
              Семестр
            </button>
            <button 
              class="flex-1 py-1.5 text-sm font-medium rounded-lg transition-all"
              :class="useCustomPeriodModel ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'"
              @click="useCustomPeriodModel = true"
            >
              Свой период
            </button>
          </div>

          <div class="bg-card rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border/60">
            <template v-if="!useCustomPeriodModel">
              <div v-if="semesterDates" class="flex flex-col gap-1.5">
                <span v-if="semesterDates.semesterText" class="text-[11px] font-semibold text-primary uppercase tracking-widest">
                  {{ semesterDates.semesterText }}
                </span>
                <div class="text-[15px] font-medium leading-tight text-foreground">
                  {{ semesterDates.startDate }} — {{ semesterDates.endDate }}
                </div>
              </div>
              <div v-else class="text-sm text-muted-foreground">
                Период не определен
              </div>
            </template>

            <template v-else>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-xs font-medium text-muted-foreground ml-1">Начало</label>
                  <DateInput v-model:value="startDateModel" placeholder="Дата" />
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-medium text-muted-foreground ml-1">Конец</label>
                  <DateInput v-model:value="endDateModel" placeholder="Дата" />
                </div>
              </div>
            </template>
          </div>
        </div>

        <div v-if="dateValidationError" class="text-destructive text-sm">
          {{ dateValidationError }}
        </div>

        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="text-[13px] font-semibold uppercase tracking-widest text-foreground opacity-70">Расписание</div>
            <span
              class="rounded-lg px-2 py-1 text-[12px] font-medium"
              :class="isSelectedHoursExceeded ? 'bg-red-500/15 text-red-600 dark:text-red-400' : (selectedHours === semesterPlannedHours && semesterPlannedHours > 0 ? 'bg-green-500/15 text-green-600 dark:text-green-400' : 'bg-red-500/15 text-red-600 dark:text-red-400')"
            >{{ selectedHours }} / {{ semesterPlannedHours }} ч.</span>
          </div>
          <div class="grid grid-cols-7 gap-1.5 w-full">
            <button
              v-for="day in weekDays"
              :id="`event-weekday-${day.weekId}`"
              :key="day.weekId"
              class="w-full h-10 rounded-xl text-[12px] font-semibold flex items-center justify-center cursor-pointer transition-all duration-200 active:scale-95"
              :class="{
                'bg-foreground text-background shadow-md scale-[1.02]': day.isSelected,
                'bg-muted text-muted-foreground hover:bg-muted/80': !day.isSelected,
              }"
              @click="toggleWeekDay(day.weekId, day.name)"
            >
              {{ day.abbreviation }}
            </button>
          </div>
        </div>

        <template v-for="day in groupedWeekSchedules" :key="day.weekId">
          <div class="p-4 bg-card rounded-2xl shadow-sm border border-border/60 flex gap-4 items-start animate-in slide-in-from-bottom-2 fade-in duration-300">
            <!-- Left col: day name + add button -->
            <div class="flex flex-col items-center gap-2 pt-1 shrink-0">
              <span class="font-semibold text-foreground text-[13px] w-8 text-center">{{ weekDays.find(d => d.weekId === day.weekId)?.abbreviation }}</span>
              <button
                :id="`event-weekday-add-${day.weekId}`"
                class="w-8 h-8 rounded-full bg-muted text-primary hover:bg-primary/10 flex items-center justify-center transition-colors"
                @click="addWeekDaySlot(day.weekId, day.russianWeekDay)"
                title="Добавить время"
              >
                <IconPlus class="text-sm" />
              </button>
            </div>

            <!-- Right col: time slots -->
            <div class="flex-1 space-y-3">
              <div
                v-for="slot in day.slots"
                :key="slot.index"
                class="flex items-center gap-2 w-full"
              >
                <div class="flex-1 min-w-0">
                  <Select
                    :id="`event-weekday-start-${day.weekId}-${slot.slotOrder}`"
                    :modelValue="slot.value.startId"
                    :options="startTimeOptions"
                    placeholder="Начало"
                    class="w-full"
                    @update:modelValue="(v) => updateWeekDayTime(slot.index, 'startId', v)"
                  />
                </div>
                <span class="text-muted-foreground text-sm shrink-0">—</span>
                <div class="flex-1 min-w-0">
                  <Select
                    :id="`event-weekday-end-${day.weekId}-${slot.slotOrder}`"
                    :modelValue="slot.value.endId"
                    :options="slot.value.startId ? getEndTimeOptionsForStart(slot.value.startId) : endTimeOptions"
                    placeholder="Конец"
                    class="w-full"
                    @update:modelValue="(v) => updateWeekDayTime(slot.index, 'endId', v)"
                  />
                </div>
                <button
                  class="w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center shrink-0"
                  @click="removeWeekDaySlot(day.weekId, slot.index)"
                  title="Удалить время"
                >
                  <IconX class="text-sm" />
                </button>
              </div>
            </div>
          </div>
        </template>


        <div v-if="hoursExceededError" class="text-destructive text-sm">
          {{ hoursExceededError }}
        </div>

        <div v-if="slotTimeError" class="text-destructive text-sm">
          {{ slotTimeError }}
        </div>

        <ScheduleConflictBanner :conflicts="step2Conflicts" />
      </section>

      <section v-if="currentStep === 3" id="event-form-participants" class="space-y-4">
        <ScheduleConflictBanner :conflicts="step3Conflicts" />

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="event-student-language"
            label="Язык обучения"
            placeholder="Все"
            v-model="studentFilters.language"
            :options="studentLanguageOptions"
          />
          <Select
            id="event-student-specialty"
            label="Специальность"
            placeholder="Все"
            v-model="studentFilters.specialty"
            :multiple="true"
            :options="studentSpecialtyOptions"
          />
          <Select
            id="event-student-course"
            label="Курс"
            placeholder="Все"
            v-model="studentFilters.course"
            :options="studentCourseOptions"
          />
          <Select
            id="event-student-gender"
            label="Пол"
            placeholder="Все"
            v-model="studentFilters.gender"
            :options="studentGenderOptions"
          />
        </div>

        <div>
          <f7-input
            id="event-student-search"
            type="text"
            placeholder="Поиск по ФИО..."
            v-model:value="studentFilters.searchTerm"
            clear-button
          />
        </div>

        <div class="flex items-center justify-between rounded-xl border border-input bg-secondary/40 px-4 py-2.5">
          <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Найдено: <span class="text-foreground">{{ filteredStudents.length }}</span>
          </span>
          <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Выбрано: <span class="text-foreground">{{ participantsModel.length }}</span>
          </span>
        </div>

        <div class="flex justify-between gap-2">
          <button
            class="flex-1 py-2 px-4 rounded-lg border border-input text-sm text-muted-foreground font-medium hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
            @click="toggleSelectAllStudents"
          >
            Выбрать всех
          </button>
          <button
            class="flex-1 py-2 px-4 rounded-lg border border-input text-sm text-muted-foreground font-medium hover:bg-primary/10 hover:text-primary hover:border-primary transition-colors"
            @click="participantsModel = []"
          >
            Сбросить
          </button>
        </div>

        <div class="students-table-wrap rounded-xl border border-input bg-card overflow-hidden">
          <div class="students-table-header">
            <label class="students-table-cell students-table-cell-checkbox">
              <input
                id="event-student-select-all"
                type="checkbox"
                :checked="isAllFilteredStudentsSelected"
                @change="toggleSelectAllStudents"
              />
            </label>
            <div class="students-table-cell students-table-cell-name">Полное имя</div>
            <div class="students-table-cell students-table-cell-course">Курс</div>
          </div>

          <div
            v-for="student in filteredStudents"
            :key="student.id"
            class="students-table-row"
            @click="toggleStudentSelection(student.id)"
          >
            <label
              class="students-table-cell students-table-cell-checkbox"
              :for="`event-student-checkbox-${student.id}`"
              @click.stop
            >
              <input
                :id="`event-student-checkbox-${student.id}`"
                type="checkbox"
                :checked="isStudentSelected(student.id)"
                @click.stop="toggleStudentSelection(student.id)"
              />
            </label>
            <div class="students-table-cell students-table-cell-name">
              {{ studentStore.getStudentFullName(student.id) }}
            </div>
            <div class="students-table-cell students-table-cell-course">
              {{ student.course || "-" }}
            </div>
          </div>

          <div
            v-if="filteredStudents.length === 0"
            class="p-4 text-sm text-muted-foreground text-center"
          >
            Нет обучающихся по выбранным фильтрам
          </div>
        </div>
      </section>

      <section v-if="currentStep === 4" class="space-y-4">
        <button
          id="event-form-ktp"
          class="w-full flex items-center justify-between p-3 rounded-lg border border-input bg-card hover:bg-muted/50 transition-colors"
          @click="openKtpPopup"
        >
          <span class="text-sm text-foreground">РУП/КТП</span>
          <span class="text-muted-foreground flex items-center">
            Открыть
            <IconChevronRight class="text-muted-foreground ml-1" />
          </span>
        </button>

        <div class="bg-secondary p-4 rounded-lg border border-input space-y-1">
          <div class="text-sm text-muted-foreground">Статус программы</div>
          <div class="text-sm font-medium text-foreground">
            {{ currentKtpId ? `Тем КТП: ${currentKtpDetailCount}` : 'КТП не создан' }}
          </div>
        </div>
      </section>

      <section v-if="currentStep === 5" class="space-y-4">
        <IndividualJournalsEditor
          ref="individualEditorRef"
          v-model:useIndividualJournals="useIndividualJournalsModel"
          v-model:gradingType="gradingTypeModel"
          v-model:individualJournals="individualJournalsModel"
          :rup-entry-id="rupEntryIdModel"
          :semester-id="props.semesterId"
          :week-count="props.weekCount"
          :student-pool="participantsModel"
          :semester-planned-hours="semesterPlannedHours"
          :week-days="weekDays"
          :start-time-options="startTimeOptions"
          :end-time-options="endTimeOptions"
          :get-end-time-options-for-start="getEndTimeOptionsForStart"
        />
      </section>
    </div>

    <PopoverFooter
      :cancel-text="isFirstStep ? 'Отмена' : 'Назад'"
      :save-text="isLastStep ? (props.mode === 'edit' ? 'Сохранить' : 'Создать') : 'Далее'"
      :disabled="!isPrimaryEnabled"
      :save-variant="isLastStep ? 'success' : 'primary'"
      :on-cancel="handleBack"
      :on-save="handlePrimaryAction"
    />

    <KtpDetailPopup
      :opened="isKtpPopupOpen"
      :ktp-id="currentKtpId"
      :module-title="currentKtpTitle"
      :on-back="handleKtpBack"
      :on-next="handleKtpNext"
      @update:opened="handleKtpPopupClosed"
    />

  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch, type Ref } from "vue";
import { f7 } from "framework7-vue";

import IconX from "~icons/lucide/x";
import IconPlus from "~icons/lucide/plus";
import IconChevronRight from "~icons/lucide/chevron-right";
import IndividualJournalsEditor from "./IndividualJournalsEditor.vue";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/ru";
import { storeToRefs } from "pinia";
import { withAllOption, getGenderOptions } from "@/lib/utils";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import Select from "@/components/ui/Select.vue";
import DisciplineSelect from "@/components/DisciplineSelect.vue";
import ColorPicker from "@/components/ui/ColorPicker.vue";
import DateInput from "@/components/ui/DateInput.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
import ScheduleConflictBanner from "./ScheduleConflictBanner.vue";
import { detectScheduleConflicts } from "@/lib/scheduleConflicts";
import { useCalendarStore } from "@/stores/calendarStore";
import { useTeacherStore } from "@/stores/teacherStore";
import {
  getWeekDays,
  DATE_UI_FORMAT,
} from "@/constants/calendar";
import { useNestedParent } from "@/composables/useNestedParent";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useStudyLanguageStore } from "@/stores/studyLanguageStore";
import { useCourseStore } from "@/stores/courseStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useKtpStore } from "@/stores/ktpStore";
import {
  ADD_WIZARD_STEPS,
  useAddEventWizard,
  type AddWizardStep,
  type IndividualJournalDraft,
} from "./useAddEventWizard";
import type { SemesterDates, WeekDaySchedule } from "./useEventFormDerived";

dayjs.extend(customParseFormat);
dayjs.locale("ru");

const props = withDefaults(defineProps<{
  rupEntryId: string;
  useCustomPeriod: boolean;
  startDate?: string;
  endDate?: string;
  participants: string[];
  color: string;
  selectedWeekDays: WeekDaySchedule[];
  semesterId: string;
  semesterDates?: SemesterDates | null;
  totalPlannedHours: string;
  semesterPlannedHours: string;
  selectedHours: string;
  weekCount: number;
  hoursExceededError?: string | null;
  slotTimeError?: string | null;
  dateValidationError?: string | null;
  derivedIsValid: boolean;
  tempEventId: string;
  formError?: string | null;
  isSubmitting?: boolean;
  useIndividualJournals: boolean;
  gradingType: "combined" | "separate" | "";
  individualJournals: IndividualJournalDraft[];
  requestClose: () => void;
  sessionKey: number;
  mode?: "add" | "edit";
}>(), {
  mode: "add",
});

const {
  semesterDates,
  totalPlannedHours,
  semesterPlannedHours,
  selectedHours,
  hoursExceededError,
  slotTimeError,
  dateValidationError,
  formError,
} = toRefs(props);

const emit = defineEmits<{
  (e: "update:rupEntryId", v: string): void;
  (e: "update:useCustomPeriod", v: boolean): void;
  (e: "update:startDate", v: string): void;
  (e: "update:endDate", v: string): void;
  (e: "update:participants", v: string[]): void;
  (e: "update:color", v: string): void;
  (e: "update:selectedWeekDays", v: WeekDaySchedule[]): void;
  (e: "update:useIndividualJournals", v: boolean): void;
  (e: "update:gradingType", v: "combined" | "separate" | ""): void;
  (e: "update:individualJournals", v: IndividualJournalDraft[]): void;
  (e: "submit"): void;
}>();

const requestClose = () => {
  props.requestClose();
};

const rupEntryStore = useRupEntryStore();
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useStudyLanguageStore();
const courseStore = useCourseStore();
const educationScheduleStore = useEducationScheduleStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const ktpStore = useKtpStore();
const calendarStore = useCalendarStore();
const teacherStore = useTeacherStore();

const draftConflicts = computed(() => {
  const activeSem = props.semesterDates;
  const start = props.useCustomPeriod ? (props.startDate || "") : (activeSem?.startDate || "");
  const end = props.useCustomPeriod ? (props.endDate || "") : (activeSem?.endDate || "");

  if (!start || !end || selectedWeekDaysModel.value.length === 0) {
    return [];
  }

  const rup = rupEntryStore.getRupEntryById(props.rupEntryId);
  const teacherId = calendarStore.selectedTeacherId || undefined;

  const bellSlots = educationScheduleStore.getActiveYearSchedules;
  const studentNamesMap = new Map(
    studentStore.students.map((s) => [s.id, studentStore.getStudentFullName(s)])
  );
  const teacherNamesMap = new Map(
    teacherStore.teachers.map((t) => [t.id, teacherStore.getTeacherFullName(t)])
  );

  return detectScheduleConflicts(
    {
      id: props.tempEventId,
      title: rup?.moduleName || "Новое занятие",
      teacherId,
      participants: participantsModel.value,
      startDate: start,
      endDate: end,
      weeklySchedules: selectedWeekDaysModel.value,
    },
    calendarStore.events,
    {
      bellSlots,
      studentNamesMap,
      teacherNamesMap,
      excludeEventId: props.tempEventId,
    }
  );
});

const step2Conflicts = computed(() =>
  draftConflicts.value.filter((c) => c.type === "teacher")
);

const step3Conflicts = computed(() =>
  draftConflicts.value.filter((c) => c.type === "student")
);

const { students } = storeToRefs(studentStore);
const { specialtyOptions: storeSpecialtyOptions } = storeToRefs(specialtyStore);
const { languageOptions: storeLanguageOptions } = storeToRefs(languageStore);
const { courseOptions: storeCourseOptions } = storeToRefs(courseStore);
const { getActiveYearSchedules, getSchedulesBySemester } = storeToRefs(educationScheduleStore);

const parentPopupId = computed(() =>
  props.mode === "edit" ? "#edit-journal-popup" : "#add-event-popup"
);

const { closeParent, openParent } = useNestedParent({
  parentId: parentPopupId,
  kind: "popup",
});

const rupEntryIdModel = computed({
  get: () => props.rupEntryId,
  set: (v: string) => emit("update:rupEntryId", v),
});

const useCustomPeriodModel = computed({
  get: () => props.useCustomPeriod,
  set: (v: boolean) => emit("update:useCustomPeriod", v),
});

const participantsModel = computed({
  get: () => props.participants,
  set: (v: string[]) => emit("update:participants", v),
});

const selectedWeekDaysModel = computed<WeekDaySchedule[]>({
  get: () => props.selectedWeekDays,
  set: (v: WeekDaySchedule[]) => emit("update:selectedWeekDays", v),
});

const colorModel = computed({
  get: () => ({ hex: props.color || "#8E8E93" }),
  set: (v: { hex: string }) => emit("update:color", v?.hex || "#8E8E93"),
});

const useIndividualJournalsModel = computed({
  get: () => props.useIndividualJournals,
  set: (v: boolean) => emit("update:useIndividualJournals", v),
});

const gradingTypeModel = computed({
  get: () => props.gradingType,
  set: (v: "combined" | "separate" | "") => emit("update:gradingType", v),
});

const individualJournalsModel = computed({
  get: () => props.individualJournals,
  set: (v: IndividualJournalDraft[]) => emit("update:individualJournals", v),
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

const weekDays = computed(() => {
  return getWeekDays().map((day) => ({
    ...day,
    isSelected: selectedWeekDaysModel.value.some(
      (selected) => selected.weekId === day.weekId
    ),
  }));
});

const groupedWeekSchedules = computed(() => {
  const grouped = new Map<
    number,
    {
      weekId: number;
      russianWeekDay: string;
      slots: Array<{
        index: number;
        slotOrder: number;
        value: WeekDaySchedule;
      }>;
    }
  >();

  selectedWeekDaysModel.value.forEach((slot, index) => {
    const existing = grouped.get(slot.weekId);
    if (existing) {
      existing.slots.push({
        index,
        slotOrder: existing.slots.length,
        value: slot,
      });
      return;
    }

    grouped.set(slot.weekId, {
      weekId: slot.weekId,
      russianWeekDay: slot.russianWeekDay,
      slots: [{ index, slotOrder: 0, value: slot }],
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.weekId - b.weekId);
});

const activeSemesterSchedules = computed(() => {
  if (!props.semesterId) return getActiveYearSchedules.value;
  const schedules = getSchedulesBySemester.value(props.semesterId);
  return [...schedules].sort((a, b) => a.lessonNumber - b.lessonNumber);
});

const startTimeOptions = computed(() => {
  return activeSemesterSchedules.value.map((schedule) => ({
    value: schedule.id,
    text: schedule.startTime,
  }));
});

const endTimeOptions = computed(() => {
  return activeSemesterSchedules.value.map((schedule) => ({
    value: schedule.id,
    text: schedule.endTime,
  }));
});

function getEndTimeOptionsForStart(startId: string) {
  const schedules = activeSemesterSchedules.value;
  const startIndex = startId ? schedules.findIndex((s) => s.id === startId) : -1;
  if (startIndex === -1) return [];
  return schedules
    .filter((_, i) => i >= startIndex)
    .map((schedule) => ({ value: schedule.id, text: schedule.endTime }));
}

function toggleWeekDay(weekId: number, name: string) {
  const current = selectedWeekDaysModel.value || [];
  const exists = current.some((d) => d.weekId === weekId);

  if (exists) {
    selectedWeekDaysModel.value = current.filter((d) => d.weekId !== weekId);
    return;
  }

  selectedWeekDaysModel.value = [
    ...current,
    { weekId, russianWeekDay: name, startId: "", endId: "" },
  ];
}

function updateWeekDayTime(
  index: number,
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
  if (!current[index]) return;

  const updated = { ...current[index], [field]: nextValue };

  if (field === "startId") {
    updated.endId = nextValue;
  }
  selectedWeekDaysModel.value = [
    ...current.slice(0, index),
    updated,
    ...current.slice(index + 1),
  ];
}

function addWeekDaySlot(weekId: number, russianWeekDay: string) {
  selectedWeekDaysModel.value = [
    ...selectedWeekDaysModel.value,
    { weekId, russianWeekDay, startId: "", endId: "" },
  ];
}

function removeWeekDaySlot(weekId: number, index: number) {
  const current = [...selectedWeekDaysModel.value];
  if (!current[index]) return;

  current.splice(index, 1);
  selectedWeekDaysModel.value = current;

  const hasWeekSlots = current.some((slot) => slot.weekId === weekId);
  if (!hasWeekSlots) {
    selectedWeekDaysModel.value = current.filter((slot) => slot.weekId !== weekId);
  }
}

const studentFilters = reactive({
  searchTerm: "",
  language: "all",
  specialty: [] as string[],
  course: "all",
  gender: "",
});

const studentLanguageOptions = computed(() =>
  withAllOption(storeLanguageOptions.value, "Все", "all")
);
const studentSpecialtyOptions = computed(() =>
  withAllOption(storeSpecialtyOptions.value, "Все", "all")
);
const studentCourseOptions = computed(() =>
  withAllOption(storeCourseOptions.value, "Все", "all")
);
const studentGenderOptions = computed(() => getGenderOptions("Все", ""));

const allowedSpecialtyIds = computed(() => {
  if (!rupEntryIdModel.value) return [];
  const selectedRupEntry = rupEntryStore.getRupEntryById(rupEntryIdModel.value);
  return selectedRupEntry?.specialtyIds || [];
});

const allowedAcademicYearId = computed<string | undefined>(() => {
  if (!rupEntryIdModel.value) return undefined;
  const selectedRupEntry = rupEntryStore.getRupEntryById(rupEntryIdModel.value);
  return selectedRupEntry?.academicYearId;
});

const filteredStudents = computed(() => {
  const term = studentFilters.searchTerm.trim().toLowerCase();

  return students.value
    .map((student) => ({
      ...student,
      course: studentStore.getCourseByStudentId(student.id) ?? 0,
      fullName: studentStore.getStudentFullName(student.id),
    }))
    .filter((student) =>
      studentFilters.course === "all"
        ? true
        : student.course === Number(studentFilters.course)
    )
    .filter((student) => {
      const ids = allowedSpecialtyIds.value || [];
      return ids.length === 0 ? true : ids.includes(student.specialty);
    })
    .filter((student) => {
      const academicYearId = allowedAcademicYearId.value;
      return academicYearId ? student.academicYearId === academicYearId : true;
    })
    .filter((student) =>
      studentFilters.language === "all"
        ? true
        : student.language === studentFilters.language
    )
    .filter((student) =>
      studentFilters.specialty.length === 0
        ? true
        : studentFilters.specialty.includes(student.specialty)
    )
    .filter((student) =>
      studentFilters.gender ? student.gender === studentFilters.gender : true
    )
    .filter((student) => (term ? student.fullName.toLowerCase().includes(term) : true));
});

const selectedStudentSet = computed(() => new Set(participantsModel.value));

const isAllFilteredStudentsSelected = computed(() => {
  if (filteredStudents.value.length === 0) return false;
  return filteredStudents.value.every((student) =>
    selectedStudentSet.value.has(student.id)
  );
});

function isStudentSelected(studentId: string) {
  return selectedStudentSet.value.has(studentId);
}

function toggleStudentSelection(studentId: string) {
  const nextSelected = new Set(participantsModel.value);
  if (nextSelected.has(studentId)) {
    nextSelected.delete(studentId);
  } else {
    nextSelected.add(studentId);
  }
  participantsModel.value = Array.from(nextSelected);
}

function toggleSelectAllStudents() {
  const nextSelected = new Set(participantsModel.value);
  if (isAllFilteredStudentsSelected.value) {
    filteredStudents.value.forEach((student) => nextSelected.delete(student.id));
  } else {
    filteredStudents.value.forEach((student) => nextSelected.add(student.id));
  }
  participantsModel.value = Array.from(nextSelected);
}

const isKtpPopupOpen = ref(false);
const currentKtpIdRef = ref<string | null>(null);



const handleExit = () => {
  // Just call requestClose — GuardedPopover's unsaved guard will handle the confirm dialog if dirty
  props.requestClose();
};

const semesterForKtp = computed(() => {
  if (!props.semesterId) return null;
  return academicYearSemesterStore.getAcademicYearSemesterById(props.semesterId) || null;
});

const currentKtp = computed(() => {
  if (currentKtpIdRef.value) {
    return ktpStore.findKtpById(currentKtpIdRef.value) || null;
  }

  if (!rupEntryIdModel.value || !semesterForKtp.value || !props.tempEventId) {
    return null;
  }

  return (
    ktpStore.findKtpByRupEntryId(
      rupEntryIdModel.value,
      semesterForKtp.value.academicYearId,
      semesterForKtp.value.id,
      props.tempEventId
    ) || null
  );
});

const currentKtpId = computed(() => {
  return currentKtp.value?.id || null;
});

const currentKtpDetailCount = computed(() => {
  if (!currentKtpId.value) return 0;
  return ktpStore.getDetailsByKtpId(currentKtpId.value).length;
});

const isProgramReady = computed(() => currentKtpDetailCount.value > 0);

// --- Step 5: Individual journals ---

const individualEditorRef = ref<InstanceType<typeof IndividualJournalsEditor> | null>(null);

const isStep5Valid = computed(() => {
  if (!props.useIndividualJournals) return true;
  if (!props.gradingType) return false;
  if (props.individualJournals.length === 0) return false;
  if (!(individualEditorRef.value?.isIndividualHoursMatching ?? false)) return false;
  return props.individualJournals.every(
    (j) =>
      j.studentIds.length > 0 &&
      j.daySlots.length > 0 &&
      j.daySlots.every((s) => !!s.startId && !!s.endId)
  );
});

const currentKtpTitle = computed(() => {
  if (!rupEntryIdModel.value) return undefined;
  const rupEntryItem = rupEntryStore.getRupEntryById(rupEntryIdModel.value);
  if (!rupEntryItem) return undefined;
  return `${rupEntryItem.moduleIndex} - ${rupEntryItem.moduleName}`;
});

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

  if (!props.tempEventId) {
    f7.dialog.alert("Не удалось подготовить форму создания", "Ошибка");
    return;
  }

  try {
    const ktp = await ktpStore.ensureKtpForRupEntry(
      rupEntryIdModel.value,
      semesterForKtp.value.academicYearId,
      semesterForKtp.value.id,
      props.tempEventId
    );

    currentKtpIdRef.value = ktp.id;
    ktpStore.fetchDetailsForKtp(ktp.id);
    closeParent();
    isKtpPopupOpen.value = true;
  } catch (error) {
    console.error("Failed to ensure KTP:", error);
    f7.dialog.alert("Не удалось создать КТП", "Ошибка");
  }
}

function handleKtpPopupClosed(isOpen: boolean) {
  isKtpPopupOpen.value = isOpen;
  if (!isOpen) {
    if (currentKtpId.value) {
      ktpStore.fetchDetailsForKtp(currentKtpId.value);
    }
    openParent();
  }
}

function handleKtpBack() {
  handleKtpPopupClosed(false);
}

function handleKtpNext() {
  handleKtpPopupClosed(false);
}

watch(
  () => props.rupEntryId,
  () => {
    currentKtpIdRef.value = null;
  }
);

watch(
  () => props.sessionKey,
  () => {
    currentKtpIdRef.value = null;
    isKtpPopupOpen.value = false;
    Object.assign(studentFilters, {
      searchTerm: "",
      language: "all",
      specialty: [],
      course: "all",
      gender: "",
    });
    reset();
  }
);

const lastStepRef = computed<AddWizardStep>(() =>
  props.mode === "edit" ? 4 : 5
);

const {
  currentStep,
  currentStepMeta,
  isFirstStep,
  isLastStep,
  isCurrentStepValid,
  nextStep,
  previousStep,
  reset,
} = useAddEventWizard({
  rupEntryId: rupEntryIdModel,
  color: computed(() => colorModel.value.hex),
  participants: participantsModel,
  selectedWeekDays: selectedWeekDaysModel,
  isScheduleDerivedValid: computed(() => props.derivedIsValid),
  dateValidationError: computed(() => dateValidationError.value || null),
  hoursExceededError: computed(() => hoursExceededError.value || null),
  slotTimeError: computed(() => slotTimeError.value || null),
  isProgramReady,
  isStep5Valid,
  lastStep: lastStepRef,
});

const steps = computed(() =>
  props.mode === "edit"
    ? ADD_WIZARD_STEPS.filter((s) => s.id !== 5)
    : ADD_WIZARD_STEPS
);

const currentStepIndex = computed(() =>
  steps.value.findIndex((s) => s.id === currentStep.value)
);

const isSelectedHoursExceeded = computed(() => {
  return Number(selectedHours.value || "0") > Number(semesterPlannedHours.value || "0");
});

const isPrimaryEnabled = computed(() => {
  if (!isCurrentStepValid.value) return false;
  if (isLastStep.value) return !props.isSubmitting;
  return true;
});

function handleBack() {
  if (isFirstStep.value) {
    handleExit();
    return;
  }
  previousStep();
}

function handlePrimaryAction() {
  if (!isCurrentStepValid.value) return;

  if (isLastStep.value) {
    emit("submit");
    return;
  }

  nextStep();
}

defineExpose<{
  reset: () => void;
  currentStep: Ref<AddWizardStep>;
}>({
  reset,
  currentStep,
});
</script>

<style scoped>
.event-popover {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  width: 100%;
  height: 100%;
}

.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
}

.wizard-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.students-table-header,
.students-table-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 72px;
  align-items: center;
}

.students-table-header {
  background-color: hsl(var(--secondary));
  border-bottom: 1px solid hsl(var(--border));
}

.students-table-row {
  border-bottom: 1px solid hsl(var(--border));
  cursor: pointer;
}

.students-table-row:last-of-type {
  border-bottom: none;
}

.students-table-row:hover {
  background-color: hsl(var(--muted) / 0.5);
}

.students-table-cell {
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  min-width: 0;
}

.students-table-cell-checkbox {
  display: flex;
  justify-content: center;
}

.students-table-cell-name {
  color: hsl(var(--foreground));
}

.students-table-cell-course {
  text-align: center;
  color: hsl(var(--muted-foreground));
}

.students-table-wrap {
  max-height: 320px;
  overflow-y: auto;
}
</style>
