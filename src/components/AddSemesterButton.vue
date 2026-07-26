<template>
  <div>
    <button
      :id="buttonId"
      class="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
      aria-label="Добавить семестр"
      type="button"
      @click.stop="openAddSemesterPopover"
    >
      <IconPlus class="text-[20px]" />
      <span>Добавить</span>
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      :id="popoverId"
      style="width: 600px !important"
      :target="`#${buttonId}`"
    
      :on-closed="resetForm">
      <div class="period-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать семестр"
          :on-cancel="requestClose"
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
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              v-model:value="semesterNumber"
              placeholder="Например: 1"
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

        <PopoverFooter
          :on-save="handleSaveSemester"
          :disabled="!isFormValid || semesterStore.isLoading"
          :is-loading="semesterStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { semesterCreateSchema } from "@/validators/semester";
import { useSemesterStore } from "@/stores/semesterStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{ prefix?: string }>();

const computedPrefix = computed(() => props.prefix || "semester");
const buttonId = computed(() => `add-${computedPrefix.value}-button`);
const popoverId = computed(() => `add-${computedPrefix.value}-popover`);

const semesterStore = useSemesterStore();
const academicYearStore = useAcademicYearStore();

const semesterNumber = ref<number | string>("");
const shortName = ref("");
const formError = ref("");

const validationResult = computed(() => {
  return semesterCreateSchema.safeParse({
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
