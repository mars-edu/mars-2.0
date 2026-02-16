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
            <div v-if="!editMode" class="flex items-center justify-center space-x-4">
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
                              entry.semesterId = '';
                              entry.finalControlId = null;
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
                                value: academicYearSemester.id,
                                text: `Семестр ${academicYearSemester.semesterNumber}`,
                              }))
                          "
                          label="Семестр"
                          placeholder="Выберите семестр"
                          search-placeholder="Поиск семестра..."
                          @update:modelValue="
                            (value) => {
                              console.log('[Class9Popup] Semester changed:', {
                                entryId: entry.id,
                                oldValue: entry.semesterId,
                                newValue: value,
                                academicYearId: entry.academicYearId,
                              });
                              entry.semesterId = value;
                            }
                          "
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
                      <div class="text-sm font-medium mb-2">Форма контроля</div>
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
