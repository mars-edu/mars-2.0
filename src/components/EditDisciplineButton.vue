<template>
  <div>
    <f7-popover
      :id="'edit-discipline-popover-' + discipline.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#discipline-item-${discipline.id}`"
    >
      <div class="discipline-popover bg-card text-card-foreground">
        <div
          class="flex justify-between items-center px-4 py-3 border-b border-input"
        >
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="closeEditDisciplinePopover"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold">Редактировать</span>
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!isFormValid || disciplineStore.isLoading"
            @click="handleUpdateDiscipline"
          >
            Сохранить
          </button>
        </div>

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

          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <f7-checkbox
                v-model:value="linkWithRup"
                label="С РУП"
              ></f7-checkbox>
              <f7-checkbox v-model:value="linkWithT" label="Т"></f7-checkbox>
            </div>
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
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7Checkbox, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useDisciplineStore } from "@/stores/disciplineStore";

const props = defineProps<{
  discipline: {
    id: string;
    moduleIndex: string;
    moduleName: string;
    learningOutcome: string;
    linkWithRup: boolean;
    linkWithT: boolean;
  };
}>();

const disciplineStore = useDisciplineStore();

const moduleIndex = ref(props.discipline.moduleIndex);
const moduleName = ref(props.discipline.moduleName);
const learningOutcome = ref(props.discipline.learningOutcome);
const linkWithRup = ref(props.discipline.linkWithRup);
const linkWithT = ref(props.discipline.linkWithT);
const formError = ref("");

const disciplineSchema = z.object({
  moduleIndex: z.string().min(1, "Пожалуйста, введите индекс модуля"),
  moduleName: z.string().min(1, "Пожалуйста, введите название модуля"),
  learningOutcome: z
    .string()
    .min(1, "Пожалуйста, введите результат обучения или дисциплину"),
  linkWithRup: z.boolean(),
  linkWithT: z.boolean(),
});

const validationResult = computed(() => {
  return disciplineSchema.safeParse({
    moduleIndex: moduleIndex.value,
    moduleName: moduleName.value,
    learningOutcome: learningOutcome.value,
    linkWithRup: linkWithRup.value,
    linkWithT: linkWithT.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditDisciplinePopover = () => {
  f7.popover.close(`#edit-discipline-popover-${props.discipline.id}`);
  resetForm();
};

const handleUpdateDiscipline = async () => {
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
    await disciplineStore.updateDiscipline(props.discipline.id, {
      moduleIndex: moduleIndex.value,
      moduleName: moduleName.value,
      learningOutcome: learningOutcome.value,
      linkWithRup: linkWithRup.value,
      linkWithT: linkWithT.value,
    });
    closeEditDisciplinePopover();
  } catch (error) {
    console.error("Failed to update discipline:", error);
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close(`#edit-discipline-popover-${props.discipline.id}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить дисциплину "${props.discipline.moduleName}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление дисциплины",
    async () => {
      try {
        await disciplineStore.deleteDiscipline(props.discipline.id);
      } catch (error) {
        console.error("Failed to delete discipline:", error);
        f7.dialog.alert("Произошла ошибка при удалении дисциплины.");
      }
    }
  );
};

const resetForm = () => {
  moduleIndex.value = props.discipline.moduleIndex;
  moduleName.value = props.discipline.moduleName;
  learningOutcome.value = props.discipline.learningOutcome;
  linkWithRup.value = props.discipline.linkWithRup;
  linkWithT.value = props.discipline.linkWithT;
  formError.value = "";
  disciplineStore.clearError();
};
</script>
