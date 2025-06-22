import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useSpecialtyStore } from "./specialtyStore";
import { useCourseStore } from "./courseStore";
import { storeToRefs } from "pinia";

export const useRupStore = defineStore(
  "rup",
  () => {
    const showOverlay = ref(false);
    const isOverlayVisible = computed(() => showOverlay.value);
    function show() {
      showOverlay.value = true;
    }
    function hide() {
      showOverlay.value = false;
    }
    function toggle() {
      showOverlay.value = !showOverlay.value;
    }

    const selectedSpecialtyId = ref<string | null>(null);
    const selectedCourseId = ref<string | null>(null);
    function setSelectedSpecialty(id: string | null) {
      selectedSpecialtyId.value = id;
      if (selectedCourseId.value) selectedCourseId.value = null;
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
      return courses.value.find(
        (course) => course.id === selectedCourseId.value
      );
    });
    const filteredCourses = computed(() => {
      const courseStore = useCourseStore();
      if (!selectedSpecialtyId.value) return [];
      return courseStore.getVisibleCourses;
    });

    const selectedClass9ItemIds = ref<string[]>([]);

    const isClass9ItemSelected = computed(() => {
      return (itemId: string) => selectedClass9ItemIds.value.includes(itemId);
    });

    function toggleClass9ItemSelection(itemId: string) {
      const index = selectedClass9ItemIds.value.indexOf(itemId);
      if (index > -1) {
        selectedClass9ItemIds.value.splice(index, 1);
      } else {
        selectedClass9ItemIds.value.push(itemId);
      }
    }

    function clearClass9Selection() {
      selectedClass9ItemIds.value = [];
    }

    return {
      showOverlay,
      isOverlayVisible,
      show,
      hide,
      toggle,
      selectedSpecialtyId,
      selectedCourseId,
      setSelectedSpecialty,
      setSelectedCourse,
      clearSelection,
      selectedSpecialty,
      selectedCourse,
      filteredCourses,
      selectedClass9ItemIds,
      isClass9ItemSelected,
      toggleClass9ItemSelection,
      clearClass9Selection,
    };
  },
  {
    serverSync: {
      enabled: false,
    },
  }
);
