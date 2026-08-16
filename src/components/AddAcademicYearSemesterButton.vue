<template>
  <div>
    <button
      id="add-academic-year-semester-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
      aria-label="Добавить семестр к учебному году"
      type="button"
      @click.stop="openAddAcademicYearSemesterPopover"
    >
      <IconPlus class="w-4 h-4 text-white" />
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-academic-year-semester-popover"
      style="width: 600px !important"
      target="#add-academic-year-semester-button"
    
      :on-closed="resetForm">
      <div class="semester-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Добавить семестр к учебному году"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || academicYearSemesterStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || academicYearSemesterStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <Select
            v-model="selectedSemesterId"
            :options="semesterOptions"
            label="Семестр"
            placeholder="Выберите семестр"
          />

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="start-date">
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <DateInput
                v-model:value="startDate"
                placeholder="Дата"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="end-date">
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <DateInput
                v-model:value="endDate"
                placeholder="Дата"
              />
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="weeks-count">
              Учебных недель
            </label>
            <f7-input
              id="weeks-count"
              type="number"
              min="1"
              max="52"
              v-model:value="weeksCount"
              placeholder="18"
            ></f7-input>
            <p class="text-xs text-muted-foreground">
              Норматив учебных недель (не календарная длина семестра).
              Подставляется в нагрузку при добавлении дисциплины. По умолчанию 18.
            </p>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleSaveAcademicYearSemester"
          :disabled="academicYearSemesterStore.isLoading"
          :is-loading="academicYearSemesterStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { f7, f7Input } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { academicYearSemesterSchema } from '@/validators/academic-year';
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import DateInput from "@/components/ui/DateInput.vue";

const academicYearSemesterStore = useAcademicYearSemesterStore();
const academicYearStore = useAcademicYearStore();
const semesterStore = useSemesterStore();

const selectedSemesterId = ref<string | number>("");
const startDate = ref<Date[]>([]);
const endDate = ref<Date[]>([]);
const weeksCount = ref<number | null>(null);
const formError = ref("");

const semesterOptions = computed(() => {
  return semesterStore.sortedSemesters.map((semester) => ({
    value: semester.id,
    text: `${semester.shortName}${semester.fullName ? ` (${semester.fullName})` : ""}`,
  }));
});


const validationResult = computed(() => {
  return academicYearSemesterSchema.safeParse({
    semesterId: String(selectedSemesterId.value),
    startDate: startDate.value,
    endDate: endDate.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

// Clear error when form becomes valid
watch(isFormValid, (newValid) => {
  if (newValid && formError.value) {
    formError.value = "";
  }
});

const openAddAcademicYearSemesterPopover = () => {
  f7.popover.open(
    "#add-academic-year-semester-popover",
    "#add-academic-year-semester-button"
  );
};

const closeAddAcademicYearSemesterPopover = () => {
  f7.popover.close("#add-academic-year-semester-popover");
  resetForm();
};

const handleSaveAcademicYearSemester = async () => {
  // Clear previous errors
  formError.value = "";
  academicYearSemesterStore.clearError();

  // Validate form
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
    const activeAcademicYear = academicYearStore.getActiveAcademicYear;
    if (!activeAcademicYear) {
      formError.value = "Пожалуйста, выберите активный учебный год";
      return;
    }

    // Get the selected semester definition
    const selectedSemester = semesterStore.getSemesterById(String(selectedSemesterId.value));
    if (!selectedSemester) {
      formError.value = "Выбранный семестр не найден";
      return;
    }

    await academicYearSemesterStore.addAcademicYearSemester({
      academicYearId: activeAcademicYear.id,
      semesterDefinitionId: selectedSemester.id,
      startDate: dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT),
      endDate: dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT),
      weeksCount: weeksCount.value ?? undefined,
    });
    closeAddAcademicYearSemesterPopover();
  } catch (error) {
    console.error("Failed to add academic year semester:", error);
    // Error from store will be displayed automatically
  }
};

const resetForm = () => {
  selectedSemesterId.value = "";
  startDate.value = [];
  endDate.value = [];
  weeksCount.value = null;
  formError.value = "";
  academicYearSemesterStore.clearError();
};
</script>
