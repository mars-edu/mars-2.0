import { defineStore } from "pinia";
import { ref } from "vue";

interface Column {
  name: string;
  width: number;
}

const defaultColumns: Column[] = [
  { name: "", width: 1 },
  { name: "", width: 3 },
  { name: "", width: 1 },
];

export const useColumnConfigStore = defineStore(
  "columnConfig",
  () => {
    const columns = ref<Column[]>(defaultColumns);

    function setColumns(newColumns: Column[]) {
      columns.value = newColumns;
    }

    function resetColumns() {
      columns.value = [...defaultColumns];
    }

    function addColumn() {
      columns.value.push({ name: "", width: 1 });
    }

    return {
      columns,
      setColumns,
      resetColumns,
      addColumn,
    };
  },
  {
    persist: true,
  }
);
