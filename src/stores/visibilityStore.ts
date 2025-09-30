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
  {
    // As requested by the user, disable server sync for this store.
    serverSync: {
      enabled: false,
    },
  }
);
