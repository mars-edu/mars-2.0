import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useUserStore } from "./userStore";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export interface ProtocolEntry {
  _id: Id<"substitutions">;
  type: "substitution"; // Future: add "appeal" | "retake" etc.
  journalId: Id<"journals">;
  fromTeacherId: string;
  toTeacherId: string;
  toUserId: Id<"users">;
  startDate: string;
  endDate: string;
  status: "pending" | "accepted" | "rejected" | "completed";
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
  // Enriched fields from query
  journal?: any;
  fromTeacher?: {
    _id: string;
    firstName: string;
    surname: string;
    patronymic: string;
  };
  toTeacher?: {
    _id: string;
    firstName: string;
    surname: string;
    patronymic: string;
  };
  disciplineName?: string;
}

export const useProtocolStore = defineStore("protocol", () => {
  const entries = ref<ProtocolEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const selectedTeacherId = ref<string | null>(null);
  const actionLoading = ref(false);
  const actionError = ref<string | null>(null);

  const userStore = useUserStore();

  /**
   * Fetch protocol entries from the backend with JWT-based role access control.
   * The backend validates the JWT token and enforces role-based filtering:
   * - Admins can see all entries or filter by selectedTeacherId
   * - Teachers can only see their own entries (enforced by backend)
   */
  async function fetchProtocolWithRoleAccess() {
    const token = userStore.token;
    if (!token) {
      entries.value = [];
      return;
    }

    loading.value = true;
    error.value = null;

    try {
      const data = await convex.action(
        api.substitutions.queries.listProtocolWithRoleAccess,
        {
          token,
          selectedTeacherId: selectedTeacherId.value,
        }
      );

      console.log("[protocolStore] Fetched protocol entries:", {
        entriesCount: data.length,
      });

      entries.value = data.map((entry: any) => ({
        ...entry,
        type: "substitution" as const,
      }));
    } catch (err) {
      console.error("[protocolStore] Failed to fetch protocol entries:", err);
      error.value = "Не удалось загрузить протоколы";
      entries.value = [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Set selected teacher (admin only) and refresh data
   */
  function setSelectedTeacher(teacherId: string | null) {
    selectedTeacherId.value = teacherId === "all" ? null : teacherId;
    fetchProtocolWithRoleAccess();
  }

  /**
   * Accept a substitution entry
   */
  async function acceptEntry(substitutionId: Id<"substitutions">) {
    const userId = userStore.currentUser?.id as Id<"users">;
    if (!userId) {
      console.warn("[protocolStore] No authenticated user, cannot perform action");
      return;
    }

    actionLoading.value = true;
    actionError.value = null;

    try {
      await convex.mutation(api.substitutions.mutations.acceptSubstitution, {
        substitutionId,
        userId,
      });
      await fetchProtocolWithRoleAccess();
    } catch (err: any) {
      console.error("[protocolStore] acceptEntry failed:", err);
      actionError.value = err?.message || "Не удалось принять замену";
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * Reject a substitution entry
   */
  async function rejectEntry(
    substitutionId: Id<"substitutions">,
    reason?: string
  ) {
    const userId = userStore.currentUser?.id as Id<"users">;
    if (!userId) {
      console.warn("[protocolStore] No authenticated user, cannot perform action");
      return;
    }

    actionLoading.value = true;
    actionError.value = null;

    try {
      await convex.mutation(api.substitutions.mutations.rejectSubstitution, {
        substitutionId,
        userId,
        rejectionReason: reason,
      });
      await fetchProtocolWithRoleAccess();
    } catch (err: any) {
      console.error("[protocolStore] rejectEntry failed:", err);
      actionError.value = err?.message || "Не удалось отклонить замену";
    } finally {
      actionLoading.value = false;
    }
  }

  /**
   * Get full teacher name
   */
  function getTeacherName(teacher?: {
    firstName: string;
    surname: string;
    patronymic: string;
  }): string {
    if (!teacher) return "Неизвестный преподаватель";
    return `${teacher.surname} ${teacher.firstName} ${teacher.patronymic}`;
  }

  /**
   * Format date for display
   */
  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Get status badge text
   */
  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: "Ожидает",
      accepted: "Принята",
      rejected: "Отклонена",
      completed: "Завершена",
    };
    return statusMap[status] || status;
  }

  /**
   * Group entries by date
   */
  const entriesByDate = computed(() => {
    const grouped = new Map<string, ProtocolEntry[]>();

    for (const entry of entries.value) {
      const date = new Date(entry.createdAt);
      const dateKey = date.toLocaleDateString("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(entry);
    }

    return Array.from(grouped.entries()).map(([date, entries]) => ({
      date,
      entries,
    }));
  });

  /**
   * Reset store
   */
  function reset() {
    entries.value = [];
    loading.value = false;
    error.value = null;
    selectedTeacherId.value = null;
    actionLoading.value = false;
    actionError.value = null;
  }

  return {
    entries,
    loading,
    error,
    selectedTeacherId,
    actionLoading,
    actionError,
    fetchProtocolWithRoleAccess,
    setSelectedTeacher,
    acceptEntry,
    rejectEntry,
    getTeacherName,
    formatDate,
    getStatusText,
    entriesByDate,
    reset,
  };
});
