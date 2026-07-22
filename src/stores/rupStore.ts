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

    function reset() {
      selectedAcademicYearId.value = null;
      selectedSpecialtyId.value = null;
      selectedTeacherId.value = null;
      selectedRupEntryId.value = null;
    }

    return {
      selectedAcademicYearId,
      selectedSpecialtyId,
      selectedTeacherId,
      setSelectedAcademicYear,
      setSelectedSpecialty,
      setSelectedTeacher,
      selectedAcademicYear,
      selectedSpecialty,

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
