<template>
  <f7-popover
    id="class9-popover"
    :arrow="false"
    style="width: calc(100vw - 400px) !important"
    close-on-escape
  >
    <div class="course-popover bg-card text-card-foreground">
      <PopoverHeader
        title="Создать"
        :disabled="!isFormValid"
        :on-cancel="close"
        :on-save="submit"
      >
        <template #title >
          <div v-if="!editMode" class="flex items-center space-x-4">
            <button @click="removeStep(currentStep)" v-if="steps.length > 1">
              <f7-icon f7="trash" class="text-red-500"></f7-icon>
            </button>
            <div
              class="text-foreground font-semibold flex items-center space-x-4"
            >
              <f7-button
                small
                outline
                @click.stop="onBack"
                :disabled="currentStep === 1"
              >
                Назад
              </f7-button>
              <div class="flex items-center space-x-2">
                <div
                  v-for="step in steps.length"
                  :key="step"
                  class="w-2 h-2 rounded-full transition-colors duration-200"
                  :class="[
                    step === currentStep ? 'bg-primary' : 'bg-gray-300',
                    step < currentStep ? 'bg-gray-300' : '',
                  ]"
                ></div>
              </div>
              <div class="flex items-center space-x-2">
                <f7-button small outline @click.stop="onNext">
                  {{ currentStep === steps.length ? "Добавить" : "Далее" }}
                </f7-button>
              </div>
              
            </div>
          </div>
          <div v-else class="border-t border-border">
        <button
          class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
          @click="showDeleteConfirmation"
        >
          <f7-icon ios="f7:trash" md="material:delete" size="18px" class="mr-2" />
          Удалить
        </button>
          </div>
        </template>
      </PopoverHeader>

      <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
        {{ formError }}
      </div>

      <div class="p-4 space-y-4">
        <div
          v-for="(stepData, index) in steps"
          :key="index"
          v-show="currentStep === index + 1"
        >
          <div class="flex justify-between items-center mb-4"></div>

          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="module-index">
                Индекс модуля/дисциплины
              </label>
              <div class="flex gap-2 w-full">
                <f7-input
                  :id="'module-index-' + index"
                  class="w-full"
                  :class="{ 'has-data': stepData.moduleIndex }"
                  type="text"
                  placeholder="Введите индекс"
                  clear-button
                  v-model:value="stepData.moduleIndex"
                >
                  <template #media>
                    <f7-icon
                      f7="checkmark_alt"
                      class="text-green-500"
                    ></f7-icon>
                  </template>
                </f7-input>
                <f7-button
                  v-if="index > 0"
                  small
                  class="copy-button flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 hover:bg-green-600"
                  @click="copyFromPreviousStep(index, 'moduleIndex')"
                  tooltip="Вставить из предыдущего"
                >
                  <f7-icon f7="square_on_square" class="text-lg"></f7-icon>
                </f7-button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="module-name">
                Наименование модуля/дисциплины
              </label>
              <div class="flex gap-2 w-full">
                <f7-input
                  :id="'module-name-' + index"
                  class="w-full"
                  :class="{ 'has-data': stepData.moduleName }"
                  type="text"
                  placeholder="Введите наименование"
                  clear-button
                  v-model:value="stepData.moduleName"
                >
                  <template #media>
                    <f7-icon
                      f7="checkmark_alt"
                      class="text-green-500"
                    ></f7-icon>
                  </template>
                </f7-input>
                <f7-button
                  v-if="index > 0"
                  small
                  class="copy-button flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 hover:bg-green-600"
                  @click="copyFromPreviousStep(index, 'moduleName')"
                  tooltip="Вставить из предыдущего"
                >
                  <f7-icon f7="square_on_square" class="text-lg"></f7-icon>
                </f7-button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="learning-outcome">
                Наименование результата обучения
                <span class="text-muted-foreground">(при наличии)</span>
              </label>
              <div class="flex gap-2 w-full">
                <f7-input
                  :id="'learning-outcome-' + index"
                  class="w-full"
                  :class="{ 'has-data': stepData.learningOutcome }"
                  type="text"
                  placeholder="Введите результат"
                  clear-button
                  v-model:value="stepData.learningOutcome"
                >
                  <template #media>
                    <f7-icon
                      f7="checkmark_alt"
                      class="text-green-500"
                    ></f7-icon>
                  </template>
                </f7-input>
                <f7-button
                  v-if="index > 0"
                  small
                  class="copy-button flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 hover:bg-green-600"
                  @click="copyFromPreviousStep(index, 'learningOutcome')"
                  tooltip="Вставить из предыдущего"
                >
                  <f7-icon f7="square_on_square" class="text-lg"></f7-icon>
                </f7-button>
              </div>
            </div>

            <div class="mt-6">
              <div class="text-sm font-medium mb-3">Форма контроля</div>

              <div class="space-y-3">
                <div
                  class="flex items-center justify-between p-3 border border-input rounded-lg hover:border-red-500"
                  @click="toggleCheckbox(index, 'exam')"
                >
                  <div class="flex items-center gap-3">
                    <f7-checkbox
                      @click.stop
                      v-model:checked="stepData.examEnabled"
                    ></f7-checkbox>
                    <span class="text-sm">Экзамен</span>
                  </div>
                  <div class="flex gap-1">
                    <f7-button
                      v-for="i in 8"
                      :key="i"
                      small
                      class="semester-button w-7 h-7 min-w-7 border border-red-500"
                      :fill="stepData.examSemesters[i - 1]"
                      @click="(e) => toggleSemester(index, 'exam', i - 1, e)"
                      >{{ i }}</f7-button
                    >
                  </div>
                </div>

                <div
                  class="flex items-center justify-between p-3 border border-input rounded-lg hover:border-red-500"
                  @click="toggleCheckbox(index, 'credit')"
                >
                  <div class="flex items-center gap-3">
                    <f7-checkbox
                      @click.stop
                      v-model:checked="stepData.creditEnabled"
                    ></f7-checkbox>
                    <span class="text-sm">Зачет</span>
                  </div>
                  <div class="flex gap-1">
                    <f7-button
                      v-for="i in 8"
                      :key="i"
                      small
                      class="semester-button w-7 h-7 min-w-7 border border-red-500"
                      :fill="stepData.creditSemesters[i - 1]"
                      @click="(e) => toggleSemester(index, 'credit', i - 1, e)"
                      >{{ i }}</f7-button
                    >
                  </div>
                </div>

                <div
                  class="flex items-center justify-between p-3 border border-input rounded-lg hover:border-red-500"
                  @click="toggleCheckbox(index, 'controlLesson')"
                >
                  <div class="flex items-center gap-3">
                    <f7-checkbox
                      @click.stop
                      v-model:checked="stepData.controlLessonEnabled"
                    ></f7-checkbox>
                    <span class="text-sm">Контрольный урок</span>
                  </div>
                  <div class="flex gap-1">
                    <f7-button
                      v-for="i in 8"
                      :key="i"
                      small
                      class="semester-button w-7 h-7 min-w-7 border border-red-500"
                      :fill="stepData.controlLessonSemesters[i - 1]"
                      @click="
                        (e) => toggleSemester(index, 'controlLesson', i - 1, e)
                      "
                      >{{ i }}</f7-button
                    >
                  </div>
                </div>
              </div>
            </div>

            <div class="mt-6 grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <label class="text-sm text-foreground" for="total-credits">
                  Всего кредитов
                </label>
                <f7-input
                  :id="'total-credits-' + index"
                  :class="{ 'has-data': stepData.totalCredits }"
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.totalCredits"
                ></f7-input>
              </div>

              <div class="space-y-2">
                <label class="text-sm text-foreground" for="total-hours">
                  Всего часов
                </label>
                <f7-input
                  :id="'total-hours-' + index"
                  :class="{ 'has-data': stepData.totalHours }"
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.totalHours"
                ></f7-input>
              </div>

              <div class="space-y-2">
                <label class="text-sm text-foreground" for="theoretical-hours">
                  Теоретических
                </label>
                <f7-input
                  :id="'theoretical-hours-' + index"
                  :class="{ 'has-data': stepData.theoreticalHours }"
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.theoreticalHours"
                ></f7-input>
              </div>

              <div class="space-y-2">
                <label
                  class="text-sm text-foreground"
                  for="lab-practical-hours"
                >
                  Лобараторно-практических
                </label>
                <f7-input
                  :id="'lab-practical-hours-' + index"
                  :class="{ 'has-data': stepData.labPracticalHours }"
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.labPracticalHours"
                ></f7-input>
              </div>

              <div class="space-y-2">
                <label class="text-sm text-foreground" for="field3-value">
                  3
                </label>
                <f7-input
                  :id="'field3-value-' + index"
                  :class="{ 'has-data': stepData.field3Value }"
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.field3Value"
                ></f7-input>
              </div>

              <div class="space-y-2">
                <label class="text-sm text-foreground" for="srsp-hours">
                  Самостоятельная работа студента с педагогом
                </label>
                <f7-input
                  :id="'srsp-hours-' + index"
                  :class="{ 'has-data': stepData.srspHours }"
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.srspHours"
                ></f7-input>
              </div>

              <div class="space-y-2">
                <label class="text-sm text-foreground" for="srs-hours">
                  Самостоятельная работа студента
                </label>
                <f7-input
                  :id="'srs-hours-' + index"
                  :class="{ 'has-data': stepData.srsHours }"
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.srsHours"
                ></f7-input>
              </div>

              <div class="space-y-2">
                <label
                  class="text-sm text-foreground"
                  for="training-practice-hours"
                >
                  Производственное обучение / профессиональная практика
                </label>
                <f7-input
                  :id="'training-practice-hours-' + index"
                  :class="{ 'has-data': stepData.trainingPracticeHours }"
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.trainingPracticeHours"
                ></f7-input>
              </div>

              <div class="space-y-2">
                <label class="text-sm text-foreground" for="individual-hours">
                  Индивидуальные
                </label>
                <f7-input
                  :id="'individual-hours-' + index"
                  :class="{ 'has-data': stepData.individualHours }"
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.individualHours"
                ></f7-input>
              </div>
            </div>

            <div class="mt-6">
              <div class="text-sm font-medium mb-3">
                Распределение по курсам и семестрам
              </div>
              <div class="border border-input rounded-lg p-3">
                <div class="semester-grid mb-2">
                  <div class="text-sm font-medium">Семестры</div>
                  <div
                    v-for="i in 8"
                    :key="`sem-label-${i}`"
                    class="semester-label text-center text-sm w-7 h-7 min-w-7 flex items-center justify-center rounded-lg"
                    :class="{
                      'semester-active':
                        Number(stepData.distributionSemesterHours[i - 1]) > 0,
                    }"
                  >
                    {{ i }}
                  </div>
                </div>
                <div class="distribution-hours">
                  <div class="text-sm font-medium">Объем часов</div>
                  <div
                    v-for="i in 8"
                    :key="`sem-input-${i}`"
                    class="text-center"
                  >
                    <f7-input
                      type="number"
                      placeholder="-"
                      class="text-center"
                      v-model:value="stepData.distributionSemesterHours[i - 1]"
                    ></f7-input>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import {
  f7Popover,
  f7Input,
  f7Checkbox,
  f7Icon,
  f7Button,
  f7,
} from "framework7-vue";
import { useClass9Store } from "@/stores/class9Store";
import { z } from "zod";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const emit = defineEmits<{
  (e: "submit"): void;
  (e: "close"): void;
}>();

const props = defineProps<{
  specialtyId: string;
  courseId: string;
  academicYearId: string;
  initialData?: any;
  editMode?: boolean;
}>();

const class9Store = useClass9Store();

function createEmptyStep() {
  return class9Store.createEmptyClass9Data(
    props.academicYearId,
    props.specialtyId,
    props.courseId
  );
}

const steps = ref([createEmptyStep()]);
const currentStep = ref(1);

watch(
  () => [props.initialData, props.editMode],
  ([val, edit]) => {
    if (edit && val) {
      steps.value = [{ ...val }];
      currentStep.value = 1;
    } else {
      steps.value = [createEmptyStep()];
      currentStep.value = 1;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  steps.value = props.editMode && props.initialData ? [{ ...props.initialData }] : [createEmptyStep()];
  currentStep.value = 1;
  nextTick(() => {
    f7.tooltip.create({
      targetEl: ".copy-button",
      text: "Копировать из предыдущего шага",
    });
  });
});

const class9Schema = z.object({
  moduleIndex: z.string().min(1, "Индекс модуля обязателен"),
  moduleName: z.string().min(1, "Наименование модуля обязательно"),
  learningOutcome: z.string().optional(),
  totalCredits: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Кредиты должны быть положительным числом",
    })
    .optional(),
  totalHours: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Общие часы должны быть положительным числом",
    })
    .optional(),
  theoreticalHours: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Теоретические часы должны быть положительным числом",
    })
    .optional(),
  labPracticalHours: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Лабораторно-практические часы должны быть положительным числом",
    })
    .optional(),
  srspHours: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Часы СРСП должны быть положительным числом",
    })
    .optional(),
  srsHours: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Часы СРС должны быть положительным числом",
    })
    .optional(),
  trainingPracticeHours: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Часы практики должны быть положительным числом",
    })
    .optional(),
  individualHours: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Индивидуальные часы должны быть положительным числом",
    })
    .optional(),
});

const validationResult = computed(() => {
  const step = steps.value[currentStep.value - 1];
  if (!step) return { success: false, error: { issues: [{ message: "Нет данных" }] } };
  return class9Schema.safeParse({
    moduleIndex: step.moduleIndex,
    moduleName: step.moduleName,
    learningOutcome: step.learningOutcome,
    totalCredits: String(step.totalCredits),
    totalHours: String(step.totalHours),
    theoreticalHours: String(step.theoreticalHours),
    labPracticalHours: String(step.labPracticalHours),
    srspHours: String(step.srspHours),
    srsHours: String(step.srsHours),
    trainingPracticeHours: String(step.trainingPracticeHours),
    individualHours: String(step.individualHours),
  });
});

const formError = computed(() => {
  if (validationResult.value.success) return "";
  const issues = validationResult.value.error.issues;
  if (issues.length > 0) return issues[0].message;
  return "";
});

const isFormValid = computed(() => validationResult.value.success);

function onBack() {
  if (currentStep.value > 1) currentStep.value--;
}

function onNext() {
  if (currentStep.value === steps.value.length) {
    steps.value.push(createEmptyStep());
  }
  currentStep.value++;
}

function removeStep(stepNumber: number) {
  const index = stepNumber - 1;
  if (steps.value.length > 1 && index >= 0 && index < steps.value.length) {
    steps.value.splice(index, 1);
    if (currentStep.value > steps.value.length) {
      currentStep.value = steps.value.length;
    }
  }
}

function copyFromPreviousStep(index: number, field: keyof typeof steps.value[0]) {
  if (index > 0) {
    const previousStep = steps.value[index - 1];
    const currentStepObj = steps.value[index];
    if (previousStep && currentStepObj) {
      (currentStepObj[field] as any) = previousStep[field];
    }
  }
}

function close() {
  steps.value = [createEmptyStep()];
  currentStep.value = 1;
  emit("close");
}

async function submit() {
  if (!isFormValid.value) {
    f7.dialog.alert("Schema validation error");
    return;
  }
  try {
    if (props.editMode && props.initialData && props.initialData.id) {
      await class9Store.updateClass9(props.initialData.id, steps.value[0]);
    } else {
      for (const step of steps.value) {
        await class9Store.addClass9(
          props.academicYearId,
          props.specialtyId,
          props.courseId,
          step
        );
      }
    }
    emit("submit");
  } catch (error) {
    console.error("Failed to save class9 data:", error);
  }
}

function toggleSemester(stepIndex: number, type: "exam" | "credit" | "controlLesson", semesterIndex: number, event?: Event) {
  if (event) event.stopPropagation();
  const stepData = steps.value[stepIndex];
  if (!stepData) return;
  switch (type) {
    case "exam":
      if (!stepData.examEnabled) stepData.examEnabled = true;
      stepData.examSemesters[semesterIndex] = !stepData.examSemesters[semesterIndex];
      break;
    case "credit":
      if (!stepData.creditEnabled) stepData.creditEnabled = true;
      stepData.creditSemesters[semesterIndex] = !stepData.creditSemesters[semesterIndex];
      break;
    case "controlLesson":
      if (!stepData.controlLessonEnabled) stepData.controlLessonEnabled = true;
      stepData.controlLessonSemesters[semesterIndex] = !stepData.controlLessonSemesters[semesterIndex];
      break;
  }
}

function toggleCheckbox(stepIndex: number, type: "exam" | "credit" | "controlLesson") {
  const stepData = steps.value[stepIndex];
  if (!stepData) return;
  switch (type) {
    case "exam":
      stepData.examEnabled = !stepData.examEnabled;
      break;
    case "credit":
      stepData.creditEnabled = !stepData.creditEnabled;
      break;
    case "controlLesson":
      stepData.controlLessonEnabled = !stepData.controlLessonEnabled;
      break;
  }
}

function showDeleteConfirmation() {
  if (!props.initialData || !props.initialData.id) return;
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить запись "${props.initialData.moduleName}"?</p><p class='text-sm text-muted-foreground mt-2'>Это действие нельзя отменить.</p>`,
    "Удаление записи",
    async () => {
      try {
        await class9Store.deleteClass9(props.initialData.id);
        close();
    emit("submit");
  } catch (error) {
        f7.dialog.alert("Произошла ошибка при удалении.");
      }
    }
  );
}
</script>

<style>
#class9-popover {
  left: 50%;
  transform: translateX(-50%);
}

/* Add tooltip styling */
:deep(.tooltip) {
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 12px;
  z-index: 20000;
}

/* Add tooltip arrow */
:deep(.tooltip-arrow) {
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 2px;
  border-color: rgba(0, 0, 0, 0.8);
}

/* Position the tooltip arrow based on position */
:deep(.tooltip-arrow-top) {
  border-width: 0 5px 5px 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-top-color: transparent !important;
  top: -5px;
  left: calc(50% - 5px);
}
</style>

<style scoped>
.course-popover {
  max-height: 100dvh;
  overflow-y: auto;
}

.semester-button.button-fill {
  background-color: var(--f7-theme-color) !important;
  color: var(--f7-button-fill-text-color, #fff) !important;
  border-color: var(--f7-theme-color) !important;
}

.copy-button {
  background-color: rgb(34 197 94) !important;
  color: white !important;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
}

.copy-button:active {
  transform: scale(0.97);
}

.copy-button:hover {
  background-color: rgb(22 163 74) !important;
}

.semester-label {
  border: 1px solid transparent;
  transition: all 0.2s ease;
}

.semester-label.semester-active {
  border-color: var(--f7-theme-color);
  background-color: var(--f7-theme-color);
  color: white;
}

:deep(.distribution-hours input[type="number"]) {
  -moz-appearance: textfield;
}

:deep(.distribution-hours input[type="number"]::-webkit-outer-spin-button),
:deep(.distribution-hours input[type="number"]::-webkit-inner-spin-button) {
  -webkit-appearance: none;
  margin: 0;
}

.distribution-hours {
  display: grid;
  grid-template-columns: 120px repeat(8, 1fr);
  gap: 0.5rem;
}

.semester-grid {
  display: grid;
  grid-template-columns: 120px repeat(8, 1fr);
  gap: 0.5rem;
}

:deep(.input:hover) {
  background-color: rgb(218, 220, 223) !important;
}

:deep(.has-data) {
  background-color: rgb(218, 220, 223) !important;
}
</style>

