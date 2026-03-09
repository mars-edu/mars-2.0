<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="class9-popover"
    positioning="center"
    :arrow="false"
    style="width: calc(100vw - 400px) !important"
    :on-closed="handlePopoverClosed"
  >
    <div class="course-popover bg-card text-card-foreground">
      <div class="fixed-header">
        <PopoverHeader
          title="Создать"
          :on-cancel="requestClose"
        >
          <template #title>
            <div v-if="!editMode" class="flex-1 flex items-center justify-center space-x-4">
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
          <template
            v-for="(stepData, index) in steps"
            :key="index"
          >
          <div
            v-if="currentStep === index + 1"
          >
            <!-- Specialty selection for first step -->
            <div v-if="index === 0" class="mb-6">
              <TagsSelector
                v-model="selectedSpecialtyIds"
                :items="specialtyOptions"
                label="Специальности"
                placeholder="Выберите специальности..."
                display-field="text"
                :show-search="false"
                helper-text="Выберите одну или несколько специальностей для данного модуля"
              />
            </div>

            <!-- Language selector -->
            <div v-if="index === 0" class="mb-6">
              <label class="text-sm text-foreground mb-2 block font-medium flex items-center gap-2">
                <f7-icon f7="globe" size="16px" class="text-muted-foreground"></f7-icon>
                Языки обучения
              </label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="lang in languageOptions"
                  :key="lang.code"
                  type="button"
                  @click="toggleLanguage(lang.code)"
                  class="language-chip"
                  :class="{ 'language-chip-active': selectedLanguages.includes(lang.code) }"
                >
                  <span>{{ lang.name }}</span>
                  <f7-icon
                    v-if="selectedLanguages.includes(lang.code)"
                    f7="checkmark_circle_fill"
                    size="14px"
                    class="ml-1"
                  ></f7-icon>
                </button>
              </div>
            </div>

            <!-- Language sections for each selected language -->
            <div class="space-y-6">
              <div
                v-for="lang in selectedLanguages"
                :key="lang"
                class="bg-muted/50 border border-border rounded-lg p-4"
              >
                <div class="flex items-center gap-2 mb-4">
                  <div class="w-2 h-2 rounded-full bg-primary"></div>
                  <span class="text-sm font-bold uppercase">{{ getLanguageName(lang) }}</span>
                </div>

                <div class="space-y-4">
                  <Input
                    :id="'module-index-' + index + '-' + lang"
                    v-model="languageTexts[lang].moduleIndex"
                    label="Индекс модуля/дисциплины"
                    placeholder="Введите индекс"
                    :show-copy-button="index > 0"
                    @copy="copyFromPreviousStep(index, 'moduleIndex')"
                  />

                  <Input
                    :id="'module-name-' + index + '-' + lang"
                    v-model="languageTexts[lang].moduleName"
                    label="Наименование модуля"
                    placeholder="Введите наименование"
                    :show-copy-button="index > 0"
                    @copy="copyFromPreviousStep(index, 'moduleName')"
                  />

                  <Input
                    :id="'learning-outcome-' + index + '-' + lang"
                    v-model="languageTexts[lang].learningOutcome"
                    label="Наименование результата обучения/дисциплина"
                    placeholder="Введите результат"
                    :show-copy-button="index > 0"
                    @copy="copyFromPreviousStep(index, 'learningOutcome')"
                  />
                </div>
              </div>
            </div>

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
                >
                  <template #button>
                    <button
                      type="button"
                      title="Распределить по семестрам"
                      class="w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active:scale-95"
                      @click="distributeHoursFromField('srspHours')"
                    >
                      <f7-icon f7="arrow_down" class="text-base" />
                    </button>
                  </template>
                </Input>

                <Input
                  :id="'srs-hours-' + index"
                  v-model="stepData.srsHours"
                  label="Самостоятельная работа студента"
                  type="number"
                  placeholder="0"
                >
                  <template #button>
                    <button
                      type="button"
                      title="Распределить по семестрам"
                      class="w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active:scale-95"
                      @click="distributeHoursFromField('srsHours')"
                    >
                      <f7-icon f7="arrow_down" class="text-base" />
                    </button>
                  </template>
                </Input>

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

                <Input
                  :id="'individual-additional-hours-' + index"
                  v-model="stepData.individualAdditionalHours"
                  label="Индивидуальные (дополнительно)"
                  type="number"
                  placeholder="0"
                >
                  <template #button>
                    <button
                      type="button"
                      title="Распределить по семестрам"
                      class="w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active:scale-95"
                      @click="distributeHoursFromField('individualAdditionalHours')"
                    >
                      <f7-icon f7="arrow_down" class="text-base" />
                    </button>
                  </template>
                </Input>
              </div>

              <div class="mt-6">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-semibold text-gray-900">
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

                <div class="distribution-table border border-input rounded-lg">
                  <div class="overflow-x-auto">
                    <div class="distribution-grid distribution-header">
                      <div>Учебный год</div>
                      <div>Семестр</div>
                      <div class="text-center">Групп</div>
                      <div>Форма контроля</div>
                      <div></div>
                    </div>

                    <div
                      v-if="stepData.distributionEntries.length === 0"
                      class="text-center py-4 text-muted-foreground text-sm bg-white"
                    >
                      Нет записей распределения. Нажмите "Добавить" чтобы создать
                      первую запись.
                    </div>

                    <div v-else class="distribution-body">
                      <div
                        v-for="entry in stepData.distributionEntries"
                        :key="entry.id"
                        class="distribution-grid distribution-row"
                      >
                        <Select
                          :modelValue="entry.academicYearId"
                          :options="
                            academicYearStore.academicYears.map((year) => ({
                              value: year.id,
                              text: `${year.startYear}-${year.endYear}`,
                            }))
                          "
                          placeholder="Выберите год"
                          search-placeholder="Поиск учебного года..."
                          @update:modelValue="
                            (value) => {
                              entry.academicYearId = value;
                              entry.semesterId = '';
                              entry.finalControlId = null;
                            }
                          "
                        />

                        <Select
                          :modelValue="entry.semesterId"
                          :options="
                            academicYearSemesterStore
                              .getAcademicYearSemestersByAcademicYear(
                                entry.academicYearId
                              )
                              .map((academicYearSemester) => ({
                                value: academicYearSemester.id,
                                text: `Семестр ${academicYearSemester.semesterNumber}`,
                              }))
                          "
                          placeholder="Выберите семестр"
                          search-placeholder="Поиск семестра..."
                          @update:modelValue="
                            (value) => {
                              entry.semesterId = value;
                            }
                          "
                        />

                        <Input
                          v-model="entry.hours"
                          type="number"
                          placeholder="0"
                          :show-checkmark="false"
                          :clear-button="false"
                          class="distribution-hours-input"
                        />

                        <Select
                          :modelValue="entry.finalControlId ?? ''"
                          @update:modelValue="
                            entry.finalControlId = $event || null
                          "
                          :options="
                            getFinalControlOptionsForYear(
                              entry.academicYearId,
                              entry.semesterId
                            )
                          "
                          placeholder="Выберите форму контроля"
                          search-placeholder="Поиск формы контроля..."
                        />

                        <div class="distribution-actions">
                          <f7-button
                            small
                            @click="removeDistributionEntry(entry.id)"
                            class="remove-entry-btn"
                          >
                            <f7-icon f7="trash" size="14px"></f7-icon>
                          </f7-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
          </template>
        </div>
      </div>

      <PopoverFooter
        :on-save="submit"
        :disabled="!isFormValid"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { f7Popover, f7Checkbox, f7Icon, f7Button, f7 } from "framework7-vue";
import { useClass9Store } from "@/stores/class9Store";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { z } from "zod";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Select from "@/components/ui/Select.vue";
import Input from "@/components/ui/Input.vue";
import TagsSelector from "@/components/ui/TagsSelector.vue";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";

const emit = defineEmits<{
  (e: "submit"): void;
  (e: "close"): void;
}>();

const props = defineProps<{
  specialtyIds?: string[];
  academicYearId: string;
  teacherId?: string;
  baseClass?: number;
  initialData?: any;
  editMode?: boolean;
}>();

const class9Store = useClass9Store();
const academicYearStore = useAcademicYearStore();
const semesterStore = useSemesterStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const scheduledFinalControlStore = useScheduledFinalControlStore();
const finalControlStore = useFinalControlStore();

function createEmptyStep() {
  return class9Store.createEmptyClass9Data(
    props.academicYearId,
    props.specialtyIds || [],
    props.baseClass ?? 9,
    "ru"
  );
}

const steps = ref([createEmptyStep()]);
const currentStep = ref(1);
const selectedSpecialtyIds = ref<string[]>([]);

const selectedLanguages = ref<string[]>(["ru"]);
const activeLanguageTab = ref("ru");

// Language options from store
const languageOptions = computed(() =>
  languageStore.languages.map((lang) => ({
    code: lang.code,
    name: lang.name,
  }))
);

// Per-language text fields: { [langCode]: { moduleIndex, moduleName, learningOutcome } }
const languageTexts = ref<Record<string, { moduleIndex: string; moduleName: string; learningOutcome: string }>>({
  ru: { moduleIndex: "", moduleName: "", learningOutcome: "" },
});

const editVariantIds = ref<Record<string, string>>({});

function toggleLanguage(code: string) {
  const idx = selectedLanguages.value.indexOf(code);
  if (idx > -1) {
    if (selectedLanguages.value.length > 1) {
      selectedLanguages.value.splice(idx, 1);
      delete languageTexts.value[code];
      if (activeLanguageTab.value === code) {
        activeLanguageTab.value = selectedLanguages.value[0];
      }
    }
  } else {
    selectedLanguages.value.push(code);
    if (!languageTexts.value[code]) {
      languageTexts.value[code] = { moduleIndex: "", moduleName: "", learningOutcome: "" };
    }
  }
}

function getLanguageName(code: string) {
  return languageOptions.value.find((l) => l.code === code)?.name ?? code;
}

const currentLanguageTexts = computed({
  get() {
    const lang = activeLanguageTab.value;
    if (!languageTexts.value[lang]) {
      languageTexts.value[lang] = { moduleIndex: "", moduleName: "", learningOutcome: "" };
    }
    return languageTexts.value[lang];
  },
  set(val) {
    languageTexts.value[activeLanguageTab.value] = val;
  },
});

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
      // Check if this item is part of a language group
      if (val.groupId) {
        const variants = class9Store.getGroupedVariants(val.groupId);
        if (variants.length > 0) {
          const langs = variants.map((v: any) => v.language || "ru");
          selectedLanguages.value = [...new Set(langs)];
          activeLanguageTab.value = val.language || langs[0];

          // Build languageTexts from all variants
          const texts: Record<string, { moduleIndex: string; moduleName: string; learningOutcome: string }> = {};
          const variantIdMap: Record<string, string> = {};
          for (const v of variants) {
            const lang = v.language || "ru";
            texts[lang] = {
              moduleIndex: v.moduleIndex,
              moduleName: v.moduleName,
              learningOutcome: v.learningOutcome,
            };
            variantIdMap[lang] = v.id;
          }
          languageTexts.value = texts;
          editVariantIds.value = variantIdMap;

          // Use first variant for shared fields
          const first = variants[0];
          steps.value = [{ ...first }];
          selectedSpecialtyIds.value = first.specialtyIds || [];
        } else {
          // Fallback: group not found, treat as single
          steps.value = [{ ...val }];
          selectedLanguages.value = [val.language || "ru"];
          activeLanguageTab.value = val.language || "ru";
          languageTexts.value = {
            [val.language || "ru"]: {
              moduleIndex: val.moduleIndex,
              moduleName: val.moduleName,
              learningOutcome: val.learningOutcome,
            },
          };
          editVariantIds.value = { [val.language || "ru"]: val.id };
          selectedSpecialtyIds.value = val.specialtyIds || [];
        }
      } else {
        // Legacy item without groupId
        steps.value = [{ ...val }];
        selectedLanguages.value = [val.language || "ru"];
        activeLanguageTab.value = val.language || "ru";
        languageTexts.value = {
          [val.language || "ru"]: {
            moduleIndex: val.moduleIndex,
            moduleName: val.moduleName,
            learningOutcome: val.learningOutcome,
          },
        };
        editVariantIds.value = { [val.language || "ru"]: val.id };
        selectedSpecialtyIds.value = val.specialtyIds || [];
      }
      currentStep.value = 1;
    } else {
      steps.value = [createEmptyStep()];
      selectedLanguages.value = ["ru"];
      activeLanguageTab.value = "ru";
      languageTexts.value = { ru: { moduleIndex: "", moduleName: "", learningOutcome: "" } };
      editVariantIds.value = {};
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
  if (props.editMode && props.initialData) {
    // Watch handles the initialization
  } else {
    steps.value = [createEmptyStep()];
    selectedSpecialtyIds.value = props.specialtyIds || [];
    selectedLanguages.value = ["ru"];
    activeLanguageTab.value = "ru";
    languageTexts.value = { ru: { moduleIndex: "", moduleName: "", learningOutcome: "" } };
  }
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
  semesterId: z.string().min(1, "Семестр обязателен"),
  hours: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Объем часов должен быть положительным числом",
    })
    .optional(),
  finalControlId: z.string().nullable().optional(),
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
  individualAdditionalHours: z
    .string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "Индивидуальные (дополнительно) должны быть положительным числом",
    })
    .optional(),
  distributionEntries: z.array(distributionEntrySchema).min(0),
});

const validationResult = computed(() => {
  const step = steps.value[currentStep.value - 1];
  if (!step)
    return { success: false, error: { issues: [{ message: "Нет данных" }] } };
  const texts = languageTexts.value[activeLanguageTab.value] ?? { moduleIndex: "", moduleName: "", learningOutcome: "" };
  return class9Schema.safeParse({
    moduleIndex: texts.moduleIndex,
    moduleName: texts.moduleName,
    learningOutcome: texts.learningOutcome,
    totalCredits: String(step.totalCredits),
    totalHours: String(step.totalHours),
    theoreticalHours: String(step.theoreticalHours),
    labPracticalHours: String(step.labPracticalHours),
    field3Value: String(step.field3Value),
    srspHours: String(step.srspHours),
    srsHours: String(step.srsHours),
    trainingPracticeHours: String(step.trainingPracticeHours),
    individualHours: String(step.individualHours),
    individualAdditionalHours: String(step.individualAdditionalHours ?? ""),
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

function resetLocalState() {
  steps.value = [createEmptyStep()];
  currentStep.value = 1;
  selectedSpecialtyIds.value = [];
  selectedLanguages.value = ["ru"];
  activeLanguageTab.value = "ru";
  languageTexts.value = { ru: { moduleIndex: "", moduleName: "", learningOutcome: "" } };
  editVariantIds.value = {};
}

function handlePopoverClosed() {
  resetLocalState();
  emit("close");
}

function closeProgrammatically() {
  f7.popover.close("#class9-popover", true, "programmatic");
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
    const baseClass = props.baseClass ? [props.baseClass] : [9];

    if (props.editMode && props.initialData) {
      // Edit mode: update each language variant
      for (const lang of selectedLanguages.value) {
        const texts = languageTexts.value[lang] ?? { moduleIndex: "", moduleName: "", learningOutcome: "" };
        const variantId = editVariantIds.value[lang];
        const step = steps.value[0];

        if (variantId) {
          // Update existing variant
          await class9Store.updateClass9(variantId, {
            ...step,
            specialtyIds: selectedSpecialtyIds.value,
            baseClass,
            language: lang,
            moduleIndex: texts.moduleIndex,
            moduleName: texts.moduleName,
            learningOutcome: texts.learningOutcome,
          });
        } else {
          // New language added during edit - create new variant with same groupId
          const existingGroupId = props.initialData.groupId || crypto.randomUUID();
          await class9Store.addClass9(
            props.academicYearId,
            selectedSpecialtyIds.value,
            {
              ...step,
              baseClass,
              language: lang,
              groupId: existingGroupId,
              moduleIndex: texts.moduleIndex,
              moduleName: texts.moduleName,
              learningOutcome: texts.learningOutcome,
            }
          );
        }
      }

      // Delete removed language variants
      for (const [lang, variantId] of Object.entries(editVariantIds.value)) {
        if (!selectedLanguages.value.includes(lang)) {
          await class9Store.deleteClass9(variantId);
        }
      }
    } else {
      // Create mode
      const groupId = crypto.randomUUID();

      for (const step of steps.value) {
        if (selectedLanguages.value.length === 1) {
          const lang = selectedLanguages.value[0];
          const texts = languageTexts.value[lang] ?? { moduleIndex: "", moduleName: "", learningOutcome: "" };
          await class9Store.addClass9(
            props.academicYearId,
            selectedSpecialtyIds.value,
            {
              ...step,
              baseClass,
              language: lang,
              groupId,
              moduleIndex: texts.moduleIndex,
              moduleName: texts.moduleName,
              learningOutcome: texts.learningOutcome,
            }
          );
        } else {
          // Multiple languages - create all variants
          for (const lang of selectedLanguages.value) {
            const texts = languageTexts.value[lang] ?? { moduleIndex: "", moduleName: "", learningOutcome: "" };
            await class9Store.addClass9(
              props.academicYearId,
              selectedSpecialtyIds.value,
              {
                ...step,
                baseClass,
                language: lang,
                groupId,
                moduleIndex: texts.moduleIndex,
                moduleName: texts.moduleName,
                learningOutcome: texts.learningOutcome,
              }
            );
          }
        }
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
    academicYearId: props.academicYearId,
    semesterId: "",
    hours: "",
    finalControlId: null,
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

function distributeHoursFromField(
  field: "srspHours" | "srsHours" | "individualAdditionalHours"
) {
  const step = steps.value[currentStep.value - 1];
  if (!step) return;

  if (!step.distributionEntries.length) {
    f7.dialog.alert("Сначала добавьте записи в распределение по семестрам");
    return;
  }

  const sourceValue = Number(step[field] ?? 0);
  if (!Number.isFinite(sourceValue) || sourceValue < 0) {
    f7.dialog.alert("Введите корректное количество часов");
    return;
  }

  const total = Math.round(sourceValue * 100);
  const count = step.distributionEntries.length;
  const base = Math.floor(total / count);
  const remainder = total % count;

  step.distributionEntries.forEach((entry, idx) => {
    const value = (base + (idx < remainder ? 1 : 0)) / 100;
    entry.hours = Number.isInteger(value) ? String(value) : value.toFixed(2);
  });
}

function getFinalControlOptionsForYear(
  academicYearId: string,
  semesterId?: string
) {
  if (!academicYearId) {
    return [{ value: "", text: "Не выбрано" }];
  }

  const allScheduledControls =
    scheduledFinalControlStore.getScheduledFinalControlsByAcademicYear(
      academicYearId
    );

  // Filter by semesterId if provided
  const scheduledControls = semesterId
    ? allScheduledControls.filter((control) => {
        // Get the final control details to check if it matches the semester
        const finalControl = finalControlStore.getFinalControlById(
          control.finalControlId
        );
        if (!finalControl) return true; // Include if we can't determine
        // Since we're looking at scheduled controls, they should already be semester-specific
        // This is a pass-through filter for now - the backend should handle this
        return true;
      })
    : allScheduledControls;

  return [
    { value: "", text: "Не выбрано" },
    ...scheduledControls.map((control) => ({
      value: control.id,
      text: control.shortName,
    })),
  ];
}

function showDeleteConfirmation() {
  if (!props.initialData || !props.initialData.id) return;

  const hasGroup = props.initialData.groupId &&
    class9Store.getGroupedVariants(props.initialData.groupId).length > 1;

  if (hasGroup) {
    f7.dialog.create({
      title: "Удаление записи",
      text: `<p>Удалить все языковые варианты записи "${props.initialData.moduleName}" или только текущий?</p>`,
      buttons: [
        { text: "Отмена", close: true },
        {
          text: "Только этот язык",
          close: true,
          onClick: async () => {
            try {
              await class9Store.deleteClass9(props.initialData.id);
              closeProgrammatically();
              emit("submit");
            } catch (error) {
              f7.dialog.alert("Произошла ошибка при удалении.");
            }
          },
        },
        {
          text: "Все варианты",
          close: true,
          cssClass: "text-destructive",
          onClick: async () => {
            try {
              await class9Store.deleteClass9Group(props.initialData.groupId);
              closeProgrammatically();
              emit("submit");
            } catch (error) {
              f7.dialog.alert("Произошла ошибка при удалении.");
            }
          },
        },
      ],
    }).open();
  } else {
    f7.dialog.confirm(
      `<p>Вы уверены, что хотите удалить запись "${props.initialData.moduleName}"?</p><p class='text-sm text-muted-foreground mt-2'>Это действие нельзя отменить.</p>`,
      "Удаление записи",
      async () => {
        try {
          await class9Store.deleteClass9(props.initialData.id);
          closeProgrammatically();
          emit("submit");
        } catch (error) {
          f7.dialog.alert("Произошла ошибка при удалении.");
        }
      }
    );
  }
}
</script>

<style>
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
  background-color: #22c55e !important;
  color: #ffffff !important;
  border: 1px solid #22c55e !important;
  border-radius: 0.5rem !important;
  min-height: 2rem !important;
  padding: 0 0.8rem !important;
  font-weight: 600 !important;
  box-shadow: none !important;
}

.add-distribution-btn:hover {
  background-color: #16a34a !important;
  border-color: #16a34a !important;
}

.add-distribution-btn:active {
  transform: scale(0.98);
}

.remove-entry-btn {
  min-width: 26px !important;
  width: 26px !important;
  height: 26px !important;
  padding: 0 !important;
  color: #9ca3af !important;
  border-radius: 0.375rem !important;
}

.remove-entry-btn:hover {
  background: #f3f4f6 !important;
  color: #6b7280 !important;
}

.distribution-table {
  margin-top: 0.25rem;
  border: 1px solid #d9dee5 !important;
  border-radius: 0.6rem !important;
  background: #fff;
  overflow: hidden;
}

.distribution-grid {
  display: grid;
  grid-template-columns: minmax(160px, 1fr) minmax(160px, 1fr) 100px minmax(220px, 1.4fr) 32px;
  gap: 0.5rem;
  min-width: 760px;
}

.distribution-header {
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border-bottom: 1px solid #d9dee5;
  font-size: 0.8rem;
  line-height: 1rem;
  font-weight: 600;
  color: #5f6b7a;
  align-items: center;
}

.distribution-body {
  background: #fff;
}

.distribution-row {
  padding: 0.35rem 0.75rem;
  align-items: center;
  border-bottom: 1px solid #eceff3;
}

.distribution-row:last-child {
  border-bottom: none;
}

.distribution-actions {
  display: flex;
  justify-content: center;
  align-items: center;
}

:deep(.distribution-hours-input input[inputmode="numeric"]) {
  text-align: center;
  padding-right: 0.7rem !important;
}

:deep(.distribution-row .select-item .item-content) {
  min-height: 34px !important;
  background: #ffffff !important;
  border: 1px solid #d7dde5 !important;
  border-radius: 0.5rem !important;
}

:deep(.distribution-row .select-item .item-link::after),
:deep(.distribution-row .select-item .item-link::before),
:deep(.distribution-row .select-item .item-inner::before) {
  display: none !important;
}

:deep(.distribution-row .select-item .item-inner) {
  min-height: 34px !important;
  padding: 0.4rem 0.65rem !important;
  padding-right: 2.05rem !important;
}

:deep(.distribution-row .select-item .item-after) {
  font-size: 0.95rem !important;
  color: #1f2937 !important;
}

:deep(.distribution-row .select-item .item-inner::after) {
  content: "" !important;
  right: 0.65rem !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 0.95rem !important;
  height: 0.95rem !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: contain !important;
}

:deep(.distribution-row .distribution-hours-input .input) {
  background: #f3f4f6 !important;
  min-height: 34px !important;
  border-radius: 0.5rem !important;
}

:deep(.distribution-row li::after),
:deep(.distribution-row li::before),
:deep(.distribution-row .item-content::after),
:deep(.distribution-row .item-content::before) {
  display: none !important;
}

/* Language selector chips */
.language-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.875rem;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 9999px;
  border: 1.5px solid var(--f7-border-color);
  background-color: var(--f7-card-bg-color);
  color: var(--f7-text-color);
  transition: all 0.2s ease;
  cursor: pointer;
}

.language-chip:hover {
  border-color: var(--f7-theme-color);
  background-color: var(--f7-theme-color-tint);
}

.language-chip-active {
  border-color: var(--f7-theme-color);
  background-color: var(--f7-theme-color);
  color: white;
  box-shadow: 0 2px 8px rgba(var(--f7-theme-color-rgb), 0.3);
}

.language-chip-active:hover {
  background-color: var(--f7-theme-color-shade);
}
</style>
