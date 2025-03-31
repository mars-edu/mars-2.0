<template>
  <div>
    <button
      id="add-specialty-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-green-500 md:text-primary hover:bg-primary/10 rounded-lg transition-colors"
      aria-label="Add Specialty"
      type="button"
      @click="openAddSpecialtyPopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="md:text-primary"
      ></f7-icon>
    </button>

    <f7-popover
      id="add-specialty-popover"
      style="width: 600px !important"
      target="#add-specialty-button"
      close-on-escape
    >
      <div class="specialty-popover bg-card text-card-foreground">
        <!-- Header with buttons -->
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
            :disabled="!!formError"
            @click="handleSaveSpecialty"
          >
            Сохранить
          </button>
        </div>

        <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
          {{ formError }}
        </div>

        <div class="p-4 space-y-4">
          <!-- Specialty name input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-name">
              Наименование специальности
            </label>
            <f7-input
              id="specialty-name"
              type="text"
              v-model="specialtyName"
              placeholder="Введите полное наименование специальности"
            ></f7-input>
          </div>

          <!-- Code name input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code-name">
              Кодовое наименование специальности
            </label>
            <f7-input
              id="specialty-code-name"
              type="text"
              v-model="specialtyCodeName"
              placeholder="Для удобного отображения можно обозначить кодом, буквой или цифрой"
            ></f7-input>
          </div>

          <!-- Specialty code input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code">
              Шифр специальности
            </label>
            <f7-input
              id="specialty-code"
              type="text"
              v-model="specialtyCode"
              placeholder="Внесите шифр специальности"
            ></f7-input>
          </div>

          <!-- Module/discipline creation checkbox -->
          <div class="space-y-2">
            <div class="text-sm text-foreground">Создание модуля/дисциплин</div>
            <f7-checkbox
              v-model="createModule"
              label="Поставьте галочку"
            ></f7-checkbox>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7, f7Popover, f7Input, f7Checkbox } from "framework7-vue";

const emit = defineEmits<{
  (e: "specialty-added", specialty: SpecialtyData): void;
}>();

interface SpecialtyData {
  name: string;
  codeName: string;
  code: string;
  createModule: boolean;
}

// Form state
const specialtyName = ref("");
const specialtyCodeName = ref("");
const specialtyCode = ref("");
const createModule = ref(false);
const formError = ref("");

// Popover controls
const openAddSpecialtyPopover = () => {
  f7.popover.open("#add-specialty-popover", "#add-specialty-button");
};

const closeAddSpecialtyPopover = () => {
  f7.popover.close("#add-specialty-popover");
  resetForm();
};

// Form validation
const validateForm = () => {
  if (!specialtyName.value.trim()) {
    formError.value = "Пожалуйста, введите наименование специальности";
    return false;
  }

  if (!specialtyCode.value.trim()) {
    formError.value = "Пожалуйста, введите шифр специальности";
    return false;
  }

  formError.value = "";
  return true;
};

// Save handler
const handleSaveSpecialty = () => {
  if (!validateForm()) return;

  emit("specialty-added", {
    name: specialtyName.value,
    codeName: specialtyCodeName.value,
    code: specialtyCode.value,
    createModule: createModule.value,
  });

  closeAddSpecialtyPopover();
};

// Reset form
const resetForm = () => {
  specialtyName.value = "";
  specialtyCodeName.value = "";
  specialtyCode.value = "";
  createModule.value = false;
  formError.value = "";
};
</script>
