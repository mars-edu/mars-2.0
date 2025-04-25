<!-- ModuleTable.vue -->
<template>
  <div class="relative overflow-visible z-50" v-if="columns.length > 0">
    <!-- <ColumnConfigForm>
      <template #trigger="{ open }">
        <button
          class="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded-full shadow-lg absolute z-50 hover:bg-green-600 transition-colors"
          style="top: -18px; right: -18px"
          type="button"
          @click="open"
        >
          <f7-icon ios="f7:plus" md="material:add" size="18px" />
        </button>
      </template>
    </ColumnConfigForm> -->
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
            class="border border-border px-4 py-2"
          >
            {{ module[`field${colIndex}`] || "-" }}
          </td>
        </tr>
      </tbody>
    </table>
    <AddModuleTemplateButton :specialty-id="specialtyId" :course-id="courseId">
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
import { computed } from "vue";
import { useColumnConfigStore } from "@/stores/columnConfig";
import { useModuleStore } from "@/stores/moduleStore";
import { f7Button, f7Icon } from "framework7-vue";
import ColumnConfigForm from "@/components/ColumnConfigForm.vue";
import AddModuleTemplateButton from "@/components/AddModuleTemplateButton.vue";

const props = defineProps<{
  specialtyId: string;
  courseId: string;
}>();

const columnStore = useColumnConfigStore();
const moduleStore = useModuleStore();

const columns = computed(() => {
  const courseColumns = columnStore.getColumnsForCourse(props.courseId);
  return courseColumns;
});
const filteredModules = computed(() =>
  moduleStore.getModulesBySpecialtyAndCourse(props.specialtyId, props.courseId)
);
</script>
