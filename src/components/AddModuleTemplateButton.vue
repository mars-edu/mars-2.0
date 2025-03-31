<template>
  <div>
    <button
      id="add-module-template-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-green-500 md:text-primary hover:bg-primary/10 rounded-lg transition-colors"
      aria-label="Add Module Template"
      type="button"
      @click.stop="openAddModuleTemplatePopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="md:text-primary"
      ></f7-icon>
    </button>

    <f7-popover
      id="add-module-template-popover"
      style="width: 600px !important"
      target="#add-module-template-button"
      close-on-escape
    >
      <div class="module-template-popover bg-card text-card-foreground">
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
          <div
            v-for="(column, index) in columns"
            :key="index"
            class="space-y-2"
          >
            <label class="text-sm text-foreground" :for="'field-' + index">
              {{ column.name || "Столбец " + (index + 1) }}
            </label>
            <f7-input
              :id="'field-' + index"
              type="text"
              v-model="formData[index]"
              clear-button
              :placeholder="
                'Введите ' + (column.name.toLowerCase() || 'значение')
              "
            ></f7-input>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import { useColumnConfigStore } from "@/stores/columnConfig";
import { useModuleStore } from "@/stores/moduleStore";

const columnStore = useColumnConfigStore();
const moduleStore = useModuleStore();
const columns = computed(() => columnStore.columns);

const formData = ref<string[]>([]);
const formError = ref("");

computed(() => {
  formData.value = new Array(columns.value.length).fill("");
});

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

const validateForm = () => {
  const hasValue = formData.value.some((value) => value.trim() !== "");

  if (!hasValue) {
    formError.value = "Пожалуйста, заполните хотя бы одно поле";
    return false;
  }

  formError.value = "";
  return true;
};

const handleSaveModuleTemplate = () => {
  if (!validateForm()) return;

  const moduleData: Record<string, string> = {};
  formData.value.forEach((value, index) => {
    moduleData[`field${index}`] = value;
  });

  moduleStore.addModule(moduleData);
  closeAddModuleTemplatePopover();
};

const resetForm = () => {
  formData.value = new Array(columns.value.length).fill("");
  formError.value = "";
};
</script>
