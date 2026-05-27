import { defineStore } from "pinia";
import { ref } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export interface MakeupDateEntry {
  existingDate: string;
  newDate: string;
  startScheduleId: string;
  endScheduleId: string;
}

export const useMakeupRequestStore = defineStore("makeupRequests", () => {
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function createMakeupRequest(params: {
    journalId: string;
    teacherId: string;
    createdBy: string;
    reason?: string;
    dates: MakeupDateEntry[];
  }) {
    loading.value = true;
    error.value = null;
    try {
      const id = await convex.mutation(
        api.makeupRequests.mutations.createMakeupRequest,
        {
          journalId: params.journalId as Id<"journals">,
          teacherId: params.teacherId,
          createdBy: params.createdBy as Id<"users">,
          reason: params.reason,
          dates: params.dates,
        }
      );
      return id;
    } catch (err: any) {
      error.value = err?.message ?? "Не удалось отправить запрос на отработку";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return { loading, error, createMakeupRequest };
});
