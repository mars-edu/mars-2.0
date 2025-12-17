import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex, useConvexFeatures } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface Course {
  id: string;
  number: string;
  admissionYear: string;
  semesters: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_COURSES: Course[] = [];

export const useCourseStore = defineStore(
  "course",
  () => {
    const courses = ref<Course[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const sortCourses = () => {
      courses.value.sort((a, b) => Number(a.number) - Number(b.number));
    };

    // Reactive subscription to Convex
    if (useConvexFeatures() && convex) {
      const { data: convexCourses } = useConvexQuery(
        api.courses.queries.list,
        ref({})
      );

      watch(convexCourses, (newData) => {
        if (newData) {
          courses.value = newData.map((c) => ({
            id: c._id,
            number: c.number,
            admissionYear: c.name || "",
            semesters: c.semesters || [],
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          }));
          sortCourses();
        }
      });
    } else if (courses.value.length === 0) {
      courses.value = DEFAULT_COURSES;
      sortCourses();
    }

    const getCourseById = computed(() => {
      return (id: string) => courses.value.find((c) => c.id === id);
    });

    const getCoursesByAcademicYear = computed(() => {
      return (academicYearId: string) => courses.value; // All courses are now global
    });

    const courseOptions = computed(() =>
      courses.value.map((c) => ({
        value: c.number,
        text: `Курс ${c.number}`,
      }))
    );

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addCourse(
      courseData: Omit<
        Course,
        "id" | "createdAt" | "updatedAt" | "academicYearId"
      >
    ) {
      loading.value = true;
      try {
        if (useConvexFeatures() && convex) {
          // Use Convex - reactive subscription will automatically update the list
          await convex.mutation(api.courses.mutations.create, {
            number: courseData.number,
            name: courseData.admissionYear,
            semesters: courseData.semesters,
          });
          // No need to manually push - the watch on convexCourses handles it
          error.value = null;
          return;
        }

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
      courseData: Partial<
        Omit<Course, "id" | "createdAt" | "updatedAt" | "academicYearId">
      >
    ) {
      loading.value = true;
      try {
        if (useConvexFeatures() && convex) {
          // Use Convex - reactive subscription will automatically update the list
          await convex.mutation(api.courses.mutations.update, {
            id: id as any,
            number: courseData.number,
            name: courseData.admissionYear,
            semesters: courseData.semesters,
          });
          // No need to manually update - the watch on convexCourses handles it
          error.value = null;
          return;
        }

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
        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.courses.mutations.remove, {
            id: id as any,
          });
          // Don't filter courses.value - the reactive subscription will handle it
          error.value = null;
          return;
        }
        // Fallback: local-only
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

    async function loadFromBackend() {
      if (!useConvexFeatures() || !convex) return;

      loading.value = true;
      try {
        const data = await convex.query(api.courses.queries.list, {});
        courses.value = data.map((c) => ({
          id: c._id,
          number: c.number,
          admissionYear: c.name || "",
          semesters: c.semesters || [],
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
        sortCourses();
        error.value = null;
      } catch (err) {
        console.error("[courseStore] Failed to load from Convex:", err);
        error.value = "Failed to load courses";
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
      courseOptions,
      isLoading,
      getError,
      addCourse,
      updateCourse,
      deleteCourse,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
