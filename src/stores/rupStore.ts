import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useSpecialtyStore } from "./specialtyStore";
import { useCourseStore } from "./courseStore";
import { useAcademicYearStore } from "./academicYearStore";
import { storeToRefs } from "pinia";
import { useRupEntryStore } from "./rupEntryStore";
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

    const selectedRupEntryId = ref<string | null>(null);

    function setSelectedRupEntryId(id: string | null) {
      selectedRupEntryId.value = id;
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

    const selectedRupEntry= computed(() => {
      const rupEntryStore = useRupEntryStore();
      if (!selectedRupEntryId.value) return null;
      return rupEntryStore.rupEntries.find(
        (item) => item.id === selectedRupEntryId.value
      );
    });

    const selectedRupEntryTotalHours = computed(() => {
      return selectedRupEntry.value?.totalHours ?? "0";
    });

    const selectedRupEntrySemesterHours = computed(() => {
      if (!selectedRupEntry.value) return "0";

      if (
        !getActiveAcademicYearSemester.value ||
        !getActiveAcademicYearSemester.value?.id
      )
        return "0";

      const sum = selectedRupEntry.value.distributionEntries
        .filter(
          (entry: any) =>
            entry.semesterId === getActiveAcademicYearSemester.value?.id
        )
        .filter((entry: any) => entry.hours && entry.hours.toString().trim() !== "")
        .reduce((acc: number, entry: any) => acc + Number(entry.hours), 0);

      return sum.toString();
    });

    const itemsForImport = ref<any[]>([]);
    const selectedRupEntryIds = ref<string[]>([]);

    const isRupEntrySelected = computed(() => {
      return (itemId: string) => selectedRupEntryIds.value.includes(itemId);
    });

    function toggleRupEntrySelection(itemId: string) {
      const index = selectedRupEntryIds.value.indexOf(itemId);
      if (index > -1) {
        selectedRupEntryIds.value.splice(index, 1);
      } else {
        selectedRupEntryIds.value.push(itemId);
      }
    }

    function clearRupEntrySelection() {
      selectedRupEntryIds.value = [];
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
      selectedRupEntryId.value = null;
      selectedRupEntryIds.value = [];
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
      selectedRupEntryIds,
      isRupEntrySelected,
      toggleRupEntrySelection,
      clearRupEntrySelection,
      itemsForImport,
      setItemsForImport,
      clearItemsForImport,

      selectedRupEntryId,
      setSelectedRupEntryId,
      selectedRupEntry,
      selectedRupEntryTotalHours,
      selectedRupEntrySemesterHours,
      reset,
    };
  },
  {}
);
