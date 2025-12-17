import { defineStore } from "pinia";
import { ref } from "vue";

export const useVisibilityStore = defineStore(
  "visibility",
  () => {
    const isTabActive = ref(true);

    function setTabActive(status: boolean) {
      isTabActive.value = status;
    }

    return {
      isTabActive,
      setTabActive,
    };
  },
  {}
);
