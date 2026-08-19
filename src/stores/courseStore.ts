import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import type { Id } from "@convex/_generated/dataModel";
import { withLoading } from "@/utils/storeAction";
import type { Course } from "@/types/course";

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

    async function addCourse(
      courseData: Omit<
        Course,
        "id" | "createdAt" | "updatedAt" | "academicYearId"
      >
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - reactive subscription will automatically update the list
                await convex.mutation(api.courses.mutations.create, {
                  number: courseData.number,
                  name: courseData.admissionYear,
                  semesters: courseData.semesters,
                });
                // No need to manually push - the watch on convexCourses handles it
                error.value = null;
        }, "Failed to add course");
    }

    async function updateCourse(
      id: string,
      courseData: Partial<
        Omit<Course, "id" | "createdAt" | "updatedAt" | "academicYearId">
      >
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - reactive subscription will automatically update the list
                await convex.mutation(api.courses.mutations.update, {
                  id: id as Id<"courses">,
                  number: courseData.number,
                  name: courseData.admissionYear,
                  semesters: courseData.semesters,
                });
                // No need to manually update - the watch on convexCourses handles it
                error.value = null;
        }, "Failed to update course");
    }

    async function deleteCourse(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.courses.mutations.remove, {
                  id: id as Id<"courses">,
                });
                // Don't filter courses.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to delete course");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
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
        }, "Operation failed");
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
