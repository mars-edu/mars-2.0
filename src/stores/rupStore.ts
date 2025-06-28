import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useSpecialtyStore } from "./specialtyStore";
import { useCourseStore } from "./courseStore";
import { useAcademicYearStore } from "./academicYearStore";
import { storeToRefs } from "pinia";

export const useRupStore = defineStore(
  "rup",
  () => {
    const selectedAcademicYearId = ref<string | null>(null);
    const selectedSpecialtyId = ref<string | null>(null);
    const selectedCourseId = ref<string | null>(null);

    const targetSpecialtyId = ref<string | null>(null);
    const targetCourseId = ref<string | null>(null);
    const targetAcademicYearId = ref<string | null>(null);

    function setSelectedAcademicYear(id: string | null) {
      selectedAcademicYearId.value = id;
      selectedSpecialtyId.value = null;
      selectedCourseId.value = null;
    }
    function setSelectedSpecialty(id: string | null) {
      selectedSpecialtyId.value = id;
      if (selectedCourseId.value) selectedCourseId.value = null;
    }
    function setSelectedCourse(id: string | null) {
      selectedCourseId.value = id;
    }
    function clearSelection() {
      // selectedAcademicYearId.value = null;
      selectedSpecialtyId.value = null;
      selectedCourseId.value = null;
    }

    function setTargetContext(
      specialtyId: string | null,
      courseId: string | null,
      academicYearId: string | null
    ) {
      targetSpecialtyId.value = specialtyId;
      targetCourseId.value = courseId;
      targetAcademicYearId.value = academicYearId;
    }

    function clearTargetContext() {
      targetSpecialtyId.value = null;
      targetCourseId.value = null;
      targetAcademicYearId.value = null;
    }

    const selectedAcademicYear = computed(() => {
      const academicYearStore = useAcademicYearStore();
      const { academicYears } = storeToRefs(academicYearStore);
      if (!selectedAcademicYearId.value) return null;
      return academicYears.value.find(
        (year) => year.id === selectedAcademicYearId.value
      );
    });

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
      return courseStore.courses;
    });

    const itemsForImport = ref<any[]>([]);
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

    function setItemsForImport(items: any[]) {
      itemsForImport.value = items;
    }

    function clearItemsForImport() {
      itemsForImport.value = [];
    }

    function reset() {
      selectedAcademicYearId.value = null;
      selectedSpecialtyId.value = null;
      selectedCourseId.value = null;
      targetSpecialtyId.value = null;
      targetCourseId.value = null;
      targetAcademicYearId.value = null;
      selectedClass9ItemIds.value = [];
      itemsForImport.value = [];
    }

    return {
      selectedAcademicYearId,
      selectedSpecialtyId,
      selectedCourseId,
      targetSpecialtyId,
      targetCourseId,
      targetAcademicYearId,
      setSelectedAcademicYear,
      setSelectedSpecialty,
      setSelectedCourse,
      setTargetContext,
      clearTargetContext,
      clearSelection,
      selectedAcademicYear,
      selectedSpecialty,
      selectedCourse,
      filteredCourses,
      selectedClass9ItemIds,
      isClass9ItemSelected,
      toggleClass9ItemSelection,
      clearClass9Selection,
      itemsForImport,
      setItemsForImport,
      clearItemsForImport,
      reset,
    };
  },
  {
    serverSync: {
      enabled: false,
    },
  }
);
