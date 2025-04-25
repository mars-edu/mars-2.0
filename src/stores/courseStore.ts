import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Course {
  id: string;
  number: string;
  admissionYear: string;
  specialtyId: string;
  specialtyCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useCourseStore = defineStore(
  "course",
  () => {
    const courses = ref<Course[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getCourseById = computed(() => {
      return (id: string) => courses.value.find((c) => c.id === id);
    });

    const getCoursesBySpecialtyId = computed(() => {
      return (specialtyId: string) =>
        courses.value.filter((c) => c.specialtyId === specialtyId);
    });

    const getAllCourses = computed(() => courses.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function fetchCourses() {
      loading.value = true;
      try {
        // Data will be automatically loaded by Pinia persistence
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to load courses";
      } finally {
        loading.value = false;
      }
    }

    async function addCourse(
      courseData: Omit<Course, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newCourse: Course = {
          ...courseData,
          specialtyCode: courseData.specialtyCode || "",
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        courses.value.push(newCourse);
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

    return {
      courses,
      loading,
      error,
      getCourseById,
      getCoursesBySpecialtyId,
      getAllCourses,
      isLoading,
      getError,
      fetchCourses,
      addCourse,
      updateCourse,
      deleteCourse,
      clearError,
    };
  },
  {
    persist: true,
  }
);
