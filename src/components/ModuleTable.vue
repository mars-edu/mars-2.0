<!-- ModuleTable.vue -->
<template>
  <div class="overflow-x-auto">
    <table class="w-full border-collapse">
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
        <tr v-if="!modules.length">
          <td
            :colspan="columns.length"
            class="border border-border px-4 py-2 text-center text-muted-foreground"
          >
            Нет данных
          </td>
        </tr>
        <tr v-for="(module, rowIndex) in modules" :key="rowIndex">
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useColumnConfigStore } from "@/stores/columnConfig";
import { useModuleStore } from "@/stores/moduleStore";

const columnStore = useColumnConfigStore();
const moduleStore = useModuleStore();

const columns = computed(() => columnStore.columns);
const modules = computed(() => moduleStore.modules);
</script>
