<template>
  <f7-popover
    id="class9-popover"
    :arrow="false"
    style="width: calc(100vw - 100px) !important"
    close-on-escape
  >
    <div class="course-popover bg-card text-card-foreground">
      <div class="flex justify-between items-center px-3 py-3 border-b border-input">
        <button
          class="text-muted-foreground hover:text-foreground"
          @click="close"
        >
          Отменить
        </button>
        <div class="flex items-center space-x-4">
          <button @click="removeStep(currentStep)" v-if="steps.length > 1">
            <f7-icon f7="trash" class="text-red-500"></f7-icon>
          </button>
          <div class="text-foreground font-semibold flex items-center space-x-4">
            <f7-button small outline @click.stop="onBack" :disabled="currentStep === 1">
              Назад
            </f7-button>
            <div class="flex items-center space-x-2">
              <div v-for="step in steps.length" :key="step" 
                   class="w-2 h-2 rounded-full transition-colors duration-200"
                   :class="[
                     step === currentStep ? 'bg-primary' : 'bg-gray-300',
                     step < currentStep ? 'bg-gray-300' : ''
                   ]">
              </div>
            </div>
            <div class="flex items-center space-x-2">
              <f7-button small outline @click.stop="onNext">
                {{ currentStep === steps.length ? 'Добавить' : 'Далее' }}
              </f7-button>
            </div>
          </div>
        </div>
        <button
          class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
          @click="submit"
          :disabled="!isFormValid"
        >
          Сохранить
        </button>
      </div>

      <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
        {{ formError }}
      </div>

      <div class="p-4 space-y-4">
        <div v-for="(stepData, index) in steps" :key="index" v-show="currentStep === index + 1">
          <div class="flex justify-between items-center mb-4">
          </div>
          
          <div class="space-y-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="module-index">
                Индекс модуля/дисциплины
              </label>
              <div class="flex gap-2 w-full">
                <f7-input
                  :id="'module-index-' + index"
                  class="w-full"
                  type="text"
                  placeholder="Введите индекс"
                  clear-button
                  v-model:value="stepData.moduleIndex"
                >
                  <template #media>
                    <f7-icon f7="checkmark_alt" class="text-green-500"></f7-icon>
                  </template>
                </f7-input>
                <f7-button
                  v-if="index > 0"
                  small
                  class="copy-button flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 hover:bg-green-600"
                  @click="copyFromPreviousStep(index, 'moduleIndex')"
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
                  type="text"
                  placeholder="Введите наименование"
                  clear-button
                  v-model:value="stepData.moduleName"
                >
                  <template #media>
                    <f7-icon f7="checkmark_alt" class="text-green-500"></f7-icon>
                  </template>
                </f7-input>
                <f7-button
                  v-if="index > 0"
                  small
                  class="copy-button flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 hover:bg-green-600"
                  @click="copyFromPreviousStep(index, 'moduleName')"
                >
                  <f7-icon f7="square_on_square" class="text-lg"></f7-icon>
                </f7-button>
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="learning-outcome">
                Наименование результата обучения <span class="text-muted-foreground">(при наличии)</span>
              </label>
              <div class="flex gap-2 w-full">
                <f7-input
                  :id="'learning-outcome-' + index"
                  class="w-full"
                  type="text"
                  placeholder="Введите результат"
                  clear-button
                  v-model:value="stepData.learningOutcome"
                >
                  <template #media>
                    <f7-icon f7="checkmark_alt" class="text-green-500"></f7-icon>
                  </template>
                </f7-input>
                <f7-button
                  v-if="index > 0"
                  small
                  class="copy-button flex items-center justify-center w-10 h-10 rounded-lg transition-colors duration-200 hover:bg-green-600"
                  @click="copyFromPreviousStep(index, 'learningOutcome')"
                >
                  <f7-icon f7="square_on_square" class="text-lg"></f7-icon>
                </f7-button>
              </div>
            </div>

            <div class="mt-6">
              <div class="text-sm font-medium mb-3">Форма контроля</div>
              
              <div class="space-y-3">
                <div class="flex items-center justify-between p-3 border border-input rounded-lg">
                  <div class="flex items-center gap-3">
                    <f7-checkbox v-model:checked="stepData.examEnabled"></f7-checkbox>
                    <span class="text-sm">Экзамен</span>
                  </div>
                  <div class="flex gap-1">
                    <f7-button
                      v-for="i in 8"
                      :key="i"
                      small
                      class="semester-button w-7 h-7 min-w-7"
                      :fill="stepData.examSemesters[i-1]"
                      :disabled="!stepData.examEnabled"
                      @click="toggleSemester(index, 'exam', i-1)"
                    >{{ i }}</f7-button>
                  </div>
                </div>

                <div class="flex items-center justify-between p-3 border border-input rounded-lg">
                  <div class="flex items-center gap-3">
                    <f7-checkbox v-model:checked="stepData.creditEnabled"></f7-checkbox>
                    <span class="text-sm">Зачет</span>
                  </div>
                  <div class="flex gap-1">
                    <f7-button
                      v-for="i in 8"
                      :key="i"
                      small
                      class="semester-button w-7 h-7 min-w-7"
                      :fill="stepData.creditSemesters[i-1]"
                      :disabled="!stepData.creditEnabled"
                      @click="toggleSemester(index, 'credit', i-1)"
                    >{{ i }}</f7-button>
                  </div>
                </div>

                <div class="flex items-center justify-between p-3 border border-input rounded-lg">
                  <div class="flex items-center gap-3">
                    <f7-checkbox v-model:checked="stepData.controlLessonEnabled"></f7-checkbox>
                    <span class="text-sm">Контрольный урок</span>
                  </div>
                  <div class="flex gap-1">
                    <f7-button
                      v-for="i in 8"
                      :key="i"
                      small
                      class="semester-button w-7 h-7 min-w-7"
                      :fill="stepData.controlLessonSemesters[i-1]"
                      :disabled="!stepData.controlLessonEnabled"
                      @click="toggleSemester(index, 'controlLesson', i-1)"
                    >{{ i }}</f7-button>
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
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.theoreticalHours"
                ></f7-input>
              </div>

              <div class="space-y-2">
                <label class="text-sm text-foreground" for="lab-practical-hours">
                  Лобараторно-практических
                </label>
                <f7-input
                  :id="'lab-practical-hours-' + index"
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
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.srsHours"
                ></f7-input>
              </div>

              <div class="space-y-2">
                <label class="text-sm text-foreground" for="training-practice-hours">
                  Производственное обучение / профессиональная практика
                </label>
                <f7-input
                  :id="'training-practice-hours-' + index"
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
                  type="number"
                  placeholder="0"
                  clear-button
                  v-model:value="stepData.individualHours"
                ></f7-input>
              </div>
            </div>

            <div class="mt-6">
              <div class="text-sm font-medium mb-3">Распределение по курсам и семестрам</div>
              <div class="border border-input rounded-lg p-3">
                <div class="grid grid-cols-9 gap-2 mb-2">
                  <div class="text-sm font-medium">Семестры</div>
                  <div v-for="i in 8" :key="`sem-label-${i}`" 
                       class="text-center text-sm"
                       :class="{'text-orange-500 font-bold': stepData.distributionSemestersActive[i-1]}">
                    {{ i }}
                  </div>
                </div>
                <div class="grid grid-cols-9 gap-2">
                  <div class="text-sm font-medium">Объем часов</div>
                  <div v-for="i in 8" :key="`sem-input-${i}`" class="text-center">
                    <f7-input
                      type="number"
                      placeholder="-"
                      class="text-center"
                      v-model:value="stepData.distributionSemesterHours[i-1]"
                      ></f7-input>
                      <!-- :disabled="!stepData.distributionSemestersActive[i-1]" -->
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
import { ref, computed, onMounted } from 'vue';
import {
  f7Popover,
  f7Input,
  f7Checkbox,
  f7Icon,
  f7Button,
} from 'framework7-vue';
import { useClass9Store, type StepData } from '@/stores/class9Store';
import { z } from 'zod';

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'close'): void
}>();

const props = defineProps<{
  specialtyId: string;
  courseId: string;
}>();

const class9Store = useClass9Store();
const currentStep = ref(1);
const steps = ref<StepData[]>([class9Store.createEmptyStepData()]);
const class9Id = ref<string | null>(null);

onMounted(async () => {
  const existingClass9 = class9Store.getClass9ByCourseId(props.courseId, props.specialtyId);
  if (existingClass9) {
    steps.value = existingClass9.steps;
    class9Id.value = existingClass9.id;
  }
});

const stepSchema = z.object({
  moduleIndex: z.string().min(1, "Индекс модуля обязателен"),
  moduleName: z.string().min(1, "Наименование модуля обязательно"),
  learningOutcome: z.string().optional(),
  totalCredits: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Кредиты должны быть положительным числом"
  }).optional(),
  totalHours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Общие часы должны быть положительным числом"
  }).optional(),
  theoreticalHours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Теоретические часы должны быть положительным числом"
  }).optional(),
  labPracticalHours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Лабораторно-практические часы должны быть положительным числом"
  }).optional(),
  srspHours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Часы СРСП должны быть положительным числом"
  }).optional(),
  srsHours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Часы СРС должны быть положительным числом"
  }).optional(),
  trainingPracticeHours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Часы практики должны быть положительным числом"
  }).optional(),
  individualHours: z.string().refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
    message: "Индивидуальные часы должны быть положительным числом"
  }).optional(),
});

const toggleSemester = (
  stepIndex: number,
  type: 'exam' | 'credit' | 'controlLesson',
  semesterIndex: number
) => {
  const stepData = steps.value[stepIndex];
  if (!stepData) return;
  
  switch (type) {
    case 'exam':
      stepData.examSemesters[semesterIndex] = !stepData.examSemesters[semesterIndex];
      break;
    case 'credit':
      stepData.creditSemesters[semesterIndex] = !stepData.creditSemesters[semesterIndex];
      break;
    case 'controlLesson':
      stepData.controlLessonSemesters[semesterIndex] = !stepData.controlLessonSemesters[semesterIndex];
      break;
  }
};

const onBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const onNext = () => {
  if (currentStep.value === steps.value.length) {
    steps.value.push(class9Store.createEmptyStepData());
  }
  currentStep.value++;
};

const removeStep = (stepNumber: number) => {
  const index = stepNumber - 1;
  if (steps.value.length > 1 && index >= 0 && index < steps.value.length) {
    steps.value.splice(index, 1);
    if (currentStep.value > steps.value.length) {
      currentStep.value = steps.value.length;
    }
  }
};

const close = () => {
  emit('close');
};

const submit = async () => {
  if (!isFormValid.value) {
    return;
  }

  try {
    if (class9Id.value) {
      await class9Store.updateClass9(class9Id.value, steps.value);
    } else {
      await class9Store.addClass9(props.courseId, props.specialtyId, steps.value);
    }
    emit('submit');
  } catch (error) {
    console.error('Failed to save class9 data:', error);
  }
};

const copyFromPreviousStep = (index: number, field: keyof StepData) => {
  if (index > 0) {
    const previousStep = steps.value[index - 1];
    const currentStep = steps.value[index];
    if (previousStep && currentStep) {
      (currentStep[field] as any) = previousStep[field];
    }
  }
};

const validationResult = computed(() => {
  const currentStepData = steps.value[currentStep.value - 1];
  if (!currentStepData) return { success: false, error: { issues: [{ message: "Нет данных" }] } };
  
  return stepSchema.safeParse({
    moduleIndex: currentStepData.moduleIndex,
    moduleName: currentStepData.moduleName,
    learningOutcome: currentStepData.learningOutcome,
    totalCredits: String(currentStepData.totalCredits),
    totalHours: String(currentStepData.totalHours),
    theoreticalHours: String(currentStepData.theoreticalHours),
    labPracticalHours: String(currentStepData.labPracticalHours),
    srspHours: String(currentStepData.srspHours),
    srsHours: String(currentStepData.srsHours),
    trainingPracticeHours: String(currentStepData.trainingPracticeHours),
    individualHours: String(currentStepData.individualHours),
  });
});

const formError = computed(() => {
  if (validationResult.value.success) return "";
  const issues = validationResult.value.error.issues;
  if (issues.length > 0) return issues[0].message;
  return "";
});

const isFormValid = computed(() => validationResult.value.success);
</script>

<style>
#class9-popover {
  left: 50%;
  transform: translateX(-50%);
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
</style> 