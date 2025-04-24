<template>
  <div>
    <slot name="trigger" :open="openColumnConfigPopover"></slot>
    <f7-popover
      id="column-config-popover"
      style="width: 600px !important"
      :target="popoverTarget"
      close-on-escape
    >
      <div class="column-config-popover bg-card text-card-foreground">
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
                v-model:value="columns[index].name"
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
import { ref, computed, onMounted } from "vue";
import { f7 } from "framework7-vue";
import { useColumnConfigStore } from "@/stores/columnConfig";
import { z } from "zod";

interface Column {
  name: string;
  width: number;
}

const emit = defineEmits<{
  (e: "columns-saved", columns: Column[]): void;
}>();

const columnStore = useColumnConfigStore();

const columnSchema = z.object({
  columns: z
    .array(
      z.object({
        name: z.string(),
        width: z.number().min(1).max(3),
      })
    )
    .refine(
      (columns) => columns.some((col) => col.name.trim() !== ""),
      "Пожалуйста, укажите название хотя бы для одного столбца"
    ),
});

const columns = computed({
  get: () => columnStore.columns,
  set: (value) => columnStore.setColumns(value),
});

const formError = computed(() => {
  const result = columnSchema.safeParse({ columns: columns.value });
  if (!result.success) {
    return result.error.issues[0].message;
  }
  return "";
});

const popoverTarget = ref<string | HTMLElement>("#column-config-button");

const openColumnConfigPopover = (event?: Event) => {
  if (event && event.currentTarget) {
    popoverTarget.value = event.currentTarget as HTMLElement;
    f7.popover.open("#column-config-popover", event.currentTarget);
  } else {
    popoverTarget.value = "#column-config-button";
    f7.popover.open("#column-config-popover", "#column-config-button");
  }
};

const closeColumnConfigPopover = () => {
  f7.popover.close("#column-config-popover");
};

const handleCancel = () => {
  resetForm();
  closeColumnConfigPopover();
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

const handleSaveColumns = () => {
  const validationResult = columnSchema.safeParse({ columns: columns.value });
  if (!validationResult.success) return;

  emit("columns-saved", columns.value);
  closeColumnConfigPopover();
};

const resetForm = () => {
  columnStore.resetColumns();
};
</script>
