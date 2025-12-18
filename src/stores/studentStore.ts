import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import Fuse from "fuse.js";
import { useAcademicYearStore } from "./academicYearStore";
import { useCourseStore, type Course } from "./courseStore";
import type {
  Student,
  StudentWithCourse,
  AddStudentPayload,
  StudentFilters,
} from "@/types/student";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export type { Student } from "@/types/student";

export const useStudentStore = defineStore("student", () => {
  const students = ref<Student[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<StudentFilters>({
    specialty: "",
    language: "",
    gender: "",
    base: "",
    academicYearId: "",
    searchTerm: "",
    course: "",
  });

  const academicYearStore = useAcademicYearStore();

  // Reactive subscription to Convex
  const { data: convexStudents } = useConvexQuery(
    api.students.queries.list,
    ref({})
  );

  watch(convexStudents, (newData) => {
    if (newData) {
      students.value = newData.map((student) => ({
        id: student._id,
        firstName: student.firstName,
        surname: student.surname,
        patronymic: student.patronymic,
        specialty: student.specialty,
        language: student.language,
        gender: student.gender,
        base: student.base,
        academicYearId: student.academicYearId,
      }));
    }
  });

  const getAllStudents = computed(() => students.value);

  const filteredStudents = computed((): StudentWithCourse[] => {
    let studentsToFilter: Student[] = [...students.value];

    studentsToFilter = studentsToFilter.filter((student) => {
      const specialtyMatch =
        !filters.value.specialty ||
        student.specialty === filters.value.specialty;
      const languageMatch =
        !filters.value.language || student.language === filters.value.language;
      const genderMatch =
        !filters.value.gender || student.gender === filters.value.gender;
      const baseMatch =
        !filters.value.base ||
        (student.base ?? 9).toString() === filters.value.base;
      const academicYearMatch =
        !filters.value.academicYearId ||
        student.academicYearId === filters.value.academicYearId;

      return (
        specialtyMatch &&
        languageMatch &&
        genderMatch &&
        baseMatch &&
        academicYearMatch
      );
    });

    let studentsWithCourse = studentsToFilter.map((student) => {
      const activeAcademicYear = academicYearStore.getActiveAcademicYear;
      const studentAcademicYear = academicYearStore.getAcademicYearById(
        student.academicYearId || ""
      );

      let course = 0;
      if (activeAcademicYear && studentAcademicYear) {
        const diff =
          activeAcademicYear.startYear - studentAcademicYear.startYear + 1;
        course = Math.max(0, diff);
      }

      return {
        ...student,
        course: course,
      };
    });

    if (filters.value.course) {
      studentsWithCourse = studentsWithCourse.filter(
        (student) => student.course.toString() === filters.value.course
      );
    }

    if (filters.value.searchTerm) {
      const studentsWithFio = studentsWithCourse.map((student) => ({
        ...student,
        fio: `${student.surname} ${student.firstName} ${student.patronymic}`,
      }));

      const fuse = new Fuse(studentsWithFio, {
        keys: ["surname", "firstName", "patronymic", "fio"],
        threshold: 0.3,
      });
      return fuse.search(filters.value.searchTerm).map((result) => result.item);
    }

    return studentsWithCourse;
  });

  const setFilter = (key: keyof StudentFilters, value: string) => {
    filters.value[key] = value;
  };

  const clearFilters = () => {
    filters.value = {
      specialty: "",
      language: "",
      gender: "",
      base: "",
      academicYearId: "",
      searchTerm: "",
      course: "",
    };
  };

  const addStudent = async (payload: AddStudentPayload) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Use Convex - reactive subscription will automatically update the list
      await convex.mutation(api.students.mutations.create, {
        firstName: payload.firstName,
        surname: payload.surname,
        patronymic: payload.patronymic,
        specialty: payload.specialty,
        language: payload.language,
        gender: payload.gender,
        base: payload.base,
        academicYearId: payload.academicYearId,
      });
      // No need to manually push - the watch on convexStudents handles it
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to add student";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const updateStudent = async (
    id: string,
    payload: Partial<Omit<Student, "id">>
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Use Convex - reactive subscription will automatically update the list
      await convex.mutation(api.students.mutations.update, {
        id: id as any,
        firstName: payload.firstName,
        surname: payload.surname,
        patronymic: payload.patronymic,
        specialty: payload.specialty,
        language: payload.language,
        gender: payload.gender as any,
        base: payload.base,
        academicYearId: payload.academicYearId,
      });
      // No need to manually update - the watch on convexStudents handles it
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to update student";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Use Convex - the reactive subscription will handle updating the local state
      await convex.mutation(api.students.mutations.remove, {
        id: id as any,
      });
      // Don't filter students.value - the reactive subscription will handle it
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to delete student";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const loadFromBackend = async () => {
    isLoading.value = true;
    try {
      const data = await convex.query(api.students.queries.list, {});
      students.value = data.map((student) => ({
        id: student._id,
        firstName: student.firstName,
        surname: student.surname,
        patronymic: student.patronymic,
        specialty: student.specialty,
        language: student.language,
        gender: student.gender,
        base: student.base,
        academicYearId: student.academicYearId,
      }));
      error.value = null;
    } catch (err) {
      console.error("[studentStore] Failed to load from Convex:", err);
      error.value = "Failed to load students";
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    students.value = [];
    isLoading.value = false;
    error.value = null;
    filters.value = {
      specialty: "",
      language: "",
      gender: "",
      base: "",
      academicYearId: "",
      searchTerm: "",
      course: "",
    };
  };

  const getError = computed(() => error.value);

  const getCourseByStudentId = (id: string): number | null => {
    const student = students.value.find((s) => s.id === id);
    if (!student) return null;

    const activeAcademicYear = academicYearStore.getActiveAcademicYear;
    const studentAcademicYear = academicYearStore.getAcademicYearById(
      student.academicYearId || ""
    );

    if (activeAcademicYear && studentAcademicYear) {
      const diff =
        activeAcademicYear.startYear - studentAcademicYear.startYear + 1;
      return Math.max(0, diff);
    }

    return null;
  };

  const getStudentFullName = (idOrName: string): string => {
    const student = students.value.find((s) => s.id === idOrName);
    if (!student) return idOrName;
    return `${student.surname} ${student.firstName} ${student.patronymic}`;
  };

  return {
    students,
    isLoading,
    filters,
    getAllStudents,
    filteredStudents,
    setFilter,
    clearFilters,
    addStudent,
    updateStudent,
    deleteStudent,
    clearError,
    reset,
    getError,
    getCourseByStudentId,
    getStudentFullName,
    loadFromBackend,
  };
}, {
  persist: true,
});
