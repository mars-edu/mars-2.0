<template>
  <div>
    <button
      id="add-specialty-button"
      class="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-12 md:h-12 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors shadow-lg z-50"
      aria-label="Add Specialty"
      type="button"
      @click.stop="openAddSpecialtyPopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>

    <f7-popover
      id="add-specialty-popover"
      style="width: 600px !important"
      target="#add-specialty-button"
      close-on-escape
    >
      <div class="specialty-popover bg-card text-card-foreground">
        <div
          class="flex justify-between items-center px-4 py-3 border-b border-input"
        >
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="closeAddSpecialtyPopover"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold">Создать</span>
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!isFormValid || specialtyStore.isLoading"
            @click="handleSaveSpecialty"
          >
            Сохранить
          </button>
        </div>

        <div
          v-if="formError || specialtyStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || specialtyStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code">
              Шифр специальности
            </label>
            <f7-input
              id="specialty-code"
              type="text"
              v-model:value="specialtyCode"
              placeholder="Введите шифр специальности"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-name">
              Наименование специальности
            </label>
            <f7-input
              id="specialty-name"
              type="text"
              v-model:value="specialtyName"
              placeholder="Введите полное наименование специальности"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-details">
              Дополнительные сведения о специальности
            </label>
            <f7-input
              id="specialty-details"
              type="text"
              v-model:value="specialtyDetails"
              placeholder="Введите шифр специальности"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code-name">
              Кодовое наименование специальности
            </label>
            <f7-input
              id="specialty-code-name"
              type="text"
              v-model:value="specialtyCodeName"
              placeholder="Для удобного отображения можно обозначить кодом, буквой или цифрой"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <div class="flex items-center gap-3">
              <f7-checkbox v-model:value="linkWithStudentCard"></f7-checkbox>
              <span class="text-sm">С картотекой обучающихся</span>
            </div>
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
import { useSpecialtyStore } from "@/stores/specialtyStore";

const specialtyStore = useSpecialtyStore();

const specialtyCode = ref("");
const specialtyName = ref("");
const specialtyDetails = ref("");
const specialtyCodeName = ref("");
const linkWithStudentCard = ref(false);
const linkWithRup = ref(false);
const linkWithT = ref(false);
const formError = ref("");

const specialtySchema = z.object({
  code: z.string().min(1, "Пожалуйста, введите шифр специальности"),
  name: z.string().min(1, "Пожалуйста, введите наименование специальности"),
  details: z.string(),
  codeName: z.string(),
  linkWithStudentCard: z.boolean(),
  linkWithRup: z.boolean(),
  linkWithT: z.boolean(),
});

const validationResult = computed(() => {
  return specialtySchema.safeParse({
    code: specialtyCode.value,
    name: specialtyName.value,
    details: specialtyDetails.value,
    codeName: specialtyCodeName.value,
    linkWithStudentCard: linkWithStudentCard.value,
    linkWithRup: linkWithRup.value,
    linkWithT: linkWithT.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddSpecialtyPopover = () => {
  f7.popover.open("#add-specialty-popover", "#add-specialty-button");
};

const closeAddSpecialtyPopover = () => {
  f7.popover.close("#add-specialty-popover");
  resetForm();
};

const handleSaveSpecialty = async () => {
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
    await specialtyStore.addSpecialty({
      code: specialtyCode.value,
      name: specialtyName.value,
      details: specialtyDetails.value,
      codeName: specialtyCodeName.value,
      linkWithStudentCard: linkWithStudentCard.value,
      linkWithRup: linkWithRup.value,
      linkWithT: linkWithT.value,
    });
    closeAddSpecialtyPopover();
  } catch (error) {
    console.error("Failed to add specialty:", error);
  }
};

const resetForm = () => {
  specialtyCode.value = "";
  specialtyName.value = "";
  specialtyDetails.value = "";
  specialtyCodeName.value = "";
  linkWithStudentCard.value = false;
  linkWithRup.value = false;
  linkWithT.value = false;
  formError.value = "";
  specialtyStore.clearError();
};
</script>
