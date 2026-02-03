<template>
  <div>
    <button
      id="add-academic-year-semester-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors"
      aria-label="Добавить семестр к учебному году"
      type="button"
      @click.stop="openAddAcademicYearSemesterPopover"
    >
      <f7-icon ios="f7:plus" md="material:add" size="16px" class="text-white" />
    </button>

    <f7-popover
      id="add-academic-year-semester-popover"
      style="width: 600px !important"
      target="#add-academic-year-semester-button"
    >
      <div class="semester-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Добавить семестр к учебному году"
          :disabled="academicYearSemesterStore.isLoading"
          :is-loading="academicYearSemesterStore.isLoading"
          :on-cancel="closeAddAcademicYearSemesterPopover"
          :on-save="handleSaveAcademicYearSemester"
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
              <f7-input
                id="start-date"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="startDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="end-date">
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="end-date"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="endDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { f7, f7Popover, f7Input, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import Input from "@/components/ui/Input.vue";
import Select from "@/components/ui/Select.vue";
import { DATE_PICKER_PARAMS } from "@/constants/calendar";

const academicYearSemesterStore = useAcademicYearSemesterStore();
const academicYearStore = useAcademicYearStore();
const semesterStore = useSemesterStore();

const selectedSemesterId = ref<string | number>("");
const startDate = ref<Date[]>([]);
const endDate = ref<Date[]>([]);
const formError = ref("");

const semesterOptions = computed(() => {
  return semesterStore.sortedSemesters.map((semester) => ({
    value: semester.id,
    text: `${semester.shortName}${semester.fullName ? ` (${semester.fullName})` : ""}`,
  }));
});

const academicYearSemesterSchema = z
  .object({
    semesterId: z
      .string()
      .min(1, "Пожалуйста, выберите семестр"),
    startDate: z
      .array(z.date())
      .min(1, "Пожалуйста, укажите дату начала")
      .refine(
        (dates) => dates.length > 0 && !isNaN(dates[0].getTime()),
        "Дата начала указана некорректно"
      ),
    endDate: z
      .array(z.date())
      .min(1, "Пожалуйста, укажите дату окончания")
      .refine(
        (dates) => dates.length > 0 && !isNaN(dates[0].getTime()),
        "Дата окончания указана некорректно"
      ),
  })
  .refine(
    (data) =>
      data.startDate.length > 0 &&
      data.endDate.length > 0 &&
      !isNaN(data.startDate[0].getTime()) &&
      !isNaN(data.endDate[0].getTime()) &&
      data.endDate[0] > data.startDate[0],
    {
      message: "Дата окончания должна быть позже даты начала",
      path: ["endDate"],
    }
  );

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
  formError.value = "";
  academicYearSemesterStore.clearError();
};
</script>
