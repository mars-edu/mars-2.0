import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useSpecialtyStore } from "./specialtyStore";
import { useCourseStore } from "./courseStore";

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

  const selectedSpecialty = computed(() => {
    const specialtyStore = useSpecialtyStore();
    if (!selectedSpecialtyId.value) return null;
    return specialtyStore.getAllSpecialties.find(
      (specialty) => specialty.id === selectedSpecialtyId.value
    );
  });

  const selectedCourse = computed(() => {
    const courseStore = useCourseStore();
    if (!selectedCourseId.value) return null;
    return courseStore.getAllCourses.find(
      (course) => course.id === selectedCourseId.value
    );
  });

  const filteredCourses = computed(() => {
    const courseStore = useCourseStore();
    if (!selectedSpecialtyId.value) return [];
    return courseStore.getCoursesBySpecialtyId(selectedSpecialtyId.value);
  });

  return {
    selectedSpecialtyId,
    selectedCourseId,
    selectedSpecialty,
    selectedCourse,
    filteredCourses,
    setSelectedSpecialty,
    setSelectedCourse,
    clearSelection,
  };
});
