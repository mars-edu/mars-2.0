<template>
  <div>
    <button
      id="add-module-template-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-green-500 md:text-primary hover:bg-primary/10 rounded-lg transition-colors"
      aria-label="Add Module Template"
      type="button"
      @click="openAddModuleTemplatePopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="md:text-primary"
      ></f7-icon>
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
          <span class="text-foreground font-semibold">Создать</span>
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
            <f7-input
              id="module-name"
              type="text"
              v-model="moduleName"
              placeholder="Введите наименование модуля/дисциплины"
            ></f7-input>
          </div>

          <!-- Module code input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-code">
              Код модуля/дисциплины
            </label>
            <f7-input
              id="module-code"
              type="text"
              v-model="moduleCode"
              placeholder="Введите код модуля/дисциплины"
            ></f7-input>
          </div>

          <!-- Credits input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-credits">
              Количество кредитов
            </label>
            <f7-input
              id="module-credits"
              type="number"
              v-model="moduleCredits"
              placeholder="Введите количество кредитов"
            ></f7-input>
          </div>

          <!-- Module type selection -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="module-type">
              Тип модуля/дисциплины
            </label>
            <f7-list no-hairlines-md>
              <f7-list-item
                smart-select
                :smart-select-params="{
                  openIn: 'popover',
                  closeOnSelect: true,
                  searchbar: false,
                  title: 'Тип модуля/дисциплины',
                }"
              >
                <template #title>
                  <span>{{
                    moduleType
                      ? moduleType === "mandatory"
                        ? "Обязательный"
                        : moduleType === "optional"
                        ? "По выбору"
                        : "Дополнительный"
                      : "Выберите тип"
                  }}</span>
                </template>
                <select id="module-type" v-model="moduleType">
                  <option value="">Выберите тип</option>
                  <option value="mandatory">Обязательный</option>
                  <option value="optional">По выбору</option>
                  <option value="additional">Дополнительный</option>
                </select>
              </f7-list-item>
            </f7-list>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7, f7Popover, f7Input, f7List, f7ListItem } from "framework7-vue";

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
