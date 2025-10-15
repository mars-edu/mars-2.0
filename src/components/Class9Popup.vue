<template>
  <f7-popover
    id="class9-popover"
    :arrow="false"
    style="width: calc(100vw - 400px) !important"
    close-on-escape
  >
    <div class="course-popover bg-card text-card-foreground">
      <div class="fixed-header">
        <PopoverHeader
          title="Создать"
          :disabled="!isFormValid"
          :on-cancel="close"
          :on-save="submit"
        >
          <template #title>
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
                <f7-icon
                  ios="f7:trash"
                  md="material:delete"
                  size="18px"
                  class="mr-2"
                />
                Удалить
              </button>
            </div>
          </template>
        </PopoverHeader>

        <div v-if="formError" class="px-4 pb-2 text-destructive text-sm">
          {{ formError }}
        </div>
      </div>

      <div class="scrollable-content">
        <div class="p-4">
          <div
            v-for="(stepData, index) in steps"
            :key="index"
            v-show="currentStep === index + 1"
          >
            <!-- Specialty selection for first step -->
            <div v-if="index === 0" class="mb-6">
              <TagsSelector
                v-model="selectedSpecialtyIds"
                :items="specialtyOptions"
                label="Специальности"
                placeholder="Выберите специальности..."
                :max-tags="5"
                display-field="text"
                :show-search="false"
                helper-text="Выберите одну или несколько специальностей для данного модуля"
              />
            </div>

            <div class="space-y-4">
              <Input
                :id="'module-index-' + index"
                v-model="stepData.moduleIndex"
                label="Индекс модуля/дисциплины"
                placeholder="Введите индекс"
                :show-copy-button="index > 0"
                @copy="copyFromPreviousStep(index, 'moduleIndex')"
              />

              <Input
                :id="'module-name-' + index"
                v-model="stepData.moduleName"
                label="Наименование модуля"
                placeholder="Введите наименование"
                :show-copy-button="index > 0"
                @copy="copyFromPreviousStep(index, 'moduleName')"
              />

              <Input
                :id="'learning-outcome-' + index"
                v-model="stepData.learningOutcome"
                label="Наименование результата обучения/дисциплина"
                placeholder="Введите результат"
                :show-copy-button="index > 0"
                @copy="copyFromPreviousStep(index, 'learningOutcome')"
              />

              <div class="mt-6 grid grid-cols-2 gap-4">
                <Input
                  :id="'total-credits-' + index"
                  v-model="stepData.totalCredits"
                  label="Всего кредитов"
                  type="number"
                  placeholder="0"
                />

                <Input
                  :id="'total-hours-' + index"
                  v-model="stepData.totalHours"
                  label="Всего часов"
                  type="number"
                  placeholder="0"
                />

                <Input
                  :id="'theoretical-hours-' + index"
                  v-model="stepData.theoreticalHours"
                  label="Теоретических"
                  type="number"
                  placeholder="0"
                />

                <Input
                  :id="'lab-practical-hours-' + index"
                  v-model="stepData.labPracticalHours"
                  label="Лабараторно-практических"
                  type="number"
                  placeholder="0"
                />

                <Input
                  :id="'field3-value-' + index"
                  v-model="stepData.field3Value"
                  label="3"
                  type="number"
                  placeholder="0"
                />

                <Input
                  :id="'srsp-hours-' + index"
                  v-model="stepData.srspHours"
                  label="Самостоятельная работа студента с педагогом"
                  type="number"
                  placeholder="0"
                />

                <Input
                  :id="'srs-hours-' + index"
                  v-model="stepData.srsHours"
                  label="Самостоятельная работа студента"
                  type="number"
                  placeholder="0"
                />

                <Input
                  :id="'training-practice-hours-' + index"
                  v-model="stepData.trainingPracticeHours"
                  label="Производственное обучение / профессиональная практика"
                  type="number"
                  placeholder="0"
                />

                <Input
                  :id="'individual-hours-' + index"
                  v-model="stepData.individualHours"
                  label="Индивидуальные"
                  type="number"
                  placeholder="0"
                />
              </div>

              <div class="mt-6">
                <div class="flex items-center justify-between mb-3">
                  <div class="text-sm font-medium">
                    Распределение по курсам и семестрам
                  </div>
                  <f7-button
                    small
                    fill
                    @click="addDistributionEntry"
                    class="add-distribution-btn"
                  >
                    <f7-icon f7="plus" size="14px" class="mr-1"></f7-icon>
                    Добавить
                  </f7-button>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(entry, entryIndex) in stepData.distributionEntries"
                    :key="entry.id"
                    class="border border-input rounded-lg p-3"
                  >
                    <div class="flex items-center justify-end mb-3">
                      <f7-button
                        small
                        @click="removeDistributionEntry(entry.id)"
                        class="remove-entry-btn"
                      >
                        <f7-icon f7="trash" size="14px" color="red"></f7-icon>
                      </f7-button>
                    </div>

                    <div class="grid grid-cols-3 gap-3">
                      <div class="space-y-2">
                        <Select
                          :modelValue="entry.academicYearId"
                          :options="
                            academicYearStore.academicYears.map((year) => ({
                              value: year.id,
                              text: `${year.startYear}-${year.endYear}`,
                            }))
                          "
                          label="Учебный год"
                          placeholder="Выберите год"
                          search-placeholder="Поиск учебного года..."
                          @update:modelValue="
                            (value) => {
                              entry.academicYearId = value;
                              entry.semesterId = ''; // Clear semester when year changes
                            }
                          "
                        />
                      </div>

                      <div class="space-y-2">
                        <Select
                          :modelValue="entry.semesterId"
                          :options="
                            academicYearSemesterStore
                              .getAcademicYearSemestersByAcademicYear(
                                entry.academicYearId
                              )
                              .map((academicYearSemester) => ({
                                value:
                                  academicYearSemester.semesterNumber.toString(),
                                text: `Семестр ${academicYearSemester.semesterNumber}`,
                              }))
                          "
                          label="Семестр"
                          placeholder="Выберите семестр"
                          search-placeholder="Поиск семестра..."
                          @update:modelValue="entry.semesterId = $event"
                        />
                      </div>

                      <Input
                        v-model="entry.hours"
                        label="Объем часов"
                        type="number"
                        placeholder="0"
                        :show-checkmark="false"
                        class="text-center"
                      />
                    </div>

                    <div class="mt-4">
                      <div class="text-sm font-medium mb-3">Форма контроля</div>

                      <Select
                        :modelValue="getSelectedControlType(entry)"
                        :options="[
                          { value: 'none', text: 'Не выбрано' },
                          { value: 'exam', text: 'Экзамен' },
                          { value: 'credit', text: 'Зачет' },
                          { value: 'controlLesson', text: 'Контрольный урок' },
                        ]"
                        placeholder="Выберите форму контроля"
                        search-placeholder="Поиск формы контроля..."
                        @update:modelValue="
                          setSelectedControlType(entry, $event)
                        "
                      />
                    </div>
                  </div>

                  <div
                    v-if="stepData.distributionEntries.length === 0"
                    class="text-center py-4 text-muted-foreground text-sm"
                  >
                    Нет записей распределения. Нажмите "Добавить" чтобы создать
                    первую запись.
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
import { f7Popover, f7Checkbox, f7Icon, f7Button, f7 } from "framework7-vue";
import { useClass9Store } from "@/stores/class9Store";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { z } from "zod";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import Select from "@/components/ui/Select.vue";
import Input from "@/components/ui/Input.vue";
import TagsSelector from "@/components/ui/TagsSelector.vue";
import { useSpecialtyStore } from "@/stores/specialtyStore";

const emit = defineEmits<{
  (e: "submit"): void;
  (e: "close"): void;
}>();

const props = defineProps<{
  specialtyIds?: string[];
  academicYearId: string;
  teacherId?: string;
  initialData?: any;
  editMode?: boolean;
}>();

const class9Store = useClass9Store();
const academicYearStore = useAcademicYearStore();
const semesterStore = useSemesterStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const specialtyStore = useSpecialtyStore();

function createEmptyStep() {
  return class9Store.createEmptyClass9Data(
    props.academicYearId,
    props.specialtyIds || []
  );
}

const steps = ref([createEmptyStep()]);
const currentStep = ref(1);
const selectedSpecialtyIds = ref<string[]>([]);

// Specialty options for TagsSelector
const specialtyOptions = computed(() =>
  specialtyStore.specialties.map((specialty) => ({
    id: specialty.id,
    text: specialty.codeName || specialty.name,
    codeName: specialty.codeName,
    name: specialty.name,
  }))
);

watch(
  () => [props.initialData, props.editMode],
  ([val, edit]) => {
    if (edit && val) {
      steps.value = [{ ...val }];
      selectedSpecialtyIds.value = val.specialtyIds || [];
      currentStep.value = 1;
    } else {
      steps.value = [createEmptyStep()];
      selectedSpecialtyIds.value = props.specialtyIds || [];
      currentStep.value = 1;
    }
  },
  { immediate: true }
);

// Watch for changes in selectedSpecialtyIds and sync with form data
watch(
  selectedSpecialtyIds,
  (newIds) => {
    // Update the current step's specialty IDs
    if (steps.value[0]) {
      steps.value[0].specialtyIds = newIds;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await specialtyStore.fetchSpecialties();
  steps.value =
    props.editMode && props.initialData
      ? [{ ...props.initialData }]
      : [createEmptyStep()];
  selectedSpecialtyIds.value =
    props.editMode && props.initialData
      ? props.initialData.specialtyIds || []
      : props.specialtyIds || [];
  currentStep.value = 1;
  nextTick(() => {
    f7.tooltip.create({
      targetEl: ".copy-button",
      text: "Копировать из предыдущего шага",
    });
  });
});

const distributionEntrySchema = z.object({
  academicYearId: z.string().min(1, "Учебный год обязателен"),
  semesterId: z
    .string()
    .min(1, "Семестр обязателен")
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
      message: "Семестр должен быть положительным числом",
    }),
  hours: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Объем часов должен быть положительным числом",
    })
    .optional(),
  examEnabled: z.boolean().optional(),
  creditEnabled: z.boolean().optional(),
  controlLessonEnabled: z.boolean().optional(),
});

const class9Schema = z.object({
  moduleIndex: z.string().min(1, "Индекс модуля обязателен"),
  moduleName: z.string().min(1, "Наименование модуля обязательно"),
  learningOutcome: z
    .string()
    .min(1, "Наименование результата обучения/дисциплина обязательно"),
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
  field3Value: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Поле 3 должно быть положительным числом",
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
  distributionEntries: z.array(distributionEntrySchema).min(0),
});

const validationResult = computed(() => {
  const step = steps.value[currentStep.value - 1];
  if (!step)
    return { success: false, error: { issues: [{ message: "Нет данных" }] } };
  return class9Schema.safeParse({
    moduleIndex: step.moduleIndex,
    moduleName: step.moduleName,
    learningOutcome: step.learningOutcome,
    totalCredits: String(step.totalCredits),
    totalHours: String(step.totalHours),
    theoreticalHours: String(step.theoreticalHours),
    labPracticalHours: String(step.labPracticalHours),
    field3Value: String(step.field3Value),
    srspHours: String(step.srspHours),
    srsHours: String(step.srsHours),
    trainingPracticeHours: String(step.trainingPracticeHours),
    individualHours: String(step.individualHours),
    distributionEntries: step.distributionEntries,
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

function copyFromPreviousStep(
  index: number,
  field: keyof (typeof steps.value)[0]
) {
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
  selectedSpecialtyIds.value = [];
  emit("close");
}

async function submit() {
  if (!isFormValid.value) {
    f7.dialog.alert("Schema validation error");
    return;
  }

  if (selectedSpecialtyIds.value.length === 0) {
    f7.dialog.alert("Выберите хотя бы одну специальность");
    return;
  }

  try {
    if (props.editMode && props.initialData && props.initialData.id) {
      await class9Store.updateClass9(props.initialData.id, {
        ...steps.value[0],
        specialtyIds: selectedSpecialtyIds.value,
        teacherId: props.teacherId,
      });
    } else {
      for (const step of steps.value) {
        await class9Store.addClass9(
          props.academicYearId,
          selectedSpecialtyIds.value,
          {
            ...step,
            teacherId: props.teacherId,
          }
        );
      }
    }
    emit("submit");
  } catch (error) {
    console.error("Failed to save class9 data:", error);
  }
}

function addDistributionEntry() {
  const step = steps.value[currentStep.value - 1];
  if (!step) return;

  const newEntry = {
    id: crypto.randomUUID(),
    academicYearId: props.academicYearId, // Default to current academic year
    semesterId: "",
    hours: "",
    examEnabled: false,
    creditEnabled: false,
    controlLessonEnabled: false,
  };

  step.distributionEntries.push(newEntry);
}

function removeDistributionEntry(entryId: string) {
  const step = steps.value[currentStep.value - 1];
  if (!step) return;

  const entryIndex = step.distributionEntries.findIndex(
    (entry) => entry.id === entryId
  );
  if (entryIndex !== -1) {
    step.distributionEntries.splice(entryIndex, 1);
  }
}

function getSelectedControlType(entry: any): string {
  if (entry.examEnabled) return "exam";
  if (entry.creditEnabled) return "credit";
  if (entry.controlLessonEnabled) return "controlLesson";
  return "none";
}

function setSelectedControlType(entry: any, value: string) {
  // Clear all control types first
  entry.examEnabled = false;
  entry.creditEnabled = false;
  entry.controlLessonEnabled = false;

  // Set the selected control type
  switch (value) {
    case "exam":
      entry.examEnabled = true;
      break;
    case "credit":
      entry.creditEnabled = true;
      break;
    case "controlLesson":
      entry.controlLessonEnabled = true;
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

:deep(.tooltip) {
  background: rgba(0, 0, 0, 0.8);
  color: #fff;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 12px;
  z-index: 20000;
}

:deep(.tooltip-arrow) {
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 2px;
  border-color: rgba(0, 0, 0, 0.8);
}

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

.semester-button.button-fill {
  background-color: var(--f7-theme-color) !important;
  color: var(--f7-button-fill-text-color, #fff) !important;
  border-color: var(--f7-theme-color) !important;
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

.add-distribution-btn {
  background-color: var(--f7-theme-color) !important;
  color: white !important;
}

.remove-entry-btn {
  min-width: 24px !important;
  width: 24px !important;
  height: 24px !important;
  padding: 0 !important;
}

:deep(.distribution-hours input[type="number"]) {
  -moz-appearance: textfield;
  -webkit-appearance: textfield;
  appearance: textfield;
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
</style>
