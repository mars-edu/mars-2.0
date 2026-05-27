import { defineStore } from "pinia";
import { computed, ref, watch } from "vue";
import { useConvexQuery } from "convex-vue";
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
  const currentUserId = ref<Id<"users"> | null>(null);
  const receivedSubstitutions = ref<EnrichedSubstitution[]>([]);

  const queryArgs = computed(() =>
    currentUserId.value ? { toUserId: currentUserId.value } : "skip"
  );

  const { data: convexSubstitutions } = useConvexQuery(
    api.substitutions.queries.getTeacherSubstitutions,
    queryArgs
  );

  watch(convexSubstitutions, (newData) => {
    receivedSubstitutions.value = (newData as EnrichedSubstitution[] | undefined) ?? [];
  });

  const activeSubstitutions = computed(() =>
    receivedSubstitutions.value.filter(
      (s) => s.status === "accepted"
    )
  );

  const loading = computed(() => currentUserId.value !== null && !convexSubstitutions.value);

  function loadForUser(userId: Id<"users">) {
    currentUserId.value = userId;
  }

  function reset() {
    currentUserId.value = null;
    receivedSubstitutions.value = [];
  }

  return {
    receivedSubstitutions,
    activeSubstitutions,
    loading,
    loadForUser,
    reset,
  };
});
