import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useSpecialtyStore } from "./specialtyStore";
import { useCourseStore } from "./courseStore";
import { useClass9Store } from "./class9Store";
import { storeToRefs } from "pinia";

export const useSelectedItemsStore = defineStore("selectedItems", () => {
  const selectedSpecialtyId = ref<string | null>(null);
  const selectedCourseId = ref<string | null>(null);
  const selectedClass9ItemId = ref<string | null>(null);

  function setSelectedSpecialty(id: string | null) {
    selectedSpecialtyId.value = id;
    if (selectedCourseId.value) {
      selectedCourseId.value = null;
    }
  }

  function setSelectedCourse(id: string | null) {
    selectedCourseId.value = id;
  }

  function setSelectedClass9ItemId(id: string | null) {
    selectedClass9ItemId.value = id;
  }

  function clearSelection() {
    selectedSpecialtyId.value = null;
    selectedCourseId.value = null;
    selectedClass9ItemId.value = null;
  }

  function reset() {
    selectedSpecialtyId.value = null;
    selectedCourseId.value = null;
    selectedClass9ItemId.value = null;
  }

  const selectedSpecialty = computed(() => {
    const specialtyStore = useSpecialtyStore();
    const { specialties } = storeToRefs(specialtyStore);
    if (!selectedSpecialtyId.value) return null;
    return specialties.value.find(
      (specialty) => specialty.id === selectedSpecialtyId.value
    );
  });

  const selectedCourse = computed(() => {
    const courseStore = useCourseStore();
    const { courses } = storeToRefs(courseStore);
    if (!selectedCourseId.value) return null;
    return courses.value.find((course) => course.id === selectedCourseId.value);
  });

  const selectedClass9Item = computed(() => {
    const class9Store = useClass9Store();
    if (!selectedClass9ItemId.value) return null;
    return class9Store.class9Items.find(
      (item) => item.id === selectedClass9ItemId.value
    );
  });

  return {
    selectedSpecialtyId,
    selectedCourseId,
    selectedClass9ItemId,
    selectedSpecialty,
    selectedCourse,
    selectedClass9Item,
    setSelectedSpecialty,
    setSelectedCourse,
    setSelectedClass9ItemId,
    clearSelection,
    reset,
  };
});
