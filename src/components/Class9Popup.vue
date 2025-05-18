<template>
  <f7-popover
    id="class9-popover"
    :arrow="false"
    style="width: calc(100vw - 100px) !important"
    close-on-escape
  >
    <div class="course-popover bg-card text-card-foreground">
      <div class="flex justify-between items-center px-4 py-3 border-b border-input">
        <button
          class="text-muted-foreground hover:text-foreground"
          @click="close"
        >
          Отменить
        </button>
        <div class="text-foreground font-semibold flex items-center space-x-2">
          <f7-button small outline @click.stop="onBack">Назад</f7-button>
          <div class="flex items-center space-x-2">
            <div v-for="step in totalSteps" :key="step" 
                 class="w-2 h-2 rounded-full transition-colors duration-200"
                 :class="[
                   step === currentStep ? 'bg-primary' : 'bg-gray-300',
                   step < currentStep ? 'bg-primary/60' : ''
                 ]">
            </div>
          </div>
          <f7-button small outline @click.stop="onNext">Далее</f7-button>
        </div>
        <button
          class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
          @click="submit"
        >
          Сохранить
        </button>
      </div>

      <div class="p-4 space-y-4">
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-index">
              Индекс модуля/дисциплины
            </label>
            <f7-input
              id="module-index"
              type="text"
              placeholder="Введите индекс"
              clear-button
              v-model:value="formData.moduleIndex"
            >
              <template #media>
                <f7-icon f7="checkmark_alt" class="text-green-500"></f7-icon>
              </template>
            </f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-name">
              Наименование модуля/дисциплины
            </label>
            <f7-input
              id="module-name"
              type="text"
              placeholder="Введите наименование"
              clear-button
              v-model:value="formData.moduleName"
            >
              <template #media>
                <f7-icon f7="checkmark_alt" class="text-green-500"></f7-icon>
              </template>
            </f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="learning-outcome">
              Наименование результата обучения <span class="text-muted-foreground">(при наличии)</span>
            </label>
            <f7-input
              id="learning-outcome"
              type="text"
              placeholder="Введите результат"
              clear-button
              v-model:value="formData.learningOutcome"
            >
              <template #media>
                <f7-icon f7="checkmark_alt" class="text-green-500"></f7-icon>
              </template>
            </f7-input>
          </div>

          <div class="mt-6">
            <div class="text-sm font-medium mb-3">Форма контроля</div>
            
            <div class="space-y-3">
              <div class="flex items-center justify-between p-3 border border-input rounded-lg">
                <div class="flex items-center gap-3">
                  <f7-checkbox v-model:checked="formData.examEnabled"></f7-checkbox>
                  <span class="text-sm">Экзамен</span>
                </div>
                <div class="flex gap-1">
                  <f7-button
                    v-for="i in 8"
                    :key="i"
                    small
                    class="semester-button w-7 h-7 min-w-7"
                    :fill="formData.examSemesters[i-1]"
                    :disabled="!formData.examEnabled"
                    @click="toggleSemester('exam', i-1)"
                  >{{ i }}</f7-button>
                </div>
              </div>

              <div class="flex items-center justify-between p-3 border border-input rounded-lg">
                <div class="flex items-center gap-3">
                  <f7-checkbox v-model:checked="formData.creditEnabled"></f7-checkbox>
                  <span class="text-sm">Зачет</span>
                </div>
                <div class="flex gap-1">
                  <f7-button
                    v-for="i in 8"
                    :key="i"
                    small
                    class="semester-button w-7 h-7 min-w-7"
                    :fill="formData.creditSemesters[i-1]"
                    :disabled="!formData.creditEnabled"
                    @click="toggleSemester('credit', i-1)"
                  >{{ i }}</f7-button>
                </div>
              </div>

              <div class="flex items-center justify-between p-3 border border-input rounded-lg">
                <div class="flex items-center gap-3">
                  <f7-checkbox v-model:checked="formData.controlLessonEnabled"></f7-checkbox>
                  <span class="text-sm">Контрольный урок</span>
                </div>
                <div class="flex gap-1">
                  <f7-button
                    v-for="i in 8"
                    :key="i"
                    small
                    class="semester-button w-7 h-7 min-w-7"
                    :fill="formData.controlLessonSemesters[i-1]"
                    :disabled="!formData.controlLessonEnabled"
                    @click="toggleSemester('controlLesson', i-1)"
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
                id="total-credits"
                type="number"
                placeholder="0"
                clear-button
                v-model:value="formData.totalCredits"
              ></f7-input>
            </div>
            
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="total-hours">
                Всего часов
              </label>
              <f7-input
                id="total-hours"
                type="number"
                placeholder="0"
                clear-button
                v-model:value="formData.totalHours"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="theoretical-hours">
                Теоретических
              </label>
              <f7-input
                id="theoretical-hours"
                type="number"
                placeholder="0"
                clear-button
                v-model:value="formData.theoreticalHours"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="lab-practical-hours">
                Лобараторно-практических
              </label>
              <f7-input
                id="lab-practical-hours"
                type="number"
                placeholder="0"
                clear-button
                v-model:value="formData.labPracticalHours"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="field3-value">
                3
              </label>
              <f7-input
                id="field3-value"
                type="number"
                placeholder="0"
                clear-button
                v-model:value="formData.field3Value"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="srsp-hours">
                Самостоятельная работа студента с педагогом
              </label>
              <f7-input
                id="srsp-hours"
                type="number"
                placeholder="0"
                clear-button
                v-model:value="formData.srspHours"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="srs-hours">
                Самостоятельная работа студента
              </label>
              <f7-input
                id="srs-hours"
                type="number"
                placeholder="0"
                clear-button
                v-model:value="formData.srsHours"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="training-practice-hours">
                Производственное обучение / профессиональная практика
              </label>
              <f7-input
                id="training-practice-hours"
                type="number"
                placeholder="0"
                clear-button
                v-model:value="formData.trainingPracticeHours"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="individual-hours">
                Индивидуальные
              </label>
              <f7-input
                id="individual-hours"
                type="number"
                placeholder="0"
                clear-button
                v-model:value="formData.individualHours"
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
                     :class="{'text-orange-500 font-bold': formData.distributionSemestersActive[i-1]}">
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
                    :disabled="!formData.distributionSemestersActive[i-1]"
                    v-model:value="formData.distributionSemesterHours[i-1]"
                  ></f7-input>
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
import { ref } from 'vue';
import {
  f7Popover,
  f7Input,
  f7Checkbox,
  f7Icon,
  f7Button,
} from 'framework7-vue';

const emit = defineEmits<{
  (e: 'submit'): void
  (e: 'close'): void
}>();

defineProps<{
  target: string
}>();

const currentStep = ref(1);
const totalSteps = 3;

const formData = ref({
  moduleIndex: '',
  moduleName: '',
  learningOutcome: '',

  examEnabled: true,
  examSemesters: [false, false, false, true, false, false, false, false], // Semester 4 is active for exam

  creditEnabled: false,
  creditSemesters: Array(8).fill(false),

  controlLessonEnabled: false,
  controlLessonSemesters: Array(8).fill(false),

  totalCredits: '',
  totalHours: '',
  theoreticalHours: '',
  labPracticalHours: '',
  field3Value: '', 
  srspHours: '',
  srsHours: '',
  trainingPracticeHours: '',
  individualHours: '',
  
  distributionSemestersActive: [false, true, true, true, false, false, false, false], // Semesters 2,3,4 active as example
  distributionSemesterHours: ['', '40', '36', '40', '', '', '', ''],
});

const toggleSemester = (
  type: 'exam' | 'credit' | 'controlLesson',
  index: number
) => {
  switch (type) {
    case 'exam':
      formData.value.examSemesters[index] = !formData.value.examSemesters[index];
      break;
    case 'credit':
      formData.value.creditSemesters[index] = !formData.value.creditSemesters[index];
      break;
    case 'controlLesson':
      formData.value.controlLessonSemesters[index] = !formData.value.controlLessonSemesters[index];
      break;
  }
};

const onBack = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const onNext = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const close = () => {
  emit('close');
};

const submit = () => {
  console.log('Form data:', formData.value);
  emit('submit');
};
</script>

<style>
#class9-popover {
  /* position: absolute; */
  left: 50%;
  transform: translateX(-50%);
}
</style>

<style scoped>
.course-popover {
  max-height: 90vh;
  overflow-y: auto;
}

.semester-button.button-fill {
  background-color: var(--f7-theme-color) !important;
  color: var(--f7-button-fill-text-color, #fff) !important;
  border-color: var(--f7-theme-color) !important;
}
</style> 