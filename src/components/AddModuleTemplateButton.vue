<template>
  <div>
    <button
      id="add-module-template-button"
      class="px-3 py-1 border rounded-md text-center flex items-center justify-center"
      aria-label="Add Module Template"
      type="button"
      @click="openAddModuleTemplatePopover"
    >
      <i class="f7-icons text-green-500">plus</i>
    </button>

    <!-- Framework7 Popover -->
    <f7-popover
      id="add-module-template-popover"
      style="width: 600px !important"
      target="#add-module-template-button"
      close-on-escape
    >
      <div class="module-template-popover bg-card text-card-foreground">
        <!-- Header with buttons -->
        <div
          class="flex justify-between items-center px-4 py-3 border-b border-input"
        >
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="closeAddModuleTemplatePopover"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold"
            >Создание шаблона модуля/дисциплины</span
          >
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!!formError"
            @click="handleSaveModuleTemplate"
          >
            Сохранить
          </button>
        </div>

        <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
          {{ formError }}
        </div>

        <div class="p-4 space-y-4">
          <!-- Module name input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-name">
              Наименование модуля/дисциплины
            </label>
            <input
              id="module-name"
              type="text"
              v-model="moduleName"
              placeholder="Введите наименование модуля/дисциплины"
              class="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <!-- Module code input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-code">
              Код модуля/дисциплины
            </label>
            <input
              id="module-code"
              type="text"
              v-model="moduleCode"
              placeholder="Введите код модуля/дисциплины"
              class="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <!-- Credits input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-credits">
              Количество кредитов
            </label>
            <input
              id="module-credits"
              type="number"
              v-model="moduleCredits"
              placeholder="Введите количество кредитов"
              class="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <!-- Module type selection -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-type">
              Тип модуля/дисциплины
            </label>
            <select
              id="module-type"
              v-model="moduleType"
              class="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            >
              <option value="">Выберите тип</option>
              <option value="mandatory">Обязательный</option>
              <option value="optional">По выбору</option>
              <option value="additional">Дополнительный</option>
            </select>
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
  (e: "module-template-added", moduleTemplate: ModuleTemplateData): void;
}>();

interface ModuleTemplateData {
  name: string;
  code: string;
  credits: number;
  type: string;
}

// Form state
const moduleName = ref("");
const moduleCode = ref("");
const moduleCredits = ref<number | null>(null);
const moduleType = ref("");
const formError = ref("");

// Popover controls
const openAddModuleTemplatePopover = () => {
  f7.popover.open(
    "#add-module-template-popover",
    "#add-module-template-button"
  );
};

const closeAddModuleTemplatePopover = () => {
  f7.popover.close("#add-module-template-popover");
  resetForm();
};

// Form validation
const validateForm = () => {
  if (!moduleName.value.trim()) {
    formError.value = "Пожалуйста, введите наименование модуля/дисциплины";
    return false;
  }

  if (!moduleCode.value.trim()) {
    formError.value = "Пожалуйста, введите код модуля/дисциплины";
    return false;
  }

  if (!moduleCredits.value || moduleCredits.value <= 0) {
    formError.value = "Пожалуйста, введите корректное количество кредитов";
    return false;
  }

  if (!moduleType.value) {
    formError.value = "Пожалуйста, выберите тип модуля/дисциплины";
    return false;
  }

  formError.value = "";
  return true;
};

// Save handler
const handleSaveModuleTemplate = () => {
  if (!validateForm()) return;

  emit("module-template-added", {
    name: moduleName.value,
    code: moduleCode.value,
    credits: moduleCredits.value!,
    type: moduleType.value,
  });

  closeAddModuleTemplatePopover();
};

// Reset form
const resetForm = () => {
  moduleName.value = "";
  moduleCode.value = "";
  moduleCredits.value = null;
  moduleType.value = "";
  formError.value = "";
};
</script>
