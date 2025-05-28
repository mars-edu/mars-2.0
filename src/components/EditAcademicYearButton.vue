<template>
  <div>
    <f7-popover
      :id="'edit-academic-year-popover-' + academicYear.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#academic-year-item-${academicYear.id}`"
    >
      <div class="academic-year-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :disabled="!isFormValid || academicYearStore.isLoading"
          :is-loading="academicYearStore.isLoading"
          :on-cancel="closeEditAcademicYearPopover"
          :on-save="handleUpdateAcademicYear"
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
              :disabled="academicYear.isActive"
            ></f7-checkbox>
            <label for="is-active" class="ml-2 text-sm text-foreground">
              Активный учебный год
            </label>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="academicYearStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить учебный год
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7Checkbox, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  academicYear: {
    id: string;
    name: string;
    startYear: number;
    endYear: number;
    isActive: boolean;
  };
}>();

console.log("EditAcademicYearButton props:", props.academicYear);

const academicYearStore = useAcademicYearStore();

const academicYearName = ref(props.academicYear.name);
const startYear = ref<number>(props.academicYear.startYear);
const endYear = ref<number>(props.academicYear.endYear);
const isActive = ref(props.academicYear.isActive);
const formError = ref("");

const academicYearSchema = z
  .object({
    name: z.string().min(1, "Пожалуйста, введите название учебного года"),
    startYear: z
      .number({
        required_error: "Пожалуйста, введите год начала",
        invalid_type_error: "Год начала должен быть числом",
      })
      .int()
      .positive("Год начала должен быть положительным числом"),
    endYear: z
      .number({
        required_error: "Пожалуйста, введите год окончания",
        invalid_type_error: "Год окончания должен быть числом",
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
    startYear: Number(startYear.value),
    endYear: Number(endYear.value),
    isActive: isActive.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditAcademicYearPopover = () => {
  f7.popover.close(`#edit-academic-year-popover-${props.academicYear.id}`);
  resetForm();
};

const handleUpdateAcademicYear = async () => {
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
    await academicYearStore.updateAcademicYear(props.academicYear.id, {
      name: academicYearName.value,
      startYear: Number(startYear.value),
      endYear: Number(endYear.value),
      isActive: isActive.value,
    });
    closeEditAcademicYearPopover();
  } catch (error) {
    console.error("Failed to update academic year:", error);
  }
};

const showDeleteConfirmation = () => {
  if (props.academicYear.isActive) {
    f7.dialog.alert("Нельзя удалить активный учебный год.");
    return;
  }

  f7.popover.close(`#edit-academic-year-popover-${props.academicYear.id}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить учебный год "${props.academicYear.name}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление учебного года",
    async () => {
      try {
        await academicYearStore.deleteAcademicYear(props.academicYear.id);
      } catch (error) {
        console.error("Failed to delete academic year:", error);
        f7.dialog.alert("Произошла ошибка при удалении учебного года.");
      }
    }
  );
};

const resetForm = () => {
  academicYearName.value = props.academicYear.name;
  startYear.value = props.academicYear.startYear;
  endYear.value = props.academicYear.endYear;
  isActive.value = props.academicYear.isActive;
  formError.value = "";
  academicYearStore.clearError();
};
</script>
