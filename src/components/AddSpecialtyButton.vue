<template>
  <div>
    <button
      id="add-specialty-button"
      class="px-3 py-1 border rounded-md text-center flex items-center justify-center"
      aria-label="Add Specialty"
      type="button"
      @click="openAddSpecialtyPopover"
    >
      <i class="f7-icons text-green-500">plus</i>
    </button>

    <!-- Framework7 Popover -->
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
            <input
              id="specialty-name"
              type="text"
              v-model="specialtyName"
              placeholder="Введите полное наименование специальности"
              class="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <!-- Code name input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code-name">
              Кодовое наименование специальности
            </label>
            <input
              id="specialty-code-name"
              type="text"
              v-model="specialtyCodeName"
              placeholder="Для удобного отображения можно обозначить кодом, буквой или цифрой"
              class="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <!-- Specialty code input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code">
              Шифр специальности
            </label>
            <input
              id="specialty-code"
              type="text"
              v-model="specialtyCode"
              placeholder="Внесите шифр специальности"
              class="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <!-- Module/discipline creation checkbox -->
          <div class="space-y-2">
            <div class="text-sm text-foreground">Создание модуля/дисциплин</div>
            <label class="flex items-center cursor-pointer">
              <input
                type="checkbox"
                v-model="createModule"
                class="form-checkbox h-5 w-5 text-primary border-input rounded focus:ring-primary"
              />
              <span class="ml-2 text-sm text-muted-foreground"
                >Поставьте галочку</span
              >
            </label>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7, f7Popover } from "framework7-vue";

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
