import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import type { SavedWorkload, WorkloadItem } from "@/types/workload";
import type { Id } from "@convex/_generated/dataModel";

export const useWorkloadStore = defineStore("workload", () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Selected state for UI
  const selectedTeacherId = ref<string | null>(null);
  const selectedAcademicYearId = ref<string | null>(null);
  const currentWorkloadItems = ref<WorkloadItem[]>([]);
  const editingWorkloadId = ref<string | null>(null);

  // Reactive query for all workloads
  const { data: convexWorkloads } = useConvexQuery(
    api.workloads.queries.list,
    ref({})
  );

  // Transform Convex data to our SavedWorkload format
  const allWorkloads = computed<SavedWorkload[]>(() => {
    if (!convexWorkloads.value) return [];

    return convexWorkloads.value.map((item: any) => ({
      id: item._id,
      teacherId: item.teacherId,
      teacherName: item.teacherName,
      academicYearId: item.academicYearId,
      items: item.items,
      totalHours: item.totalHours,
      journalsCreated: item.journalsCreated,
      journalsCreatedSemesters: item.journalsCreatedSemesters,
      addedToSchedule: item.addedToSchedule,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
  });

  const saveWorkload = async (workload: SavedWorkload) => {
    loading.value = true;
    error.value = null;
    try {
      const args: any = {
        teacherName: workload.teacherName,
        academicYearId: workload.academicYearId,
        totalHours: workload.totalHours,
        items: workload.items,
      };

      if (workload.id) {
        args.id = workload.id as Id<"workloads">;
      }
      
      if (workload.teacherId) {
        args.teacherId = workload.teacherId as Id<"teachers">;
      }

      const id = await convex.mutation(api.workloads.mutations.save, args);
      return id;
    } catch (err: any) {
      error.value = err.message || "Failed to save workload";
      console.error("Error saving workload:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const deleteWorkload = async (id: string) => {
    loading.value = true;
    error.value = null;
    try {
      await convex.mutation(api.workloads.mutations.remove, {
        id: id as Id<"workloads">,
      });
    } catch (err: any) {
      error.value = err.message || "Failed to delete workload";
      console.error("Error deleting workload:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const generateJournalGroups = async (
    workloadId: string,
    semesterId: string,
    groups: Array<{
      subjectId: string;
      groupName?: string;
      studentIds: string[];
      weeklySchedules: Array<{ weekId: number; startId?: string; endId?: string }>;
    }>,
    /**
     * Legacy ordinal, kept alongside `semesterId` only to satisfy old deployed
     * frontend bundles calling the same mutation during the compatibility
     * window (see convex/workloads/mutations.ts). New callers only need
     * `semesterId`. Remove once Phase 4/5 retires the legacy arg.
     */
    semester?: number
  ) => {
    loading.value = true;
    error.value = null;
    try {
      return await convex.mutation(
        api.workloads.mutations.createJournalsFromWorkloadGroups,
        {
          workloadId: workloadId as Id<"workloads">,
          semesterId: semesterId as Id<"academicYearSemesters">,
          semester,
          groups,
        }
      );
    } catch (err: any) {
      error.value = err.message || "Failed to generate journals";
      console.error("Error generating journals from workload:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setAddedToSchedule = async (id: string, value: boolean) => {
    try {
      await convex.mutation(api.workloads.mutations.setAddedToSchedule, {
        id: id as Id<"workloads">,
        value,
      });
    } catch (err: any) {
      error.value = err.message || "Failed to update workload status";
      console.error("Error updating workload status:", err);
      throw err;
    }
  };

  function resetCurrentWorkload() {
    currentWorkloadItems.value = [];
    editingWorkloadId.value = null;
    selectedTeacherId.value = null;
  }

  return {
    loading,
    error,
    allWorkloads,
    selectedTeacherId,
    selectedAcademicYearId,
    currentWorkloadItems,
    editingWorkloadId,
    saveWorkload,
    deleteWorkload,
    generateJournalGroups,
    setAddedToSchedule,
    resetCurrentWorkload,
  };
});
