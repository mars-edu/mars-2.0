<!-- ModuleTable.vue -->
<template>
  <div class="relative overflow-visible z-50" v-if="columns.length > 0">
    <div class="mb-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <button
          class="text-sm bg-primary text-white px-3 py-1.5 rounded-md flex items-center gap-1.5"
          @click="enterEditMode"
          :class="{ 'bg-destructive': isEditMode }"
        >
          <f7-icon ios="f7:pencil" md="material:edit" size="16px" />
          {{
            isEditMode ? "Закончить редактирование" : "Редактировать таблицу"
          }}
        </button>
      </div>
      <ColumnConfigForm>
        <template #trigger="{ open }">
          <button
            class="text-sm bg-muted text-muted-foreground px-3 py-1.5 rounded-md flex items-center gap-1.5 hover:bg-muted/80 transition-colors"
            type="button"
            @click="open"
          >
            <f7-icon ios="f7:table" md="material:table_chart" size="16px" />
            Настроить столбцы
          </button>
        </template>
      </ColumnConfigForm>
    </div>

    <table ref="tableRef" class="w-full border-collapse relative">
      <thead>
        <tr>
          <th
            v-for="(column, index) in columns"
            :key="index"
            class="border border-border px-4 py-2 bg-muted text-left"
            :class="{ 'w-48': column.width === 1, 'w-96': column.width === 3 }"
          >
            {{ column.name || "Столбец" }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="!filteredModules.length">
          <td
            :colspan="columns.length"
            class="border border-border px-4 py-2 text-center text-muted-foreground"
          >
            Нет данных
          </td>
        </tr>
        <tr v-for="(module, rowIndex) in filteredModules" :key="module.id">
          <td
            v-for="(column, colIndex) in columns"
            :key="colIndex"
            class="border border-border px-4 py-2 transition-colors group"
            :class="{
              'bg-primary/10 ring-1 ring-primary': isEditingCell(
                module.id,
                colIndex
              ),
              'bg-primary/5': editedCells[`${module.id}-${colIndex}`],
              'cursor-pointer hover:bg-muted/30': isEditMode,
            }"
            @click="isEditMode && startEditing(module.id, colIndex)"
          >
            <div v-if="isEditingCell(module.id, colIndex)" class="w-full">
              <div class="flex items-center w-full">
                <input
                  type="text"
                  :value="module[`field${colIndex}`]"
                  @input="
                    updateCellValue(
                      ($event.target as HTMLInputElement).value,
                      module.id,
                      colIndex
                    )
                  "
                  @keyup.enter="stopEditing(true)"
                  @keyup.esc="stopEditing(false)"
                  @blur="stopEditing(true)"
                  autocomplete="off"
                  class="flex-1 focus:outline-none bg-transparent !text-black cell-input"
                  :data-cell-id="`cell-${module.id}-${colIndex}`"
                />
                <button
                  v-if="module[`field${colIndex}`]"
                  class="rounded-full hover:bg-muted/50"
                  @click.stop="clearCellValue(module.id, colIndex)"
                  type="button"
                >
                  <f7-icon
                    ios="f7:xmark_circle"
                    md="material:cancel"
                    size="18px"
                    class="text-muted-foreground"
                  />
                </button>
              </div>
            </div>
            <div v-else class="flex items-center justify-between">
              <span
                :class="{
                  'text-muted-foreground italic w-full ':
                    !module[`field${colIndex}`],
                }"
              >
                {{ module[`field${colIndex}`] }}
              </span>
              <button
                v-if="isEditMode && module[`field${colIndex}`]"
                class="rounded-full opacity-0 group-hover:opacity-100 hover:bg-muted/50 transition-opacity w-fit"
                @click.stop="clearCellValue(module.id, colIndex)"
                type="button"
              >
                <f7-icon
                  ios="f7:xmark_circle"
                  md="material:cancel"
                  size="16px"
                  class="text-muted-foreground"
                />
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <AddModuleTemplateButton
      :specialty-id="selectedSpecialtyId || ''"
      :course-id="selectedCourseId || ''"
    >
      <template #trigger="{ open }">
        <button
          class="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full shadow-lg absolute z-50 hover:bg-green-600 transition-colors"
          style="bottom: -18px; left: 50%; transform: translateX(-50%)"
          type="button"
          @click="open"
        >
          <f7-icon ios="f7:plus" md="material:add" size="18px" />
        </button>
      </template>
    </AddModuleTemplateButton>
  </div>
  <div v-else>
    <div class="text-muted-foreground flex items-center justify-center gap-2">
      Нажмите на кнопку "+" чтобы настроить таблицу
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, reactive } from "vue";
import { useColumnConfigStore } from "@/stores/columnConfig";
import { useModuleStore } from "@/stores/moduleStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { f7Button, f7Icon } from "framework7-vue";
import ColumnConfigForm from "@/components/ColumnConfigForm.vue";
import AddModuleTemplateButton from "@/components/AddModuleTemplateButton.vue";
import { f7 } from "framework7-vue";

const columnStore = useColumnConfigStore();
const moduleStore = useModuleStore();
const selectedItemsStore = useSelectedItemsStore();

const selectedSpecialtyId = computed(
  () => selectedItemsStore.selectedSpecialtyId
);
const selectedCourseId = computed(() => selectedItemsStore.selectedCourseId);

const columns = computed(() => {
  if (!selectedCourseId.value) return [];
  const courseColumns = columnStore.getColumnsForCourse(selectedCourseId.value);
  return courseColumns;
});

const filteredModules = computed(() => {
  if (!selectedSpecialtyId.value || !selectedCourseId.value) return [];
  return moduleStore.getModulesBySpecialtyAndCourse(
    selectedSpecialtyId.value,
    selectedCourseId.value
  );
});


const isEditMode = ref(false);

const enterEditMode = () => {
  isEditMode.value = !isEditMode.value;
  if (!isEditMode.value) {
    
    stopEditing(true);
  }

  f7.toast.show({
    text: isEditMode.value
      ? "Режим редактирования включен"
      : "Режим редактирования выключен",
    position: "bottom",
    cssClass: "bg-primary text-white",
    closeTimeout: 2000,
  });
};


const editingCell = ref<{
  moduleId: string | null;
  columnIndex: number | null;
}>({
  moduleId: null,
  columnIndex: null,
});
const editedCells = reactive<Record<string, boolean>>({});
const currentValue = ref<string>("");

const isEditingCell = (moduleId: string, columnIndex: number) => {
  return (
    editingCell.value.moduleId === moduleId &&
    editingCell.value.columnIndex === columnIndex
  );
};

const startEditing = (moduleId: string, columnIndex: number) => {
  if (!isEditMode.value) return;

  const module = filteredModules.value.find((m) => m.id === moduleId);
  if (module) {
    currentValue.value = module[`field${columnIndex}`] || "";
    editingCell.value = { moduleId, columnIndex };

    
    nextTick(() => {
      const cellId = `cell-${moduleId}-${columnIndex}`;
      const inputElement = document.querySelector(`[data-cell-id="${cellId}"]`);
      if (inputElement) {
        (inputElement as HTMLInputElement).focus();
      }
    });
  }
};

const stopEditing = (save: boolean) => {
  if (
    save &&
    editingCell.value.moduleId &&
    editingCell.value.columnIndex !== null
  ) {
    const key = `${editingCell.value.moduleId}-${editingCell.value.columnIndex}`;
    editedCells[key] = true;

    f7.toast.show({
      text: "Изменения сохранены",
      position: "bottom",
      cssClass: "bg-primary text-white",
      closeTimeout: 2000,
    });
  }
  editingCell.value = { moduleId: null, columnIndex: null };
};

const updateCellValue = (
  value: string,
  moduleId: string,
  columnIndex: number
) => {
  moduleStore.updateModuleField(moduleId, `field${columnIndex}`, value);
};

const clearCellValue = (moduleId: string, columnIndex: number) => {
  moduleStore.updateModuleField(moduleId, `field${columnIndex}`, "");
  const key = `${moduleId}-${columnIndex}`;
  editedCells[key] = true;
  f7.toast.show({
    text: "Ячейка очищена",
    position: "bottom",
    cssClass: "bg-primary text-white",
    closeTimeout: 2000,
  });
};
</script>
