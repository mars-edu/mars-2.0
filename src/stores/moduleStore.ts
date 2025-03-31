import { defineStore } from "pinia";

interface Module {
  [key: string]: string;
}

export const useModuleStore = defineStore("module", {
  state: () => ({
    modules: [] as Module[],
  }),

  actions: {
    addModule(module: Module) {
      this.modules.push(module);
    },

    removeModule(index: number) {
      this.modules.splice(index, 1);
    },

    clearModules() {
      this.modules = [];
    },
  },
});
