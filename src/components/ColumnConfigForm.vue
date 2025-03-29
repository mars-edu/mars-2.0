<template>
  <div>
    <button
      id="column-config-button"
      class="px-3 py-1 border rounded-md text-center flex items-center justify-center"
      aria-label="Configure Columns"
      type="button"
      @click="openColumnConfigPopover"
    >
      <i class="f7-icons text-green-500">plus</i>
    </button>
    <f7-popover
      id="column-config-popover"
      style="width: 600px !important"
      target="#column-config-button"
      close-on-escape
    >
      <div class="column-config-popover bg-card text-card-foreground">
        <div
          class="flex justify-between items-center px-4 py-3 border-b border-input"
        >
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="closeColumnConfigPopover"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold">Создать</span>
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!!formError"
            @click="handleSaveColumns"
          >
            Сохранить
          </button>
        </div>
        <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
          {{ formError }}
        </div>
        <div class="p-4 space-y-6">
          <div class="grid grid-cols-[1fr,auto] gap-4 mb-2">
            <div class="text-gray-700 text-sm font-medium">
              Наименование столбца
            </div>
            <div class="text-gray-700 text-sm font-medium w-24 text-center">
              Ширина
            </div>
          </div>
          <template v-for="(column, index) in columns" :key="index">
            <div class="grid grid-cols-[1fr,auto] gap-4 items-center">
              <input
                type="text"
                v-model="column.name"
                :placeholder="`Столбец ${index + 1}`"
                class="h-10 !border !border-gray-300 !rounded-xl px-3 py-2 text-sm w-full transition-colors duration-200"
              />
              <button
                class="w-24 px-3 py-2 text-white rounded-lg font-medium text-sm"
                :class="column.width === 1 ? 'bg-blue-500' : 'bg-red-500'"
                @click="toggleWidth(index)"
              >
                {{ column.width === 1 ? "Узкий" : "Широкий" }}
              </button>
            </div>
          </template>
          <div class="flex justify-start mt-6">
            <button
              class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center"
              @click="addColumn"
            >
              <i class="f7-icons">plus</i>
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7, f7Popover } from "framework7-vue";

interface Column {
  name: string;
  width: number;
}

const emit = defineEmits<{
  (e: "columns-saved", columns: Column[]): void;
}>();

const formError = ref("");

const columns = ref<Column[]>([
  { name: "", width: 1 },
  { name: "", width: 3 },
  { name: "", width: 1 },
  { name: "", width: 3 },
  { name: "", width: 1 },
  { name: "", width: 1 },
  { name: "", width: 1 },
]);

const openColumnConfigPopover = () => {
  f7.popover.open("#column-config-popover", "#column-config-button");
};

const closeColumnConfigPopover = () => {
  f7.popover.close("#column-config-popover");
  resetForm();
};

const addColumn = () => {
  columns.value.push({ name: "", width: 1 });
};

const toggleWidth = (index: number) => {
  columns.value[index].width = columns.value[index].width === 1 ? 3 : 1;
};

const validateForm = () => {
  const hasNamedColumn = columns.value.some((col) => col.name.trim() !== "");

  if (!hasNamedColumn) {
    formError.value = "Пожалуйста, укажите название хотя бы для одного столбца";
    return false;
  }

  formError.value = "";
  return true;
};

const handleSaveColumns = () => {
  if (!validateForm()) return;

  emit("columns-saved", columns.value);
  closeColumnConfigPopover();
};

const resetForm = () => {
  columns.value = [
    { name: "", width: 1 },
    { name: "", width: 3 },
    { name: "", width: 1 },
    { name: "", width: 3 },
    { name: "", width: 1 },
    { name: "", width: 1 },
    { name: "", width: 1 },
  ];
  formError.value = "";
};
</script>
