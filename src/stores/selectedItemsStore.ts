import { defineStore } from "pinia";
import { ref } from "vue";

export const useSelectedItemsStore = defineStore("selectedItems", () => {
  const selectedSpecialtyId = ref<string | null>(null);
  const selectedCourseId = ref<string | null>(null);

  function setSelectedSpecialty(id: string | null) {
    selectedSpecialtyId.value = id;
    if (selectedCourseId.value) {
      selectedCourseId.value = null;
    }
  }

  function setSelectedCourse(id: string | null) {
    selectedCourseId.value = id;
  }

  function clearSelection() {
    selectedSpecialtyId.value = null;
    selectedCourseId.value = null;
  }

  return {
    selectedSpecialtyId,
    selectedCourseId,
    setSelectedSpecialty,
    setSelectedCourse,
    clearSelection,
  };
});
