import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export type SubstitutionStatus = "pending" | "accepted" | "rejected" | "completed" | "cancelled";

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
  const currentUserId = ref<Id<"users"> | null>(null);
  const receivedSubstitutions = ref<EnrichedSubstitution[]>([]);
  const loading = ref(false);

  let unsubscribe: (() => void) | null = null;

  const activeSubstitutions = computed(() =>
    receivedSubstitutions.value.filter(
      (s) => s.status === "accepted"
    )
  );

  function loadForUser(userId: Id<"users">) {
    if (currentUserId.value === userId) return;
    currentUserId.value = userId;

    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }

    loading.value = true;

    unsubscribe = convex.onUpdate(
      api.substitutions.queries.getTeacherSubstitutions,
      { toUserId: userId },
      (data) => {
        receivedSubstitutions.value = (data as EnrichedSubstitution[]) ?? [];
        loading.value = false;
      }
    );
  }

  function reset() {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
    currentUserId.value = null;
    receivedSubstitutions.value = [];
    loading.value = false;
  }

  return {
    receivedSubstitutions,
    activeSubstitutions,
    loading,
    loadForUser,
    reset,
  };
});
