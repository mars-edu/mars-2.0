<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="discipline"
      :id="'edit-discipline-popover-' + discipline._id"
      style="width: 600px !important"
      :target="`#discipline-item-${discipline._id}`"
    
      :on-closed="resetForm">
      <div class="discipline-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || disciplineStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || disciplineStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-index">
              Индекс модуля
            </label>
            <f7-input
              id="module-index"
              type="text"
              v-model:value="moduleIndex"
              placeholder="Введите индекс модуля"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-name">
              Модуль
            </label>
            <f7-input
              id="module-name"
              type="text"
              v-model:value="moduleName"
              placeholder="Введите название модуля"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="learning-outcome">
              Результат обучения/Дисциплина
            </label>
            <f7-input
              id="learning-outcome"
              type="text"
              v-model:value="learningOutcome"
              placeholder="Введите результат обучения или дисциплину"
            ></f7-input>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="disciplineStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить дисциплину
            </button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateDiscipline"
          :disabled="!isFormValid || disciplineStore.isLoading"
          :is-loading="disciplineStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { f7, f7Popover, f7Input, f7Checkbox, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useDisciplineStore } from "@/stores/disciplineStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  disciplineId: string;
}>();

const disciplineStore = useDisciplineStore();

// Get discipline from store by ID - always fresh data
const discipline = computed(() => disciplineStore.getDisciplineById(props.disciplineId));

const moduleIndex = ref("");
const moduleName = ref("");
const learningOutcome = ref("");
const formError = ref("");

// Update form fields whenever discipline data changes
watchEffect(() => {
  if (discipline.value) {
    moduleIndex.value = discipline.value.moduleIndex;
    moduleName.value = discipline.value.moduleName;
    learningOutcome.value = discipline.value.learningOutcome;
  }
});

const disciplineSchema = z.object({
  moduleIndex: z.string().min(1, "Пожалуйста, введите индекс модуля"),
  moduleName: z.string().min(1, "Пожалуйста, введите название модуля"),
  learningOutcome: z
    .string()
    .min(1, "Пожалуйста, введите результат обучения или дисциплину"),
});

const validationResult = computed(() => {
  return disciplineSchema.safeParse({
    moduleIndex: moduleIndex.value,
    moduleName: moduleName.value,
    learningOutcome: learningOutcome.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditDisciplinePopover = () => {
  if (!discipline.value) return;
  f7.popover.close(`#edit-discipline-popover-${discipline.value._id}`);
  resetForm();
};

const handleUpdateDiscipline = async () => {
  if (!isFormValid.value || !discipline.value) {
    if (!validationResult.value.success) {
      const issues = validationResult.value.error.issues;
      if (issues.length > 0) {
        formError.value = issues[0].message;
      }
    }
    return;
  }

  try {
    await disciplineStore.updateDiscipline(discipline.value._id, {
      moduleIndex: moduleIndex.value,
      moduleName: moduleName.value,
      learningOutcome: learningOutcome.value,
    });
    closeEditDisciplinePopover();
  } catch (error) {
    console.error("Failed to update discipline:", error);
  }
};

const showDeleteConfirmation = () => {
  if (!discipline.value) return;
  f7.popover.close(`#edit-discipline-popover-${discipline.value._id}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить дисциплину "${discipline.value.moduleName}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление дисциплины",
    async () => {
      if (!discipline.value) return;
      try {
        await disciplineStore.deleteDiscipline(discipline.value._id);
      } catch (error) {
        console.error("Failed to delete discipline:", error);
        f7.dialog.alert("Произошла ошибка при удалении дисциплины.");
      }
    }
  );
};

const resetForm = () => {
  if (!discipline.value) return;
  moduleIndex.value = discipline.value.moduleIndex;
  moduleName.value = discipline.value.moduleName;
  learningOutcome.value = discipline.value.learningOutcome;
  formError.value = "";
  disciplineStore.clearError();
};
</script>
