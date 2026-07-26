<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="rup-entry-popover"
    :arrow="false"
    style="width: calc(100vw - 400px) !important"
    :on-closed="handlePopoverClosed"
    :is-dirty="isFormDirty"
    :close-by-backdrop-click="false"
  >
    <div class="rup-entry-popover bg-card text-card-foreground">
      <div class="fixed-header">
        <PopoverHeader
          :title="editMode ? 'Редактировать модуль' : 'Создать модуль'"
          :subtitle="baseLabel"
          :on-cancel="requestClose"
        />

        <div v-if="formError" class="px-8 pb-2 text-destructive text-sm">
          {{ formError }}
        </div>
      </div>

      <div class="scrollable-content">
        <div class="space-y-4 pb-60 px-6 py-4">
          <div>
            <RupIntegrationPanel
              ref="integrationPanel"
              :academic-year-id="academicYearId"
              :base-class="baseClass"
              @apply-source="applySource"
            />

            <!-- Specialty selection -->
            <div class="mb-6">
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

            <!-- Language chips (concept-style: colored pills) -->
            <div class="mb-4">
              <label class="text-sm text-foreground mb-2 block font-medium flex items-center gap-2">
                <IconGlobe class="w-4 h-4 text-muted-foreground" />
                Языки обучения
              </label>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="lang in languageOptions"
                  :key="lang.code"
                  type="button"
                  @click="toggleLanguage(lang.code)"
                  class="lang-pill"
                  :class="
                    selectedLanguages.includes(lang.code)
                      ? `lang-pill-active lang-pill-${lang.code}`
                      : 'lang-pill-inactive'
                  "
                >
                  {{ lang.name }}
                </button>
              </div>
            </div>

            <!-- Language sections for each selected language -->
            <div class="space-y-6">
              <div
                v-for="lang in selectedLanguages"
                :key="lang"
                class="p-4 bg-muted/50 rounded-xl border border-border"
              >
                <div class="flex items-center gap-2 mb-4">
                  <div
                    class="w-2 h-2 rounded-full"
                    :class="{
                      'bg-yellow-500': lang === 'kk',
                      'bg-gray-900': lang === 'ru',
                      'bg-purple-500': lang === 'en',
                    }"
                  ></div>
                  <span class="text-sm font-bold uppercase">{{ getLanguageName(lang) }}</span>
                </div>

                <div class="space-y-4">
                  <Input
                    :id="'module-index-' + lang"
                    v-model="languageTexts[lang].moduleIndex"
                    label="Индекс модуля/дисциплины"
                    placeholder="Введите индекс"
                  />

                  <Input
                    :id="'learning-outcome-' + lang"
                    v-model="languageTexts[lang].learningOutcome"
                    label="Наименование результата обучения/дисциплина"
                    placeholder="Введите результат"
                  />

                  <Input
                    :id="'module-name-' + lang"
                    v-model="languageTexts[lang].moduleName"
                    label="Наименование модуля"
                    placeholder="Введите наименование"
                  />
                </div>
              </div>
            </div>

            <div class="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-x-8 gap-y-4">
                <Input
                  :id="'total-credits-'"
                  v-model="step.totalCredits"
                  label="Всего кредитов"
                  type="text" inputmode="numeric"
                  placeholder="0"
                />

                <Input
                  :id="'total-hours-'"
                  v-model="step.totalHours"
                  label="Всего часов"
                  type="text" inputmode="numeric"
                  placeholder="0"
                />

                <Input
                  :id="'group-hours-'"
                  v-model="step.groupHours"
                  label="Групповые"
                  type="text" inputmode="numeric"
                  placeholder="0"
                />

                <Input
                  :id="'theoretical-hours-'"
                  v-model="step.theoreticalHours"
                  label="Теоретических"
                  type="text" inputmode="numeric"
                  placeholder="0"
                />

                <Input
                  :id="'lab-practical-hours-'"
                  v-model="step.labPracticalHours"
                  label="Лабараторно-практических"
                  type="text" inputmode="numeric"
                  placeholder="0"
                />

                <Input
                  :id="'field3-value-'"
                  v-model="step.field3Value"
                  label="3"
                  type="text" inputmode="numeric"
                  placeholder="0"
                />

                <Input
                  :id="'srsp-hours-'"
                  v-model="step.srspHours"
                  label="Самостоятельная работа студента с педагогом"
                  type="text" inputmode="numeric"
                  placeholder="0"
                >
                  <template #button>
                    <button
                      type="button"
                      title="Распределить по семестрам"
                      class="w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active:scale-95"
                      @click="distributeHoursFromField('srspHours')"
                    >
                      <IconArrowDown class="w-4 h-4" />
                    </button>
                  </template>
                </Input>

                <Input
                  :id="'srs-hours-'"
                  v-model="step.srsHours"
                  label="Самостоятельная работа студента"
                  type="text" inputmode="numeric"
                  placeholder="0"
                >
                  <template #button>
                    <button
                      type="button"
                      title="Распределить по семестрам"
                      class="w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active:scale-95"
                      @click="distributeHoursFromField('srsHours')"
                    >
                      <IconArrowDown class="w-4 h-4" />
                    </button>
                  </template>
                </Input>

                <Input
                  :id="'training-practice-hours-'"
                  v-model="step.trainingPracticeHours"
                  label="Производственное обучение / профессиональная практика"
                  type="text" inputmode="numeric"
                  placeholder="0"
                />

                <Input
                  :id="'individual-hours-'"
                  v-model="step.individualHours"
                  label="Индивидуальные"
                  type="text" inputmode="numeric"
                  placeholder="0"
                />

                <Input
                  :id="'individual-additional-hours-'"
                  v-model="step.individualAdditionalHours"
                  label="Индивидуальные (дополнительно)"
                  type="text" inputmode="numeric"
                  placeholder="0"
                >
                  <template #button>
                    <button
                      type="button"
                      title="Распределить по семестрам"
                      class="w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active:scale-95"
                      @click="distributeHoursFromField('individualAdditionalHours')"
                    >
                      <IconArrowDown class="w-4 h-4" />
                    </button>
                  </template>
                </Input>
              </div>

              <div class="mt-6 pt-4 border-t border-border">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-semibold text-foreground">
                    Распределение по курсам и семестрам
                  </div>
                  <f7-button
                    small
                    fill
                    @click="addDistributionEntry"
                    class="add-distribution-btn"
                  >
                    <IconPlus class="w-3.5 h-3.5 mr-1" />
                    Добавить
                  </f7-button>
                </div>

                <div class="distribution-table border border-input rounded-lg">
                  <div class="overflow-x-auto">
                    <div
                      class="distribution-grid distribution-header"
                      :style="distributionGridStyle"
                    >
                      <div>Учебный год</div>
                      <div>Семестр</div>
                      <div class="text-center">Групп</div>
                      <div v-if="visibleColumns.srs" class="text-center">СРС</div>
                      <div v-if="visibleColumns.srsp" class="text-center">СРСП</div>
                      <div v-if="visibleColumns.individual" class="text-center">Индив.</div>
                      <div>Форма контроля</div>
                      <div></div>
                    </div>

                    <div
                      v-if="step.distributionEntries.length === 0"
                      class="text-center py-6 text-muted-foreground text-sm bg-card"
                    >
                      Нет записей распределения. Нажмите «Добавить», чтобы создать первую запись.
                    </div>

                    <div v-else class="distribution-body">
                      <div
                        v-for="entry in step.distributionEntries"
                        :key="entry.id"
                        class="distribution-grid distribution-row"
                        :style="distributionGridStyle"
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
                          type="text" inputmode="numeric"
                          placeholder="0"
                          :show-checkmark="false"
                          :clear-button="false"
                          class="distribution-hours-input"
                        />

                        <Input
                          v-if="visibleColumns.srs"
                          v-model="(entry as any).srsHours"
                          type="text" inputmode="numeric"
                          placeholder="0"
                          :show-checkmark="false"
                          :clear-button="false"
                          class="distribution-hours-input"
                        />
                        <Input
                          v-if="visibleColumns.srsp"
                          v-model="(entry as any).srspHours"
                          type="text" inputmode="numeric"
                          placeholder="0"
                          :show-checkmark="false"
                          :clear-button="false"
                          class="distribution-hours-input"
                        />
                        <Input
                          v-if="visibleColumns.individual"
                          v-model="(entry as any).individualHours"
                          type="text" inputmode="numeric"
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
                            <IconTrash class="w-3.5 h-3.5" />
                          </f7-button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="step.distributionEntries.length > 0"
                class="mt-4 p-4 bg-muted/50 rounded-xl border border-border text-sm"
              >
                <div class="font-semibold mb-2">Итоги распределения:</div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <span class="text-muted-foreground">Групп:</span>
                    <span class="text-muted-foreground font-medium">
                      {{ distributionSummary.group }} / {{ distributionSummary.targetGroup }}
                    </span>
                  </div>
                  <div v-if="visibleColumns.srs">
                    <span class="text-muted-foreground">СРС:</span>
                    <span class="text-muted-foreground font-medium">
                      {{ distributionSummary.srs }} / {{ distributionSummary.targetSrs }}
                    </span>
                  </div>
                  <div v-if="visibleColumns.srsp">
                    <span class="text-muted-foreground">СРСП:</span>
                    <span class="text-muted-foreground font-medium">
                      {{ distributionSummary.srsp }} / {{ distributionSummary.targetSrsp }}
                    </span>
                  </div>
                  <div v-if="visibleColumns.individual">
                    <span class="text-muted-foreground">Индивидуальные:</span>
                    <span class="text-muted-foreground font-medium">
                      {{ distributionSummary.individual }} / {{ distributionSummary.targetIndividual }}
                    </span>
                  </div>
                </div>
              </div>

          </div>
        </div>
      </div>

      <PopoverFooter
        :on-save="submit"
        :disabled="!isFormValid"
        saveVariant="success"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import { f7Popover, f7Checkbox, f7Button, f7 } from "framework7-vue";
import IconTrash from "~icons/lucide/trash-2";
import IconGlobe from "~icons/lucide/globe";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconArrowDown from "~icons/lucide/arrow-down";
import IconPlus from "~icons/lucide/plus";
import {
  isHours,
  distributeFmt,
  computeDistributionSummary,
} from "@/lib/rupHours";
import { parseNumber } from "@/utils/parseNumber";
import RupIntegrationPanel from "@/components/RupIntegrationPanel.vue";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { z } from "zod";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
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

const rupEntryStore = useRupEntryStore();
const academicYearStore = useAcademicYearStore();
const semesterStore = useSemesterStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const scheduledFinalControlStore = useScheduledFinalControlStore();
const finalControlStore = useFinalControlStore();

function createEmptyEntry() {
  return rupEntryStore.createEmptyRupEntry(
    props.academicYearId,
    props.specialtyIds || [],
    props.baseClass ?? 9,
    "ru"
  );
}

const step = ref(createEmptyEntry());
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

// Distribution table optional per-semester columns (revealed by down-arrow buttons)
const visibleColumns = ref({
  srs: false,
  srsp: false,
  individual: false,
});

const distributionGridStyle = computed(() => {
  const extraCount =
    (visibleColumns.value.srs ? 1 : 0) +
    (visibleColumns.value.srsp ? 1 : 0) +
    (visibleColumns.value.individual ? 1 : 0);
  // year | semester | group | (extras) | control | delete
  return {
    gridTemplateColumns: `minmax(160px,1fr) minmax(160px,1fr) 100px ${"100px ".repeat(extraCount)}minmax(220px,1.4fr) 32px`,
    minWidth: `${760 + extraCount * 110}px`,
  };
});

// Integration with subject from another year
// Integration/Connect state moved to RupIntegrationPanel — parent only holds
// a template ref so resetLocalState() can reset it via .reset().
const integrationPanel = ref<InstanceType<typeof RupIntegrationPanel> | null>(null);

// Connect with base-9 (only meaningful for base-11 items)

const baseLabel = computed(() => {
  const base = props.baseClass ?? 9;
  return base === 11 ? "База 11 классов" : "База 9 классов";
});

const distributionSummary = computed(() =>
  computeDistributionSummary(step.value)
);

// availableIntegration/ConnectYears+Subjects moved into RupIntegrationPanel.

function copyFromSource(source: any) {
  // Copy numeric fields
  step.value.totalCredits = source.totalCredits ?? "";
  step.value.totalHours = source.totalHours ?? "";
  step.value.groupHours = source.groupHours ?? "";
  step.value.theoreticalHours = source.theoreticalHours ?? "";
  step.value.labPracticalHours = source.labPracticalHours ?? "";
  step.value.field3Value = source.field3Value ?? "";
  step.value.srspHours = source.srspHours ?? "";
  step.value.srsHours = source.srsHours ?? "";
  step.value.trainingPracticeHours = source.trainingPracticeHours ?? "";
  step.value.individualHours = source.individualHours ?? "";
  step.value.individualAdditionalHours = source.individualAdditionalHours ?? "";

  // Copy text fields per language — use all variants if grouped, else just the source itself.
  // Do NOT overwrite selectedLanguages: the user's own language selection is
  // theirs; we only pre-fill texts for the languages they ALREADY have selected
  // (falling back to the source's own language when the user hasn't opted in).
  const variants = source.groupId
    ? rupEntryStore.getGroupedVariants(source.groupId)
    : [source];

  for (const v of variants) {
    const lang = v.language || "ru";
    // Only pre-fill languages the user actually cares about.
    if (!selectedLanguages.value.includes(lang)) continue;
    languageTexts.value[lang] = {
      moduleIndex: v.moduleIndex || "",
      moduleName: v.moduleName || "",
      learningOutcome: v.learningOutcome || "",
    };
  }
}

// Called from RupIntegrationPanel's @apply-source event with the chosen
// source subject id (both Integration and Connect flows).
function applySource(subjectId: string) {
  if (!subjectId) return;
  const source = rupEntryStore.rupEntries.find((e) => e.id === subjectId);
  if (!source) return;
  copyFromSource(source);
}

// Dirty-state tracking for unsaved changes confirmation
let dirtyBaseline = "";

function serializeFormState() {
  return JSON.stringify({
    step: step.value,
    selectedSpecialtyIds: selectedSpecialtyIds.value,
    selectedLanguages: [...selectedLanguages.value].sort(),
    languageTexts: languageTexts.value,
  });
}

function captureBaseline() {
  dirtyBaseline = serializeFormState();
}

function isFormDirty() {
  return serializeFormState() !== dirtyBaseline;
}

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
        const variants = rupEntryStore.getGroupedVariants(val.groupId);
        if (variants.length > 0) {
          const langs = variants.map((v: any) => v.language || "ru");
          selectedLanguages.value = [...new Set(langs)];
          activeLanguageTab.value = val.language || langs[0];

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

          // Prefill from the CLICKED variant (matches props.initialData.id),
          // not variants[0] — hour fields may diverge across language variants
          // and the user expects to see what they clicked. Deep-copy avoids
          // mutating the store's Convex query cache via nested arrays
          // (distributionEntries / specialtyIds).
          const clicked = variants.find((v: any) => v.id === val.id) ?? variants[0];
          step.value = JSON.parse(JSON.stringify(clicked));
          selectedSpecialtyIds.value = clicked.specialtyIds ? [...clicked.specialtyIds] : [];

          const hasSrs = clicked.distributionEntries?.some((e: any) => Number(e.srsHours) > 0);
          const hasSrsp = clicked.distributionEntries?.some((e: any) => Number(e.srspHours) > 0);
          const hasIndiv = clicked.distributionEntries?.some((e: any) => Number(e.individualHours) > 0);
          visibleColumns.value = {
            srs: !!hasSrs,
            srsp: !!hasSrsp,
            individual: !!hasIndiv,
          };
        } else {
          step.value = { ...val };
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
          
          const hasSrs = val.distributionEntries?.some((e: any) => Number(e.srsHours) > 0);
          const hasSrsp = val.distributionEntries?.some((e: any) => Number(e.srspHours) > 0);
          const hasIndiv = val.distributionEntries?.some((e: any) => Number(e.individualHours) > 0);
          visibleColumns.value = {
            srs: !!hasSrs,
            srsp: !!hasSrsp,
            individual: !!hasIndiv,
          };
        }
      } else {
        step.value = { ...val };
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
        
        const hasSrs = val.distributionEntries?.some((e: any) => Number(e.srsHours) > 0);
        const hasSrsp = val.distributionEntries?.some((e: any) => Number(e.srspHours) > 0);
        const hasIndiv = val.distributionEntries?.some((e: any) => Number(e.individualHours) > 0);
        visibleColumns.value = {
          srs: !!hasSrs,
          srsp: !!hasSrsp,
          individual: !!hasIndiv,
        };
      }
    } else {
      step.value = createEmptyEntry();
      selectedLanguages.value = ["ru"];
      activeLanguageTab.value = "ru";
      languageTexts.value = { ru: { moduleIndex: "", moduleName: "", learningOutcome: "" } };
      editVariantIds.value = {};
      selectedSpecialtyIds.value = props.specialtyIds || [];
    }
    nextTick(() => captureBaseline());
  },
  { immediate: true }
);

watch(
  selectedSpecialtyIds,
  (newIds) => {
    if (step.value) {
      step.value.specialtyIds = newIds;
    }
  },
  { immediate: true }
);

onMounted(async () => {
  await specialtyStore.fetchSpecialties();
  if (!props.editMode || !props.initialData) {
    step.value = createEmptyEntry();
    selectedSpecialtyIds.value = props.specialtyIds || [];
    selectedLanguages.value = ["ru"];
    activeLanguageTab.value = "ru";
    languageTexts.value = { ru: { moduleIndex: "", moduleName: "", learningOutcome: "" } };
  }
  nextTick(() => captureBaseline());
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

// Strict hours validator: integer or one-decimal-group string, no
// leading +/-, no exponent notation, no hex, no whitespace. Empty string
// stays allowed to preserve existing optional-field behavior.
// isHours moved to @/lib/rupHours — imported at top.

const rupEntrySchema = z.object({
  moduleIndex: z.string().min(1, "Индекс модуля обязателен"),
  moduleName: z.string().min(1, "Наименование модуля обязательно"),
  learningOutcome: z
    .string()
    .min(1, "Наименование результата обучения/дисциплина обязательно"),
  totalCredits: z
    .string()
    .refine(isHours, {
      message: "Кредиты должны быть положительным числом",
    })
    .optional(),
  totalHours: z
    .string()
    .refine(isHours, {
      message: "Общие часы должны быть положительным числом",
    })
    .optional(),
  groupHours: z
    .string()
    .refine(isHours, {
      message: "Групповые часы должны быть числом ≥ 0",
    })
    .optional(),
  theoreticalHours: z
    .string()
    .refine(isHours, {
      message: "Теоретические часы должны быть положительным числом",
    })
    .optional(),
  labPracticalHours: z
    .string()
    .refine(isHours, {
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
    .refine(isHours, {
      message: "Часы СРСП должны быть положительным числом",
    })
    .optional(),
  srsHours: z
    .string()
    .refine(isHours, {
      message: "Часы СРС должны быть положительным числом",
    })
    .optional(),
  trainingPracticeHours: z
    .string()
    .refine(isHours, {
      message: "Часы практики должны быть положительным числом",
    })
    .optional(),
  individualHours: z
    .string()
    .refine(isHours, {
      message: "Индивидуальные часы должны быть положительным числом",
    })
    .optional(),
  individualAdditionalHours: z
    .string()
    .refine(isHours, {
      message: "Индивидуальные (дополнительно) должны быть положительным числом",
    })
    .optional(),
  distributionEntries: z.array(distributionEntrySchema).min(0),
});

const validationResult = computed(() => {
  const s = step.value;
  if (!s)
    return { success: false, error: { issues: [{ message: "Нет данных" }] } };
  // Validate ALL selected language tabs, not just the active one — otherwise
  // a user could fill RU, switch to KZ (leaving it blank), and hit Save,
  // producing empty variants server-side. Iterate; first failing tab wins.
  for (const lang of selectedLanguages.value) {
    const texts = languageTexts.value[lang] ?? { moduleIndex: "", moduleName: "", learningOutcome: "" };
    const parsed = rupEntrySchema.safeParse({
      moduleIndex: texts.moduleIndex,
      moduleName: texts.moduleName,
      learningOutcome: texts.learningOutcome,
      totalCredits: String(s.totalCredits),
      totalHours: String(s.totalHours),
      groupHours: String(s.groupHours ?? ""),
      theoreticalHours: String(s.theoreticalHours),
      labPracticalHours: String(s.labPracticalHours),
      field3Value: String(s.field3Value),
      srspHours: String(s.srspHours),
      srsHours: String(s.srsHours),
      trainingPracticeHours: String(s.trainingPracticeHours),
      individualHours: String(s.individualHours),
      individualAdditionalHours: String(s.individualAdditionalHours ?? ""),
      distributionEntries: s.distributionEntries,
    });
    if (!parsed.success) {
      // Prefix per-language errors so the user knows which tab to fix.
      const langLabel = getLanguageName(lang);
      const issues = parsed.error.issues.map((i) => ({
        ...i,
        message: `[${langLabel}] ${i.message}`,
      }));
      return { success: false, error: { issues } } as typeof parsed;
    }
  }
  // All tabs valid — return the last successful parse for the computed shape.
  return { success: true } as { success: true };
});

const formError = computed(() => {
  if (validationResult.value.success) return "";
  const issues = validationResult.value.error.issues;
  if (issues.length > 0) return issues[0].message;
  return "";
});

const isFormValid = computed(() => validationResult.value.success);

function resetLocalState() {
  step.value = createEmptyEntry();
  selectedSpecialtyIds.value = [];
  selectedLanguages.value = ["ru"];
  activeLanguageTab.value = "ru";
  languageTexts.value = { ru: { moduleIndex: "", moduleName: "", learningOutcome: "" } };
  editVariantIds.value = {};
  integrationPanel.value?.reset();
  visibleColumns.value = { srs: false, srsp: false, individual: false };
}

function handlePopoverClosed() {
  resetLocalState();
  emit("close");
}

function closeProgrammatically() {
  f7.popover.close("#rup-entry-popover", true, "programmatic");
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

  const baseClass = props.baseClass ? [props.baseClass] : [9];
  const s = step.value;

  // variants: existing lang -> id from editVariantIds; new lang -> no id
  const variants = selectedLanguages.value.map((lang) => {
    const texts = languageTexts.value[lang] ?? { moduleIndex: "", moduleName: "", learningOutcome: "" };
    const id = editVariantIds.value[lang];
    return {
      ...(id ? { id: id as any } : {}),
      language: lang,
      moduleIndex: texts.moduleIndex,
      moduleName: texts.moduleName,
      learningOutcome: texts.learningOutcome,
    };
  });

  // removedVariantIds: any editVariantIds entry whose lang is no longer selected
  const removedVariantIds = Object.entries(editVariantIds.value)
    .filter(([lang]) => !selectedLanguages.value.includes(lang))
    .map(([, id]) => id as any);

  try {
    await rupEntryStore.saveRupEntryGroup({
      groupId: props.editMode && props.initialData ? props.initialData.groupId : undefined,
      specialtyIds: selectedSpecialtyIds.value,
      academicYearId: props.academicYearId,
      baseClass,
      position: props.editMode && props.initialData ? props.initialData.position : undefined,
      totalCredits: String(s.totalCredits ?? ""),
      totalHours: String(s.totalHours ?? ""),
      groupHours: s.groupHours ? String(s.groupHours) : undefined,
      theoreticalHours: String(s.theoreticalHours ?? ""),
      labPracticalHours: String(s.labPracticalHours ?? ""),
      field3Value: String(s.field3Value ?? ""),
      srspHours: String(s.srspHours ?? ""),
      srsHours: String(s.srsHours ?? ""),
      trainingPracticeHours: String(s.trainingPracticeHours ?? ""),
      individualHours: String(s.individualHours ?? ""),
      individualAdditionalHours: s.individualAdditionalHours ? String(s.individualAdditionalHours) : undefined,
      variants,
      removedVariantIds: removedVariantIds.length ? removedVariantIds : undefined,
      distributionEntries: s.distributionEntries?.length
        ? s.distributionEntries.map((d) => ({
            academicYearId: d.academicYearId,
            semesterId: d.semesterId,
            hours: d.hours,
            srsHours: (d as any).srsHours,
            srspHours: (d as any).srspHours,
            individualHours: (d as any).individualHours,
            intermediateControlId: d.intermediateControlId ?? undefined,
            finalControlId: d.finalControlId ?? undefined,
            examEnabled: d.examEnabled,
            creditEnabled: d.creditEnabled,
            controlLessonEnabled: d.controlLessonEnabled,
          }))
        : undefined,
    });
    captureBaseline();
    emit("submit");
  } catch (err) {
    f7.dialog.alert(err instanceof Error ? err.message : "Ошибка при сохранении");
  }
}

function addDistributionEntry() {
  const s = step.value;
  if (!s) return;

  s.distributionEntries.push({
    id: crypto.randomUUID(),
    academicYearId: props.academicYearId,
    semesterId: "",
    hours: "",
    srsHours: "",
    srspHours: "",
    individualHours: "",
    finalControlId: null,
    examEnabled: false,
    creditEnabled: false,
    controlLessonEnabled: false,
  });
}

function removeDistributionEntry(entryId: string) {
  const s = step.value;
  if (!s) return;

  const entryIndex = s.distributionEntries.findIndex(
    (entry) => entry.id === entryId
  );
  if (entryIndex !== -1) {
    s.distributionEntries.splice(entryIndex, 1);
  }
}

// Down-arrow: reveal the per-semester column AND auto-distribute the top-level
// value evenly across rows. For "individualAdditionalHours" we additionally
// recompute each row's group hours so that group + individual = totalHours/N.
function distributeHoursFromField(
  field: "srspHours" | "srsHours" | "individualAdditionalHours"
) {
  const s = step.value;
  if (!s || !s.distributionEntries.length) {
    f7.dialog.alert("Сначала добавьте запись в распределение часов");
    return;
  }

  // num/fmt/distributeFmt moved to @/lib/rupHours (parseNumber handles comma).

  const count = s.distributionEntries.length;

  if (field === "srspHours") {
    visibleColumns.value.srsp = true;
    const values = distributeFmt(parseNumber(s.srspHours), count);
    s.distributionEntries.forEach((e, i) => {
      (e as any).srspHours = values[i];
    });
  } else if (field === "srsHours") {
    visibleColumns.value.srs = true;
    const values = distributeFmt(parseNumber(s.srsHours), count);
    s.distributionEntries.forEach((e, i) => {
      (e as any).srsHours = values[i];
    });
  } else if (field === "individualAdditionalHours") {
    visibleColumns.value.individual = true;
    const totalIndividual = parseNumber(s.individualAdditionalHours);
    const totalAll = parseNumber(s.totalHours);
    const individualValues = distributeFmt(totalIndividual, count);
    const groupTotal = Math.max(0, totalAll - totalIndividual);
    const groupValues = distributeFmt(groupTotal, count);
    s.distributionEntries.forEach((e, i) => {
      (e as any).individualHours = individualValues[i];
      // Only overwrite group hours if totalHours is set — otherwise leave user values
      if (totalAll > 0) {
        e.hours = groupValues[i];
      }
    });
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
    rupEntryStore.getGroupedVariants(props.initialData.groupId).length > 1;

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
              await rupEntryStore.deleteRupEntry(props.initialData.id);
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
              await rupEntryStore.deleteRupEntryGroup(props.initialData.groupId);
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
          await rupEntryStore.deleteRupEntry(props.initialData.id);
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
.rup-entry-popover {
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
  background: hsl(var(--muted)) !important;
  color: hsl(var(--muted-foreground)) !important;
}

.distribution-table {
  margin-top: 0.25rem;
  border: 1px solid hsl(var(--border)) !important;
  border-radius: 0.6rem !important;
  background: hsl(var(--card));
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
  background: hsl(var(--muted));
  border-bottom: 1px solid hsl(var(--border));
  font-size: 0.8rem;
  line-height: 1rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  align-items: center;
}

.distribution-body {
  background: hsl(var(--card));
}

.distribution-row {
  padding: 0.35rem 0.75rem;
  align-items: center;
  border-bottom: 1px solid hsl(var(--border));
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
  background: hsl(var(--background)) !important;
  border: 1px solid hsl(var(--border)) !important;
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
  color: hsl(var(--foreground)) !important;
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
  background: hsl(var(--muted)) !important;
  min-height: 34px !important;
  border-radius: 0.5rem !important;
}

:deep(.distribution-row li::after),
:deep(.distribution-row li::before),
:deep(.distribution-row .item-content::after),
:deep(.distribution-row .item-content::before) {
  display: none !important;
}

/* Language pill chips (concept-style: colored when active) */
.lang-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: auto;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  border: none;
  white-space: nowrap;
  line-height: 1.2;
}

.lang-pill-inactive {
  background-color: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.lang-pill-inactive:hover {
  background-color: hsl(var(--muted));
  opacity: 0.8;
}

.lang-pill-active {
  color: #ffffff;
}

.lang-pill-active.lang-pill-kk {
  background-color: #eab308;
}
.lang-pill-active.lang-pill-kk:hover {
  background-color: #ca8a04;
}

.lang-pill-active.lang-pill-ru {
  background-color: #111827;
}
:global(.dark) .lang-pill-active.lang-pill-ru {
  background-color: #374151;
}
.lang-pill-active.lang-pill-ru:hover {
  background-color: #1f2937;
}
:global(.dark) .lang-pill-active.lang-pill-ru:hover {
  background-color: #4b5563;
}

.lang-pill-active.lang-pill-en {
  background-color: #a855f7;
}
.lang-pill-active.lang-pill-en:hover {
  background-color: #9333ea;
}

/* Language selector chips (legacy, kept for backward compat) */
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

/* Per-language active chip colors */
.language-chip-kk.language-chip-active {
  background-color: #eab308;
  border-color: #eab308;
  box-shadow: 0 2px 8px rgba(234, 179, 8, 0.3);
}

.language-chip-kk.language-chip-active:hover {
  background-color: #ca8a04;
}

.language-chip-ru.language-chip-active {
  background-color: #111827;
  border-color: #111827;
  box-shadow: 0 2px 8px rgba(17, 24, 39, 0.3);
}
:global(.dark) .language-chip-ru.language-chip-active {
  background-color: #374151;
  border-color: #374151;
}

.language-chip-ru.language-chip-active:hover {
  background-color: #1f2937;
}
:global(.dark) .language-chip-ru.language-chip-active:hover {
  background-color: #4b5563;
}

.language-chip-en.language-chip-active {
  background-color: #a855f7;
  border-color: #a855f7;
  box-shadow: 0 2px 8px rgba(168, 85, 247, 0.3);
}

.language-chip-en.language-chip-active:hover {
  background-color: #9333ea;
}
</style>
