<template>
  <div>
    <button
      id="add-academic-year-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors"
      aria-label="Add Academic Year"
      type="button"
      @click.stop="openAddAcademicYearPopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>

    <f7-popover
      id="add-academic-year-popover"
      style="width: 600px !important"
      target="#add-academic-year-button"
      close-on-escape
    >
      <div class="academic-year-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
          :disabled="!isFormValid || academicYearStore.isLoading"
          :is-loading="academicYearStore.isLoading"
          :on-cancel="closeAddAcademicYearPopover"
          :on-save="handleSaveAcademicYear"
        />

        <div
          v-if="formError || academicYearStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || academicYearStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="academic-year-name">
              Название учебного года
            </label>
            <f7-input
              id="academic-year-name"
              type="text"
              v-model:value="academicYearName"
              placeholder="Например: 2023-2024"
            ></f7-input>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="start-year">
                Начало учебного года
              </label>
              <f7-input
                id="start-year"
                type="number"
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
                type="number"
                v-model:value="endYear"
                placeholder="Например: 2024"
              ></f7-input>
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
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7Icon, f7Checkbox } from "framework7-vue";
import { z } from "zod";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const academicYearStore = useAcademicYearStore();

const academicYearName = ref("");
const startYear = ref<number | null>(null);
const endYear = ref<number | null>(null);
const isActive = ref(false);
const formError = ref("");

const academicYearSchema = z
  .object({
    name: z.string().min(1, "Пожалуйста, введите название учебного года"),
    startYear: z
      .number({
        error: "Пожалуйста, введите год начала",
      })
      .int()
      .positive("Год начала должен быть положительным числом"),
    endYear: z
      .number({
        error: "Пожалуйста, введите год окончания",
      })
      .int()
      .positive("Год окончания должен быть положительным числом"),
    isActive: z.boolean(),
  })
  .refine((data) => data.endYear > data.startYear, {
    message: "Год окончания должен быть больше года начала",
    path: ["endYear"],
  });

const validationResult = computed(() => {
  return academicYearSchema.safeParse({
    name: academicYearName.value,
    startYear: startYear.value ? Number(startYear.value) : null,
    endYear: endYear.value ? Number(endYear.value) : null,
    isActive: isActive.value,
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
    await academicYearStore.addAcademicYear({
      name: academicYearName.value,
      startYear: Number(startYear.value),
      endYear: Number(endYear.value),
      isActive: isActive.value,
    });
    closeAddAcademicYearPopover();
  } catch (error) {
    console.error("Failed to add academic year:", error);
  }
};

const resetForm = () => {
  academicYearName.value = "";
  startYear.value = null;
  endYear.value = null;
  isActive.value = false;
  formError.value = "";
  academicYearStore.clearError();
};
</script>
