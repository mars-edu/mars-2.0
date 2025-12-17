import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useSpecialtyStore } from "./specialtyStore";
import { useCourseStore } from "./courseStore";
import { useAcademicYearStore } from "./academicYearStore";
import { storeToRefs } from "pinia";
import { useClass9Store } from "./class9Store";
import { useSemesterStore } from "./semesterStore";
import { useAcademicYearSemesterStore } from "./academicYearSemesterStore";

export const useRupStore = defineStore(
  "rup",
  () => {
    const academicYearSemesterStore = useAcademicYearSemesterStore();
    const { getActiveAcademicYearSemester } = storeToRefs(
      academicYearSemesterStore
    );

    const selectedAcademicYearId = ref<string | null>(null);
    const selectedSpecialtyId = ref<string | null>(null);
    const selectedTeacherId = ref<string | null>(null);

    const selectedClass9ItemId = ref<string | null>(null);

    function setSelectedClass9ItemId(id: string | null) {
      selectedClass9ItemId.value = id;
    }

    const targetSpecialtyId = ref<string | null>(null);
    const targetAcademicYearId = ref<string | null>(null);

    function setSelectedAcademicYear(id: string | null) {
      selectedAcademicYearId.value = id;
      selectedSpecialtyId.value = null;
    }
    function setSelectedSpecialty(id: string | null) {
      selectedSpecialtyId.value = id;
    }
    function setSelectedTeacher(id: string | null) {
      selectedTeacherId.value = id;
    }
    function clearSelection() {
      selectedSpecialtyId.value = null;
    }

    function setTargetContext(
      specialtyId: string | null,
      academicYearId: string | null
    ) {
      targetSpecialtyId.value = specialtyId;
      targetAcademicYearId.value = academicYearId;
    }

    function clearTargetContext() {
      targetSpecialtyId.value = null;
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

    const selectedClass9Item = computed(() => {
      const class9Store = useClass9Store();
      if (!selectedClass9ItemId.value) return null;
      return class9Store.class9Items.find(
        (item) => item.id === selectedClass9ItemId.value
      );
    });

    const selectedClass9TotalHours = computed(() => {
      return selectedClass9Item.value?.totalHours ?? "0";
    });

    const selectedClass9SemesterHours = computed(() => {
      if (!selectedClass9Item.value) return "0";

      if (
        !getActiveAcademicYearSemester.value ||
        !getActiveAcademicYearSemester.value?.id
      )
        return "0";

      const sum = selectedClass9Item.value.distributionEntries
        .filter(
          (entry) =>
            entry.semesterId === getActiveAcademicYearSemester.value?.id
        )
        .filter((entry) => entry.hours && entry.hours.toString().trim() !== "")
        .reduce((acc, entry) => acc + Number(entry.hours), 0);

      return sum.toString();
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
      selectedTeacherId.value = null;
      targetSpecialtyId.value = null;
      targetAcademicYearId.value = null;
      selectedClass9ItemId.value = null;
      selectedClass9ItemIds.value = [];
      itemsForImport.value = [];
    }

    return {
      selectedAcademicYearId,
      selectedSpecialtyId,
      selectedTeacherId,
      targetSpecialtyId,
      targetAcademicYearId,
      setSelectedAcademicYear,
      setSelectedSpecialty,
      setSelectedTeacher,
      setTargetContext,
      clearTargetContext,
      clearSelection,
      selectedAcademicYear,
      selectedSpecialty,
      selectedClass9ItemIds,
      isClass9ItemSelected,
      toggleClass9ItemSelection,
      clearClass9Selection,
      itemsForImport,
      setItemsForImport,
      clearItemsForImport,

      selectedClass9ItemId,
      setSelectedClass9ItemId,
      selectedClass9Item,
      selectedClass9TotalHours,
      selectedClass9SemesterHours,
      reset,
    };
  },
  {}
);
