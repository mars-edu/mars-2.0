<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="academicYearSemester"
      :id="'edit-academic-year-semester-popover-' + academicYearSemester.id"
      style="width: 600px !important"
      :target="`#academic-year-semester-item-${academicYearSemester.id}`"
    >
      <div class="semester-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать семестр учебного года"
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
              <label class="text-sm text-foreground" for="start-date-edit">
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <DateInput
                v-model:value="startDate"
                placeholder="Дата"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="end-date-edit">
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
          :on-save="handleUpdateAcademicYearSemester"
          :disabled="academicYearSemesterStore.isLoading"
          :is-loading="academicYearSemesterStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, watch } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { f7, f7Input } from "framework7-vue";
import { academicYearSemesterSchema } from '@/validators/academic-year';
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useSemesterStore } from "@/stores/semesterStore";
import type { AcademicYearSemester } from "@/stores/academicYearSemesterStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import DateInput from "@/components/ui/DateInput.vue";

const props = defineProps<{ academicYearSemesterId: string }>();

const academicYearSemesterStore = useAcademicYearSemesterStore();
const semesterStore = useSemesterStore();

// Get academic year semester from store by ID - always fresh data
const academicYearSemester = computed(() =>
  academicYearSemesterStore.getAcademicYearSemesterById(props.academicYearSemesterId)
);

const selectedSemesterId = ref<string | number>("");
const startDate = ref<Date[]>([new Date()]);
const endDate = ref<Date[]>([new Date()]);
const weeksCount = ref<number | null>(null);
const formError = ref("");

const semesterOptions = computed(() => {
  return semesterStore.sortedSemesters.map((semester) => ({
    value: semester.id,
    text: `${semester.shortName}${semester.fullName ? ` (${semester.fullName})` : ""}`,
  }));
});

// Update form fields whenever academic year semester data changes
watchEffect(() => {
  if (academicYearSemester.value) {
    // Set semester selection using the semesterDefinitionId
    selectedSemesterId.value = academicYearSemester.value.semesterDefinitionId || "";

    // Safely parse dates, defaulting to empty array if invalid
    if (academicYearSemester.value.startDate) {
      const parsedStartDate = new Date(academicYearSemester.value.startDate);
      startDate.value = !isNaN(parsedStartDate.getTime()) ? [parsedStartDate] : [];
    } else {
      startDate.value = [];
    }

    weeksCount.value = academicYearSemester.value.weeksCount ?? null;
    if (academicYearSemester.value.endDate) {
      const parsedEndDate = new Date(academicYearSemester.value.endDate);
      endDate.value = !isNaN(parsedEndDate.getTime()) ? [parsedEndDate] : [];
    } else {
      endDate.value = [];
    }
  }
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

const closeEditAcademicYearSemesterPopover = () => {
  if (!academicYearSemester.value) return;
  f7.popover.close(
    `#edit-academic-year-semester-popover-${academicYearSemester.value.id}`
  );
  resetForm();
};

const handleUpdateAcademicYearSemester = async () => {
  // Clear previous errors
  formError.value = "";
  academicYearSemesterStore.clearError();

  // Validate form
  if (!isFormValid.value || !academicYearSemester.value) {
    if (!validationResult.value.success) {
      const issues = validationResult.value.error.issues;
      if (issues.length > 0) {
        formError.value = issues[0].message;
      }
    }
    return;
  }

  try {
    // Get the selected semester definition
    const selectedSemester = semesterStore.getSemesterById(String(selectedSemesterId.value));
    if (!selectedSemester) {
      formError.value = "Выбранный семестр не найден";
      return;
    }

    await academicYearSemesterStore.updateAcademicYearSemester(
      academicYearSemester.value.id,
      {
        semesterDefinitionId: selectedSemester.id,
        startDate: dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT),
        endDate: dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT),
        weeksCount: weeksCount.value ?? undefined,
      }
    );
    closeEditAcademicYearSemesterPopover();
  } catch (error) {
    console.error("Failed to update academic year semester:", error);
    // Error from store will be displayed automatically
  }
};



const resetForm = () => {
  if (!academicYearSemester.value) return;

  // Reset to current semester using semesterDefinitionId
  selectedSemesterId.value = academicYearSemester.value.semesterDefinitionId || "";

  // Safely parse dates, defaulting to empty array if invalid
  if (academicYearSemester.value.startDate) {
    const parsedStartDate = new Date(academicYearSemester.value.startDate);
    startDate.value = !isNaN(parsedStartDate.getTime()) ? [parsedStartDate] : [];
  } else {
    startDate.value = [];
  }

  if (academicYearSemester.value.endDate) {
    const parsedEndDate = new Date(academicYearSemester.value.endDate);
    endDate.value = !isNaN(parsedEndDate.getTime()) ? [parsedEndDate] : [];
  } else {
    endDate.value = [];
  }

  formError.value = "";
  academicYearSemesterStore.clearError();
};
</script>
