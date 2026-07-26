<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="academicYear"
      :id="'edit-academic-year-popover-' + academicYear.id"
      style="width: 600px !important"
      :target="`#academic-year-item-${academicYear.id}`"
    
      :on-closed="resetForm">
      <div class="academic-year-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || academicYearStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || academicYearStore.getError }}
        </div>

        <div class="p-4 space-y-4">


          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="start-year">
                Начало учебного года
              </label>
              <f7-input
                id="start-year"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                v-model:value="startYear"
                placeholder="Например: 2023"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="end-year">
                Окончание учебного года
              </label>
              <f7-input
                id="end-year"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                v-model:value="endYear"
                placeholder="Например: 2024"
              ></f7-input>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="academic-hour-minutes">
              Длительность академического часа (мин)
            </label>
            <f7-input
              id="academic-hour-minutes"
              type="number"
              min="1"
              max="180"
              v-model:value="academicHourMinutes"
              placeholder="45"
            ></f7-input>
            <p class="text-xs text-muted-foreground">
              Стандарт РК — 45. Изменение пересчитает «факт» часов препода
              для отчётов этого года.
            </p>
          </div>

          <Select
            v-model="technologyId"
            :options="technologyOptions"
            label="Технология обучения"
            placeholder="Выберите технологию"
          />

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="year-start-date">
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <DateInput
                v-model:value="startDate"
                placeholder="Дата"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="year-end-date">
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <DateInput
                v-model:value="endDate"
                placeholder="Дата"
              />
            </div>
          </div>

          <div class="flex items-center">
            <f7-checkbox
              id="is-active"
              v-model:checked="isActive"
              :disabled="academicYear.isActive"
            ></f7-checkbox>
            <label for="is-active" class="ml-2 text-sm text-foreground">
              Активный учебный год
            </label>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateAcademicYear"
          :disabled="!isFormValid || academicYearStore.loading"
          :is-loading="academicYearStore.loading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, watch } from "vue";
import dayjs from "dayjs";
import { f7, f7Popover, f7Input, f7Checkbox } from "framework7-vue";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { academicYearSchema } from '@/validators/academic-year';
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useEducationTechnologyStore } from "@/stores/educationTechnologyStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Select from "@/components/ui/Select.vue";
import DateInput from "@/components/ui/DateInput.vue";

const props = defineProps<{
  academicYearId: string;
}>();

const academicYearStore = useAcademicYearStore();
const educationTechnologyStore = useEducationTechnologyStore();

// Get academic year from store by ID - always fresh data
const academicYear = computed(() => academicYearStore.getAcademicYearById(props.academicYearId));


const startYear = ref<number>(0);
const endYear = ref<number>(0);
const isActive = ref(false);
// null = "use the default (45) at read-time"; f7-input number type binds
// directly (no string↔number ping-pong).
const academicHourMinutes = ref<number | null>(null);
const technologyId = ref<string | number>("");
const startDate = ref<Date[]>([]);
const endDate = ref<Date[]>([]);
const formError = ref("");

const technologyOptions = computed(() =>
  educationTechnologyStore.technologies.map((tech) => ({
    value: tech.id,
    text: tech.name,
  }))
);

// Update form fields whenever academic year data changes
watchEffect(() => {
  if (academicYear.value) {

    startYear.value = academicYear.value.startYear;
    endYear.value = academicYear.value.endYear;
    isActive.value = academicYear.value.isActive;
    academicHourMinutes.value = academicYear.value.academicHourMinutes ?? null;
    technologyId.value =
      academicYear.value.technologyId ?? educationTechnologyStore.getDefaultTechnology?.id ?? "";
    startDate.value = academicYear.value.startDate ? [new Date(academicYear.value.startDate)] : [];
    endDate.value = academicYear.value.endDate ? [new Date(academicYear.value.endDate)] : [];
  }
});

// Auto-suggest Sept 1 / Jun 30 defaults when the years change — only while
// the corresponding date field is still empty (don't clobber a manual pick
// or the pre-filled value from the loaded year).
watch(startYear, (newStartYear) => {
  if (newStartYear && startDate.value.length === 0) {
    startDate.value = [new Date(Number(newStartYear), 8, 1)];
  }
});
watch(endYear, (newEndYear) => {
  if (newEndYear && endDate.value.length === 0) {
    endDate.value = [new Date(Number(newEndYear), 5, 30)];
  }
});


const validationResult = computed(() => {
  return academicYearSchema.safeParse({
    startYear: Number(startYear.value),
    endYear: Number(endYear.value),
    isActive: isActive.value,
    academicHourMinutes: academicHourMinutes.value ?? undefined,
    technologyId: String(technologyId.value ?? ""),
    startDate: startDate.value[0] ? dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT) : "",
    endDate: endDate.value[0] ? dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT) : "",
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditAcademicYearPopover = () => {
  if (!academicYear.value) return;
  f7.popover.close(`#edit-academic-year-popover-${academicYear.value.id}`);
  resetForm();
};

const handleUpdateAcademicYear = async () => {
  if (!isFormValid.value || !academicYear.value) {
    if (!validationResult.value.success) {
      const issues = validationResult.value.error.issues;
      if (issues.length > 0) {
        formError.value = issues[0].message;
      }
    }
    return;
  }

  try {
    await academicYearStore.updateAcademicYear(academicYear.value.id, {
      name: `${startYear.value}-${endYear.value}`,
      startYear: Number(startYear.value),
      endYear: Number(endYear.value),
      isActive: isActive.value,
      // Zod already validated + normalized (blank/invalid → undefined via
      // .catch); pass the parsed value from validationResult, not the raw ref.
      academicHourMinutes: validationResult.value.success
        ? validationResult.value.data.academicHourMinutes
        : undefined,
      technologyId: validationResult.value.success ? validationResult.value.data.technologyId : undefined,
      startDate: validationResult.value.success ? validationResult.value.data.startDate : undefined,
      endDate: validationResult.value.success ? validationResult.value.data.endDate : undefined,
    });
    closeEditAcademicYearPopover();
  } catch (error) {
    console.error("Failed to update academic year:", error);
  }
};



const resetForm = () => {
  if (!academicYear.value) return;

  startYear.value = academicYear.value.startYear;
  endYear.value = academicYear.value.endYear;
  isActive.value = academicYear.value.isActive;
  academicHourMinutes.value = academicYear.value.academicHourMinutes ?? null;
  technologyId.value =
    academicYear.value.technologyId ?? educationTechnologyStore.getDefaultTechnology?.id ?? "";
  startDate.value = academicYear.value.startDate ? [new Date(academicYear.value.startDate)] : [];
  endDate.value = academicYear.value.endDate ? [new Date(academicYear.value.endDate)] : [];
  formError.value = "";
  academicYearStore.clearError();
};
</script>
