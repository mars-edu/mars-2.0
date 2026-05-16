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
    resetCurrentWorkload,
  };
});
