<template>
  <div>
    <button
      id="column-config-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-green-500 md:text-primary hover:bg-primary/10 rounded-lg transition-colors"
      aria-label="Configure Columns"
      type="button"
      @click.stop="openColumnConfigPopover"
    >
      <f7-icon
        ios="f7:gear"
        md="material:settings"
        size="16px"
        class="md:text-blue-500"
      ></f7-icon>
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
            <div class="grid grid-cols-[1fr,auto,auto] gap-4 items-center">
              <f7-input
                type="text"
                :value="column.name"
                @input="(e: any) => {
                  const newColumns = [...columnStore.columns];
                  newColumns[index].name = e.target.value;
                  columnStore.setColumns(newColumns);
                }"
                placeholder="Столбец"
              />
              <button
                class="w-24 px-3 py-2 bg-[#007aff] text-white rounded-[10px] font-medium text-[15px]"
                @click="toggleWidth(index)"
              >
                {{ column.width === 1 ? "Узкий" : "Широкий" }}
              </button>
              <button
                class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                @click="deleteColumn(index)"
                :disabled="columns.length <= 1"
              >
                <i class="f7-icons text-xs">trash</i>
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
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import { useColumnConfigStore } from "@/stores/columnConfig";

interface Column {
  name: string;
  width: number;
}

const emit = defineEmits<{
  (e: "columns-saved", columns: Column[]): void;
}>();

const formError = ref("");
const columnStore = useColumnConfigStore();

const columns = computed({
  get: () => columnStore.columns,
  set: (value) => columnStore.setColumns(value),
});

const openColumnConfigPopover = () => {
  f7.popover.open("#column-config-popover", "#column-config-button");
};

const closeColumnConfigPopover = () => {
  f7.popover.close("#column-config-popover");
  resetForm();
};

const addColumn = () => {
  columnStore.setColumns([...columns.value, { name: "", width: 1 }]);
};

const toggleWidth = (index: number) => {
  const newColumns = [...columns.value];
  newColumns[index].width = newColumns[index].width === 1 ? 3 : 1;
  columnStore.setColumns(newColumns);
};

const deleteColumn = (index: number) => {
  if (columns.value.length > 1) {
    const newColumns = [...columns.value];
    newColumns.splice(index, 1);
    columnStore.setColumns(newColumns);
  }
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
  columnStore.resetColumns();
  formError.value = "";
};
</script>
