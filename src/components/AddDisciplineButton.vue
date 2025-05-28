<template>
  <div>
    <button
      id="add-discipline-button"
      class="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-12 md:h-12 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors shadow-lg z-50"
      aria-label="Add Discipline"
      type="button"
      @click.stop="openAddDisciplinePopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>

    <f7-popover
      id="add-discipline-popover"
      style="width: 600px !important"
      target="#add-discipline-button"
      close-on-escape
    >
      <div class="discipline-popover bg-card text-card-foreground">
        <div
          class="flex justify-between items-center px-4 py-3 border-b border-input"
        >
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="closeAddDisciplinePopover"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold">Создать</span>
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!isFormValid || disciplineStore.isLoading"
            @click="handleSaveDiscipline"
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
            <div class="flex items-center gap-3">
              <f7-checkbox v-model:value="linkWithRup"></f7-checkbox>
              <span class="text-sm">С РУП</span>
            </div>
            <div class="flex items-center gap-3">
              <f7-checkbox v-model:value="linkWithT"></f7-checkbox>
              <span class="text-sm">Т</span>
            </div>
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

const disciplineStore = useDisciplineStore();

const moduleIndex = ref("");
const moduleName = ref("");
const learningOutcome = ref("");
const linkWithRup = ref(false);
const linkWithT = ref(false);
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

const openAddDisciplinePopover = () => {
  f7.popover.open("#add-discipline-popover", "#add-discipline-button");
};

const closeAddDisciplinePopover = () => {
  f7.popover.close("#add-discipline-popover");
  resetForm();
};

const handleSaveDiscipline = async () => {
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
    await disciplineStore.addDiscipline({
      moduleIndex: moduleIndex.value,
      moduleName: moduleName.value,
      learningOutcome: learningOutcome.value,
      linkWithRup: linkWithRup.value,
      linkWithT: linkWithT.value,
    });
    closeAddDisciplinePopover();
  } catch (error) {
    console.error("Failed to add discipline:", error);
  }
};

const resetForm = () => {
  moduleIndex.value = "";
  moduleName.value = "";
  learningOutcome.value = "";
  linkWithRup.value = false;
  linkWithT.value = false;
  formError.value = "";
  disciplineStore.clearError();
};
</script>
