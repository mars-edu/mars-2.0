import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export type SubstitutionStatus = "pending" | "accepted" | "rejected" | "completed";

export interface EnrichedSubstitution {
  _id: Id<"substitutions">;
  journalId: Id<"journals">;
  fromTeacherId: string;
  toTeacherId: string;
  toUserId: Id<"users">;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isPrimary?: boolean;
  status: SubstitutionStatus;
  reason?: string;
  serviceLetterNumber?: string;
  journalSnapshot?: {
    disciplineName: string;
    groupName?: string;
    course?: string;
    semester?: string;
  };
  createdBy: Id<"users">;
  acceptedAt?: number;
  rejectedAt?: number;
  createdAt: number;
  updatedAt: number;
  journal: { _id: Id<"journals">; calendarEventId?: string; [key: string]: any } | null;
  fromTeacher: { _id: string; surname: string; firstName: string; patronymic?: string; [key: string]: any } | undefined;
  toTeacher: { _id: string; surname: string; firstName: string; patronymic?: string; [key: string]: any } | undefined;
}

export const useSubstitutionStore = defineStore("substitutions", () => {
  const receivedSubstitutions = ref<EnrichedSubstitution[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  let lastRequestId = 0;

  const activeSubstitutions = computed(() =>
    receivedSubstitutions.value.filter(
      (s) => s.status === "pending" || s.status === "accepted"
    )
  );

  const loadForUser = async (userId: Id<"users">) => {
    const requestId = (lastRequestId += 1);

    try {
      loading.value = true;
      error.value = null;

      const data = await convex.query(
        api.substitutions.queries.getTeacherSubstitutions,
        { toUserId: userId }
      );

      if (requestId !== lastRequestId) return;

      receivedSubstitutions.value = (data as EnrichedSubstitution[]) ?? [];
    } catch (err) {
      console.error("[substitutionStore] Failed to load substitutions:", err);
      if (requestId !== lastRequestId) return;
      receivedSubstitutions.value = [];
      error.value = "Не удалось загрузить замены";
    } finally {
      if (requestId === lastRequestId) loading.value = false;
    }
  };

  const reset = () => {
    receivedSubstitutions.value = [];
    error.value = null;
    loading.value = false;
  };

  return {
    receivedSubstitutions,
    activeSubstitutions,
    loading,
    error,
    loadForUser,
    reset,
  };
});
