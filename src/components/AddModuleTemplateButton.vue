<template>
  <div>
    <slot name="trigger" :open="openAddModuleTemplatePopover"></slot>
    <GuardedPopover
      id="add-module-template-popover"
      style="width: 600px !important"
      :target="popoverTarget"
      :on-closed="resetForm"
    >
      <div class="module-template-popover bg-card text-card-foreground">
        <div
          class="flex justify-between items-center px-4 py-3 border-b border-input"
        >
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="handleCancel"
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
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import { useColumnConfigStore } from "@/stores/columnConfig";
import { useModuleStore } from "@/stores/moduleStore";
import { moduleTemplateSchema } from '@/validators/module-template';
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  specialtyId: string;
  courseId: string;
}>();

const columnStore = useColumnConfigStore();
const moduleStore = useModuleStore();
const columns = computed(() => columnStore.getColumnsForCourse(props.courseId));

const formData = ref<string[]>([]);


watch(
  columns,
  () => {
    formData.value = new Array(columns.value.length).fill("");
  },
  { immediate: true }
);

const validationResult = computed(() => {
  return moduleTemplateSchema.safeParse({
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

const popoverTarget = ref<string | HTMLElement>("#add-module-template-button");

const openAddModuleTemplatePopover = (event?: Event) => {
  if (event && event.currentTarget) {
    popoverTarget.value = event.currentTarget as HTMLElement;
    f7.popover.open(
      "#add-module-template-popover",
      event.currentTarget as HTMLElement
    );
  } else {
    popoverTarget.value = "#add-module-template-button";
    f7.popover.open(
      "#add-module-template-popover",
      "#add-module-template-button"
    );
  }
};

const closeAddModuleTemplatePopover = (reason: "cancel" | "programmatic" = "programmatic") => {
  f7.popover.close("#add-module-template-popover", true, reason);
};

const handleCancel = () => {
  closeAddModuleTemplatePopover("cancel");
};

const handleSaveModuleTemplate = () => {
  if (!isFormValid.value) return;

  const moduleData: Record<string, string> = {
    id: crypto.randomUUID(),
    specialtyId: props.specialtyId,
    courseId: props.courseId,
  };

  formData.value.forEach((value, index) => {
    moduleData[`field${index}`] = value;
  });

  moduleStore.addModule(moduleData as any);
  closeAddModuleTemplatePopover("programmatic");
};

const resetForm = () => {
  formData.value = new Array(columns.value.length).fill("");
};
</script>
