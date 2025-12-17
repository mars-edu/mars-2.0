import { defineStore } from "pinia";
import { ref } from "vue";

export const useTabManagerStore = defineStore(
  "tabManager",
  () => {
    const isPrimaryTab = ref(false);

    function setPrimaryTab(isPrimary: boolean) {
      isPrimaryTab.value = isPrimary;
    }

    return {
      isPrimaryTab,
      setPrimaryTab,
    };
  },
  {}
);
