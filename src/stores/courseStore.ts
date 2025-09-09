import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Course {
  id: string;
  number: string;
  admissionYear: string;
  semesters: string[];
  academicYearId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_COURSES = [
  {
    id: "1",
    number: "1",
    admissionYear: new Date().getFullYear().toString(),
    semesters: [],
    academicYearId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    number: "2",
    admissionYear: new Date().getFullYear().toString(),
    semesters: [],
    academicYearId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    number: "3",
    admissionYear: new Date().getFullYear().toString(),
    semesters: [],
    academicYearId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    number: "4",
    admissionYear: new Date().getFullYear().toString(),
    semesters: [],
    academicYearId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useCourseStore = defineStore(
  "course",
  () => {
    const courses = ref<Course[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const sortCourses = () => {
      courses.value.sort((a, b) => Number(a.number) - Number(b.number));
    };

    if (courses.value.length === 0) {
      courses.value = DEFAULT_COURSES;
    }
    sortCourses();

    const getCourseById = computed(() => {
      return (id: string) => courses.value.find((c) => c.id === id);
    });

    const getCoursesByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        courses.value.filter((c) => c.academicYearId === academicYearId);
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addCourse(
      courseData: Omit<Course, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newCourse: Course = {
          ...courseData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        courses.value.push(newCourse);
        sortCourses();
        error.value = null;
        return newCourse;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add course";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateCourse(
      id: string,
      courseData: Partial<Omit<Course, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        const index = courses.value.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error("Course not found");
        }

        const updatedCourse = {
          ...courses.value[index],
          ...courseData,
          updatedAt: new Date(),
        };

        courses.value[index] = updatedCourse;
        sortCourses();
        error.value = null;
        return updatedCourse;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update course";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteCourse(id: string) {
      loading.value = true;
      try {
        courses.value = courses.value.filter((c) => c.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete course";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      courses.value = [...DEFAULT_COURSES];
      loading.value = false;
      error.value = null;
      sortCourses();
    }

    return {
      courses,
      loading,
      error,
      getCourseById,
      getCoursesByAcademicYear,
      isLoading,
      getError,
      addCourse,
      updateCourse,
      deleteCourse,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
