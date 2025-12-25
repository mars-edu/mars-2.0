<template>
  <div>
    <f7-popover
      v-show="academicYearSemester"
      :id="'edit-academic-year-semester-popover-' + academicYearSemester.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#academic-year-semester-item-${academicYearSemester.id}`"
    >
      <div class="semester-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать семестр учебного года"
          :disabled="academicYearSemesterStore.isLoading"
          :is-loading="academicYearSemesterStore.isLoading"
          :on-cancel="closeEditAcademicYearSemesterPopover"
          :on-save="handleUpdateAcademicYearSemester"
        />

        <div
          v-if="formError || academicYearSemesterStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || academicYearSemesterStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <Input
            v-model="selectedSemesterNumber"
            label="Номер семестра"
            placeholder="Введите номер семестра"
            type="number"
            required
            :clear-button="true"
          />

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="start-date-edit">
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="start-date-edit"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="startDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="end-date-edit">
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="end-date-edit"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="endDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="academicYearSemesterStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить семестр
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect, watch } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { f7, f7Popover, f7Input, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import type { AcademicYearSemester } from "@/stores/academicYearSemesterStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import Input from "@/components/ui/Input.vue";
import { DATE_PICKER_PARAMS } from "@/constants/calendar";

const props = defineProps<{ academicYearSemesterId: string }>();

const academicYearSemesterStore = useAcademicYearSemesterStore();

// Get academic year semester from store by ID - always fresh data
const academicYearSemester = computed(() =>
  academicYearSemesterStore.getAcademicYearSemesterById(props.academicYearSemesterId)
);

const selectedSemesterNumber = ref<number | string>(1);
const startDate = ref<Date[]>([new Date()]);
const endDate = ref<Date[]>([new Date()]);
const formError = ref("");

// Update form fields whenever academic year semester data changes
watchEffect(() => {
  if (academicYearSemester.value) {
    selectedSemesterNumber.value = academicYearSemester.value.semesterNumber;

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
  }
});

const academicYearSemesterSchema = z
  .object({
    semesterNumber: z
      .number()
      .min(1, "Номер семестра должен быть больше 0")
      .max(8, "Номер семестра не может быть больше 8"),
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
    semesterNumber: Number(selectedSemesterNumber.value),
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
    await academicYearSemesterStore.updateAcademicYearSemester(
      academicYearSemester.value.id,
      {
        semesterNumber: Number(selectedSemesterNumber.value),
        startDate: dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT),
        endDate: dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT),
      }
    );
    closeEditAcademicYearSemesterPopover();
  } catch (error) {
    console.error("Failed to update academic year semester:", error);
    // Error from store will be displayed automatically
  }
};

const showDeleteConfirmation = () => {
  if (!academicYearSemester.value) return;
  f7.popover.close(
    `#edit-academic-year-semester-popover-${academicYearSemester.value.id}`
  );

  const semesterName = `семестр ${academicYearSemester.value.semesterNumber}`;

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить "${semesterName}" из учебного года?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление семестра",
    async () => {
      if (!academicYearSemester.value) return;
      try {
        await academicYearSemesterStore.deleteAcademicYearSemester(
          academicYearSemester.value.id
        );
      } catch (error) {
        console.error("Failed to delete academic year semester:", error);
        f7.dialog.alert("Произошла ошибка при удалении семестра.");
      }
    }
  );
};

const resetForm = () => {
  if (!academicYearSemester.value) return;
  selectedSemesterNumber.value = academicYearSemester.value.semesterNumber;

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
