import { defineStore } from "pinia";

interface Column {
  name: string;
  width: number;
}

export const useColumnConfigStore = defineStore("columnConfig", {
  state: () => ({
    columns: [
      { name: "", width: 1 },
      { name: "", width: 3 },
      { name: "", width: 1 },
    ] as Column[],
  }),

  actions: {
    setColumns(newColumns: Column[]) {
      this.columns = newColumns;
    },

    resetColumns() {
      this.columns = [
        { name: "", width: 1 },
        { name: "", width: 3 },
        { name: "", width: 1 },
      ];
    },
  },
});
