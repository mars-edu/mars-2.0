import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useSpecialtyStore } from "./specialtyStore";
import { useCourseStore } from "./courseStore";
import { useRupEntryStore } from "./rupEntryStore";
import { storeToRefs } from "pinia";

export const useSelectedItemsStore = defineStore("selectedItems", () => {
  const selectedAcademicYearId = ref<string | null>(null);
  const selectedSpecialtyId = ref<string | null>(null);
  const selectedCourseId = ref<string | null>(null);
  const selectedRupEntryId = ref<string | null>(null);

  // Journal page filters — persisted across navigation (list ↔ detail)
  const selectedJournalSemesterId = ref<string>("");
  const selectedJournalFilter = ref<string>("all");
  function setSelectedAcademicYear(id: string | null) {
    selectedAcademicYearId.value = id;
  }

  function setSelectedSpecialty(id: string | null) {
    selectedSpecialtyId.value = id;
    if (selectedCourseId.value) {
      selectedCourseId.value = null;
    }
  }

  function setSelectedCourse(id: string | null) {
    selectedCourseId.value = id;
  }

  function setSelectedRupEntryId(id: string | null) {
    selectedRupEntryId.value = id;
  }

  function setSelectedJournalSemester(id: string) {
    selectedJournalSemesterId.value = id;
  }

  function setSelectedJournalFilter(filter: string) {
    selectedJournalFilter.value = filter;
  }

  function clear() {
    selectedAcademicYearId.value = null;
    selectedSpecialtyId.value = null;
    selectedCourseId.value = null;
    selectedRupEntryId.value = null;
    selectedJournalSemesterId.value = "";
    selectedJournalFilter.value = "all";
  }

  function reset() {
    selectedAcademicYearId.value = null;
    selectedSpecialtyId.value = null;
    selectedCourseId.value = null;
    selectedRupEntryId.value = null;
    selectedJournalSemesterId.value = "";
    selectedJournalFilter.value = "all";
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

  const selectedRupEntry = computed(() => {
    const rupEntryStore = useRupEntryStore();
    if (!selectedRupEntryId.value) return null;
    return rupEntryStore.rupEntries.find(
      (item) => item.id === selectedRupEntryId.value
    );
  });

  return {
    selectedAcademicYearId,
    selectedSpecialtyId,
    selectedCourseId,
    selectedRupEntryId,
    selectedJournalSemesterId,
    selectedJournalFilter,
    setSelectedAcademicYear,
    selectedSpecialty,
    selectedCourse,
    selectedRupEntry,
    setSelectedSpecialty,
    setSelectedCourse,
    setSelectedRupEntryId,
    setSelectedJournalSemester,
    setSelectedJournalFilter,
    clear,
    reset,
  };
});
