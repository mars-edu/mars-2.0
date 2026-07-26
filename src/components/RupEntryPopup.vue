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
            <RupSpecialtyPicker v-model="selectedSpecialtyIds" />

            <RupLanguageTabs
              ref="languageTabs"
              v-model:selected="selectedLanguages"
              v-model:texts="languageTexts"
              v-model:active="activeLanguageTab"
            />

            <RupHourFields
              v-model:step="step"
              @distribute="distributeHoursFromField"
            />

              <RupDistributionTable
                :entries="step.distributionEntries"
                :visible-columns="visibleColumns"
                :summary="distributionSummary"
                @add="addDistributionEntry"
                @remove="removeDistributionEntry"
              />

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
import IconCircleCheck from "~icons/lucide/circle-check";
// isHours no longer needed here — refines live in @/validators/rup.
import RupIntegrationPanel from "@/components/RupIntegrationPanel.vue";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
// zod schemas moved to @/validators/rup.
import { rupEntrySchema } from "@/validators/rup";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import Select from "@/components/ui/Select.vue";
import Input from "@/components/ui/Input.vue";
import RupSpecialtyPicker from "@/components/RupSpecialtyPicker.vue";
import RupLanguageTabs from "@/components/RupLanguageTabs.vue";
import { useLanguageVariants } from "@/composables/useLanguageVariants";
import { useRupHourDistribution } from "@/composables/useRupHourDistribution";
import RupHourFields from "@/components/RupHourFields.vue";
import RupDistributionTable from "@/components/RupDistributionTable.vue";

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

// Language-variant state + helpers extracted to a composable.
const {
  selectedLanguages,
  activeLanguageTab,
  languageTexts,
  editVariantIds,
  getLanguageName,
  reset: resetLanguages,
  loadFromVariants: loadLanguageVariants,
  buildSaveVariants,
  buildRemovedVariantIds,
} = useLanguageVariants();

// Ref only needed if the parent wants to call component methods on RupLanguageTabs
// (currently none — kept nullable in case future actions land there).
const languageTabs = ref<InstanceType<typeof RupLanguageTabs> | null>(null);

// Distribution rows + optional columns + summary + distribute helpers moved
// into useRupHourDistribution.
const {
  visibleColumns,
  summary: distributionSummary,
  addDistributionEntry,
  removeDistributionEntry,
  distributeHoursFromField,
  reset: resetDistribution,
} = useRupHourDistribution(step, {
  academicYearIdFor: () => props.academicYearId,
  onEmptyDistributeAttempt: () =>
    f7.dialog.alert("Сначала добавьте запись в распределение часов"),
});

// distributionGridStyle moved to RupDistributionTable.

// Integration/Connect state moved to RupIntegrationPanel — parent only holds
// a template ref so resetLocalState() can reset it via .reset().
const integrationPanel = ref<InstanceType<typeof RupIntegrationPanel> | null>(null);

// Connect with base-9 (only meaningful for base-11 items)

const baseLabel = computed(() => {
  const base = props.baseClass ?? 9;
  return base === 11 ? "База 11 классов" : "База 9 классов";
});

// distributionSummary provided by useRupHourDistribution above.
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

// toggleLanguage moved into RupLanguageTabs. getLanguageName is used by
// validationResult below to prefix errors with the offending tab; keep a small
// helper here reading the same store.
// getLanguageName provided by useLanguageVariants (destructured above).

watch(
  () => [props.initialData, props.editMode],
  ([val, edit]) => {
    if (edit && val) {
      // Check if this item is part of a language group
      if (val.groupId) {
        const variants = rupEntryStore.getGroupedVariants(val.groupId);
        if (variants.length > 0) {
          loadLanguageVariants(variants, val.language);

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

onMounted(() => {
  // specialtyStore.fetchSpecialties() moved into RupSpecialtyPicker's own onMounted.
  if (!props.editMode || !props.initialData) {
    step.value = createEmptyEntry();
    selectedSpecialtyIds.value = props.specialtyIds || [];
    resetLanguages();
  }
  nextTick(() => captureBaseline());
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
  resetLanguages();
  integrationPanel.value?.reset();
  resetDistribution();
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

  // Variant payloads (existing lang -> id patch, new lang -> insert) +
  // removedVariantIds (deselected langs) come from useLanguageVariants.
  const variants = buildSaveVariants();
  const removedVariantIds = buildRemovedVariantIds();

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

// addDistributionEntry / removeDistributionEntry / distributeHoursFromField
// provided by useRupHourDistribution above.
// getFinalControlOptionsForYear moved into RupDistributionTable.

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
