<template>
  <div>
    <button
      id="add-academic-year-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
      aria-label="Add Academic Year"
      type="button"
      @click.stop="openAddAcademicYearPopover"
    >
      <IconPlus class="w-4 h-4 text-white" />
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-academic-year-popover"
      style="width: 600px !important"
      target="#add-academic-year-button"
    
      :on-closed="resetForm">
      <div class="academic-year-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
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
            ></f7-checkbox>
            <label for="is-active" class="ml-2 text-sm text-foreground">
              Активный учебный год
            </label>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleSaveAcademicYear"
          :disabled="!isFormValid || academicYearStore.loading"
          :is-loading="academicYearStore.loading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import { f7, f7Popover, f7Input, f7Checkbox } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { academicYearSchema } from '@/validators/academic-year';
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useEducationTechnologyStore } from "@/stores/educationTechnologyStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Select from "@/components/ui/Select.vue";
import DateInput from "@/components/ui/DateInput.vue";

const academicYearStore = useAcademicYearStore();
const educationTechnologyStore = useEducationTechnologyStore();


const startYear = ref<number | null>(null);
const endYear = ref<number | null>(null);
const isActive = ref(false);
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

// Pre-select the default technology for new years.
watch(
  () => educationTechnologyStore.getDefaultTechnology,
  (defaultTech) => {
    if (defaultTech && !technologyId.value) {
      technologyId.value = defaultTech.id;
    }
  },
  { immediate: true }
);

// Auto-suggest Sept 1 / Jun 30 defaults when the years change — only while
// the corresponding date field is still empty (don't clobber a manual pick).
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
    startYear: startYear.value ? Number(startYear.value) : null,
    endYear: endYear.value ? Number(endYear.value) : null,
    isActive: isActive.value,
    technologyId: String(technologyId.value ?? ""),
    startDate: startDate.value[0] ? dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT) : "",
    endDate: endDate.value[0] ? dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT) : "",
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddAcademicYearPopover = () => {
  f7.popover.open("#add-academic-year-popover", "#add-academic-year-button");
};

const closeAddAcademicYearPopover = () => {
  f7.popover.close("#add-academic-year-popover");
  resetForm();
};

const handleSaveAcademicYear = async () => {
  if (!isFormValid.value) {
    if (!validationResult.value.success) {
      const issues = validationResult.value.error.issues;
      if (issues.length > 0) {
        formError.value = issues[0].message;
      }
    }
    return;
  }

  try {
    const data = validationResult.value.success ? validationResult.value.data : null;
    if (!data) return;

    await academicYearStore.addAcademicYear({
      name: `${startYear.value}-${endYear.value}`,
      startYear: Number(startYear.value),
      endYear: Number(endYear.value),
      isActive: isActive.value,
      technologyId: data.technologyId,
      startDate: data.startDate,
      endDate: data.endDate,
    });
    closeAddAcademicYearPopover();
  } catch (error) {
    console.error("Failed to add academic year:", error);
  }
};

const resetForm = () => {

  startYear.value = null;
  endYear.value = null;
  isActive.value = false;
  technologyId.value = educationTechnologyStore.getDefaultTechnology?.id ?? "";
  startDate.value = [];
  endDate.value = [];
  formError.value = "";
  academicYearStore.clearError();
};
</script>
