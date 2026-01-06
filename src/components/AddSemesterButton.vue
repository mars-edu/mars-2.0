<template>
  <div>
    <button
      :id="buttonId"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors"
      aria-label="Добавить семестр"
      type="button"
      @click.stop="openAddSemesterPopover"
    >
      <f7-icon ios="f7:plus" md="material:add" size="16px" class="text-white" />
    </button>

    <f7-popover
      :id="popoverId"
      style="width: 600px !important"
      :target="`#${buttonId}`"
      close-on-escape
    >
      <div class="period-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать семестр"
          :disabled="!isFormValid || semesterStore.isLoading"
          :is-loading="semesterStore.isLoading"
          :on-cancel="closeAddSemesterPopover"
          :on-save="handleSaveSemester"
        />

        <div
          v-if="formError || semesterStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || semesterStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="semester-number">
              Номер семестра <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="semester-number"
              type="number"
              v-model:value="semesterNumber"
              placeholder="Например: 1"
              min="1"
            />
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="semester-short-name">
              Название семестра <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="semester-short-name"
              type="text"
              v-model:value="shortName"
              placeholder="Например: Осенний семестр"
            />
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useSemesterStore } from "@/stores/semesterStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{ prefix?: string }>();

const computedPrefix = computed(() => props.prefix || "semester");
const buttonId = computed(() => `add-${computedPrefix.value}-button`);
const popoverId = computed(() => `add-${computedPrefix.value}-popover`);

const semesterStore = useSemesterStore();
const academicYearStore = useAcademicYearStore();

const semesterNumber = ref<number | string>("");
const shortName = ref("");
const formError = ref("");

const semesterSchema = z.object({
  number: z.coerce.number().min(1, "Пожалуйста, введите номер семестра"),
  shortName: z.string().min(1, "Пожалуйста, введите название семестра"),
});

const validationResult = computed(() => {
  return semesterSchema.safeParse({
    number: semesterNumber.value,
    shortName: shortName.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddSemesterPopover = () => {
  f7.popover.open(`#${popoverId.value}`, `#${buttonId.value}`);
};

const closeAddSemesterPopover = () => {
  f7.popover.close(`#${popoverId.value}`);
  resetForm();
};

const handleSaveSemester = async () => {
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

    await semesterStore.addSemester({
      number: Number(semesterNumber.value),
      shortName: shortName.value,
      academicYearId: activeAcademicYear.id,
    });
    closeAddSemesterPopover();
  } catch (error) {
    console.error("Failed to add semester:", error);
  }
};

const resetForm = () => {
  semesterNumber.value = "";
  shortName.value = "";
  formError.value = "";
  semesterStore.clearError();
};
</script>
