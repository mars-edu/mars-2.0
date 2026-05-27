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
          :disabled="!isFormValid || academicYearStore.isLoading"
          :is-loading="academicYearStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { f7, f7Popover, f7Input, f7Checkbox } from "framework7-vue";
import { z } from "zod";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  academicYearId: string;
}>();

const academicYearStore = useAcademicYearStore();

// Get academic year from store by ID - always fresh data
const academicYear = computed(() => academicYearStore.getAcademicYearById(props.academicYearId));


const startYear = ref<number>(0);
const endYear = ref<number>(0);
const isActive = ref(false);
const formError = ref("");

// Update form fields whenever academic year data changes
watchEffect(() => {
  if (academicYear.value) {

    startYear.value = academicYear.value.startYear;
    endYear.value = academicYear.value.endYear;
    isActive.value = academicYear.value.isActive;
  }
});

const academicYearSchema = z
  .object({
    startYear: z
      .number()
      .int()
      .positive("Год начала должен быть положительным числом"),
    endYear: z
      .number()
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
    startYear: Number(startYear.value),
    endYear: Number(endYear.value),
    isActive: isActive.value,
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
  formError.value = "";
  academicYearStore.clearError();
};
</script>
