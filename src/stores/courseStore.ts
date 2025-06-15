import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Course {
  id: string;
  number: string;
  name?: string;
  admissionYear: string;
  isVisible?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const useCourseStore = defineStore(
  "course",
  () => {
    const courses = ref<Course[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Initialize with default courses if empty
    if (courses.value.length === 0) {
      courses.value = [
        {
          id: "1",
          number: "1",
          name: "1",
          specialtyId: "",
          isVisible: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "2",
          number: "2",
          name: "2",
          admissionYear: new Date().getFullYear().toString(),
          isVisible: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "3",
          number: "3",
          name: "3",
          admissionYear: new Date().getFullYear().toString(),
          isVisible: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "4",
          number: "4",
          name: "4",
          admissionYear: new Date().getFullYear().toString(),
          isVisible: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
    }

    const getCourseById = computed(() => {
      return (id: string) => courses.value.find((c) => c.id === id);
    });

    const getVisibleCourses = computed(() => {
      return courses.value.filter((c) => c.isVisible !== false);
    });

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
          isVisible: courseData.isVisible !== false,
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

    async function toggleCourseVisibility(id: string) {
      loading.value = true;
      try {
        const index = courses.value.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error("Course not found");
        }

        const updatedCourse = {
          ...courses.value[index],
          isVisible: !courses.value[index].isVisible,
          updatedAt: new Date(),
        };

        courses.value[index] = updatedCourse;
        error.value = null;
        return updatedCourse;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to toggle course visibility";
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
      getVisibleCourses,
      isLoading,
      getError,
      fetchCourses,
      addCourse,
      updateCourse,
      deleteCourse,
      toggleCourseVisibility,
      clearError,
    };
  },
  {
    persist: true,
  }
);
