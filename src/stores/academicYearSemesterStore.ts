import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { useAcademicYearStore } from "./academicYearStore";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { ConvexError } from "convex/values";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { AcademicYearSemester } from "@/types/academic-year-semester";

const DEFAULT_ACADEMIC_YEAR_SEMESTERS: AcademicYearSemester[] = [];

export const useAcademicYearSemesterStore = defineStore(
  "academicYearSemester",
  () => {
    const academicYearSemesters = ref<AcademicYearSemester[]>([
      ...DEFAULT_ACADEMIC_YEAR_SEMESTERS,
    ]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexSemesters } = useConvexQuery(
      api.academicYearSemesters.queries.list,
      ref({})
    );

    watch(convexSemesters, (newData) => {
      if (newData) {
        academicYearSemesters.value = newData.map((s) => ({
          id: s._id,
          academicYearId: s.academicYearId,
          semesterDefinitionId: s.semesterDefinitionId,
          semesterNumber: s.semesterDefinition?.number || 1,
          semesterName: s.semesterDefinition?.shortName || "",
          startDate: s.startDate,
          endDate: s.endDate,
          weeksCount: s.weeksCount,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
      }
    });

    const _academicYearSemesterById = computed(() => {
      const m = new Map<string, (typeof academicYearSemesters.value)[number]>();
      for (const s of academicYearSemesters.value) m.set(s.id, s);
      return m;
    });
    const getAcademicYearSemesterById = computed(() => {
      return (id: string) => _academicYearSemesterById.value.get(id);
    });

    const getAcademicYearSemestersByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        academicYearSemesters.value.filter(
          (s) => s.academicYearId === academicYearId
        );
    });

    const getActiveAcademicYearSemester = computed(() => {
      const academicYearStore = useAcademicYearStore();
      const activeAcademicYear = academicYearStore.getActiveAcademicYear;

      if (!activeAcademicYear) {
        return null;
      }

      const yearSemesters = academicYearSemesters.value.filter((semester) => {
        return semester.academicYearId === activeAcademicYear.id;
      });
      
      const today = new Date();
      return (
        yearSemesters.find((semester) => {
          const startDate = new Date(semester.startDate);
          const endDate = new Date(semester.endDate);
          return today >= startDate && today <= endDate;
        }) || yearSemesters[yearSemesters.length - 1] || null
      );
    });

    const isSemesterActive = (semester: AcademicYearSemester) => {
      const today = new Date();
      const startDate = new Date(semester.startDate);
      const endDate = new Date(semester.endDate);

      return today >= startDate && today <= endDate;
    };

    const getActiveAcademicYearSemesters = computed(() => {
      const academicYearStore = useAcademicYearStore();
      const activeAcademicYear = academicYearStore.getActiveAcademicYear;

      if (!activeAcademicYear) {
        return [];
      }

      return academicYearSemesters.value.filter((semester) => {
        return semester.academicYearId === activeAcademicYear.id;
      });
    });

    const getAutoSelectedSemesterForYear = computed(() => {
      return (yearId?: string) => {
        let semesters: AcademicYearSemester[] = yearId 
          ? getAcademicYearSemestersByAcademicYear.value(yearId)
          : getActiveAcademicYearSemesters.value;
          
        const current = semesters.find((s: AcademicYearSemester) => isSemesterActive(s));
        if (current) return current;
        if (semesters.length > 0) return semesters[semesters.length - 1];
        return null;
      };
    });

    async function addAcademicYearSemester(semesterData: {
      academicYearId: string;
      semesterDefinitionId: string;
      startDate: string;
      endDate: string;
      weeksCount?: number;
    }) {
      return await withLoading(loading, error, async () => {
        // Validate that dates are not empty
                if (!semesterData.startDate || !semesterData.endDate) {
                  error.value = "Даты начала и окончания семестра обязательны";
                  throw new Error(error.value);
                }

                // Validate that dates are valid
                const startDate = new Date(semesterData.startDate);
                const endDate = new Date(semesterData.endDate);

                if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                  error.value = "Указаны некорректные даты";
                  throw new Error(error.value);
                }

                if (endDate <= startDate) {
                  error.value = "Дата окончания должна быть позже даты начала";
                  throw new Error(error.value);
                }

                // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.academicYearSemesters.mutations.create, {
                  academicYearId: semesterData.academicYearId as any,
                  semesterDefinitionId: semesterData.semesterDefinitionId as any,
                  startDate: semesterData.startDate,
                  endDate: semesterData.endDate,
                  weeksCount: semesterData.weeksCount,
                });
                // Don't push to academicYearSemesters.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to add academic year semester");
    }

    async function updateAcademicYearSemester(
      id: string,
      semesterData: {
        semesterDefinitionId?: string;
        startDate?: string;
        endDate?: string;
        weeksCount?: number;
      }
    ) {
      return await withLoading(loading, error, async () => {
        // Validate dates if they're being updated
                if (semesterData.startDate !== undefined || semesterData.endDate !== undefined) {
                  // If either date is being updated, validate both
                  if (semesterData.startDate !== undefined && !semesterData.startDate) {
                    error.value = "Дата начала семестра обязательна";
                    throw new Error(error.value);
                  }

                  if (semesterData.endDate !== undefined && !semesterData.endDate) {
                    error.value = "Дата окончания семестра обязательна";
                    throw new Error(error.value);
                  }

                  // Validate date values if provided
                  if (semesterData.startDate) {
                    const startDate = new Date(semesterData.startDate);
                    if (isNaN(startDate.getTime())) {
                      error.value = "Дата начала указана некорректно";
                      throw new Error(error.value);
                    }
                  }

                  if (semesterData.endDate) {
                    const endDate = new Date(semesterData.endDate);
                    if (isNaN(endDate.getTime())) {
                      error.value = "Дата окончания указана некорректно";
                      throw new Error(error.value);
                    }
                  }

                  // Validate date order if both are provided
                  if (semesterData.startDate && semesterData.endDate) {
                    const startDate = new Date(semesterData.startDate);
                    const endDate = new Date(semesterData.endDate);
                    if (endDate <= startDate) {
                      error.value = "Дата окончания должна быть позже даты начала";
                      throw new Error(error.value);
                    }
                  }
                }

                // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.academicYearSemesters.mutations.update, {
                  id: id as any,
                  semesterDefinitionId: semesterData.semesterDefinitionId as any,
                  startDate: semesterData.startDate,
                  endDate: semesterData.endDate,
                  weeksCount: semesterData.weeksCount,
                });
                // Don't update academicYearSemesters.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to update academic year semester");
    }

    // Tables the server reports in SEMESTER_HAS_REFERENCES, with their Russian
    // labels in display order. Unknown keys are ignored rather than printed raw.
    const SEMESTER_REF_LABELS: ReadonlyArray<readonly [string, string]> = [
      ["journals", "журналы"],
      ["calendarEvents", "события календаря"],
      ["ktps", "КТП"],
      ["scheduledIntermediateControls", "ПРК (планы)"],
      ["scheduledFinalControls", "экзамены (планы)"],
      ["educationSchedules", "расписания"],
      ["vacations", "каникулы"],
    ];

    function formatSemesterReferences(refs: unknown): string {
      if (!refs || typeof refs !== "object") return "";
      const r = refs as Record<string, unknown>;
      const parts: string[] = [];
      for (const [key, label] of SEMESTER_REF_LABELS) {
        const n = r[key];
        if (typeof n === "number" && n > 0) parts.push(`${label}: ${n}`);
      }
      return parts.join(", ");
    }

    async function deleteAcademicYearSemester(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                try {
                  await convex.mutation(api.academicYearSemesters.mutations.remove, {
                    id: id as any,
                  });
                } catch (err) {
                  if (err instanceof ConvexError) {
                    const data = err.data as
                      | { code?: string; references?: unknown }
                      | undefined;
                    if (data?.code === "SEMESTER_HAS_REFERENCES") {
                      const list = formatSemesterReferences(data.references);
                      throw new Error(
                        list
                          ? `Семестр используется. Сначала удалите: ${list}.`
                          : "Семестр используется — сначала удалите связанные записи."
                      );
                    }
                  }
                  throw err;
                }
                // Don't filter academicYearSemesters.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to delete academic year semester");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.academicYearSemesters.queries.list, {});
                academicYearSemesters.value = data
                  .filter((s: any) => s.academicYearId) // Only those with academic year
                  .map((s: any) => ({
                    id: s._id,
                    academicYearId: s.academicYearId as string,
                    semesterDefinitionId: s.semesterDefinitionId || "",
                    semesterNumber: s.semester?.number || s.number || 1,
                    semesterName: s.semester?.name || s.semesterName || `Семестр ${s.semester?.number || s.number || 1}`,
                    startDate: s.startDate || "",
                    endDate: s.endDate || "",
                    createdAt: new Date(s.createdAt),
                    updatedAt: new Date(s.updatedAt),
                  }));
                error.value = null;
        }, "Operation failed");
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      academicYearSemesters.value = [...DEFAULT_ACADEMIC_YEAR_SEMESTERS];
      loading.value = false;
      error.value = null;
    }

    return {
      academicYearSemesters,
      loading,
      error,
      getAcademicYearSemesterById,
      getAcademicYearSemestersByAcademicYear,
      getActiveAcademicYearSemester,
      getActiveAcademicYearSemesters,
      getAutoSelectedSemesterForYear,
      isSemesterActive,
      addAcademicYearSemester,
      updateAcademicYearSemester,
      deleteAcademicYearSemester,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
