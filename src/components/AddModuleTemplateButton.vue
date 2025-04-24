<template>
  <div>
    <slot name="trigger" :open="openAddModuleTemplatePopover"></slot>
    <f7-popover
      id="add-module-template-popover"
      style="width: 600px !important"
      :target="popoverTarget"
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
            :disabled="!isFormValid"
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
              v-model:value="formData[index]"
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
import { ref, computed, onMounted } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import { useColumnConfigStore } from "@/stores/columnConfig";
import { useModuleStore } from "@/stores/moduleStore";
import { z } from "zod";

const columnStore = useColumnConfigStore();
const moduleStore = useModuleStore();
const columns = computed(() => columnStore.columns);

const formData = ref<string[]>([]);

const moduleTemplateSchema = computed(() => {
  return z.object({
    fields: z
      .array(z.string())
      .refine(
        (fields) => fields.some((field) => field.trim() !== ""),
        "Пожалуйста, заполните хотя бы одно поле"
      ),
  });
});

const validationResult = computed(() => {
  return moduleTemplateSchema.value.safeParse({
    fields: formData.value,
  });
});

const formError = computed(() => {
  if (validationResult.value.success) return "";
  const issues = validationResult.value.error.issues;
  if (issues.length > 0) return issues[0].message;
  return "";
});

const isFormValid = computed(() => validationResult.value.success);

computed(() => {
  formData.value = new Array(columns.value.length).fill("");
});

const popoverTarget = ref<string | HTMLElement>("#add-module-template-button");

const openAddModuleTemplatePopover = (event?: Event) => {
  if (event && event.currentTarget) {
    popoverTarget.value = event.currentTarget as HTMLElement;
    f7.popover.open("#add-module-template-popover", event.currentTarget);
  } else {
    popoverTarget.value = "#add-module-template-button";
    f7.popover.open(
      "#add-module-template-popover",
      "#add-module-template-button"
    );
  }
};

const closeAddModuleTemplatePopover = () => {
  f7.popover.close("#add-module-template-popover");
  resetForm();
};

const handleSaveModuleTemplate = () => {
  if (!isFormValid.value) return;

  const moduleData: Record<string, string> = {};
  formData.value.forEach((value, index) => {
    moduleData[`field${index}`] = value;
  });

  moduleStore.addModule(moduleData);
  closeAddModuleTemplatePopover();
};

const resetForm = () => {
  formData.value = new Array(columns.value.length).fill("");
};
</script>
