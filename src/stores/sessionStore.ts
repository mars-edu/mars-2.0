import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { Session } from "@/types/session";

const DEFAULT_SESSIONS: Session[] = [];

export const useSessionStore = defineStore(
  "session",
  () => {
    const sessions = ref<Session[]>([...DEFAULT_SESSIONS]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexSessions } = useConvexQuery(
      api.sessions.queries.list,
      ref({})
    );

    watch(convexSessions, (newData) => {
      if (newData) {
        sessions.value = newData.map((s) => ({
          id: s._id,
          shortName: s.shortName,
          fullName: s.fullName,
          startDate: s.startDate,
          endDate: s.endDate,
          academicYearId: s.academicYearId,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
      }
    });

    const getSessionById = computed(() => {
      return (id: string) => sessions.value.find((s) => s.id === id);
    });

    const sortedSessions = computed(() => {
      return [...sessions.value].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
    });

    const getSessionsByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        sessions.value.filter((s) => s.academicYearId === academicYearId);
    });

    async function addSession(
      sessionData: Omit<Session, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.sessions.mutations.create, {
                  shortName: sessionData.shortName,
                  fullName: sessionData.fullName,
                  academicYearId: sessionData.academicYearId,
                  startDate: sessionData.startDate,
                  endDate: sessionData.endDate,
                });
                // Don't push to sessions.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to add session");
    }

    async function updateSession(
      id: string,
      sessionData: Partial<Omit<Session, "id" | "createdAt" | "updatedAt">>
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.sessions.mutations.update, {
                  id: id as any,
                  shortName: sessionData.shortName,
                  fullName: sessionData.fullName,
                  academicYearId: sessionData.academicYearId,
                  startDate: sessionData.startDate,
                  endDate: sessionData.endDate,
                });
                // Don't update sessions.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to update session");
    }

    async function deleteSession(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.sessions.mutations.remove, {
                  id: id as any,
                });
                // Don't filter sessions.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to delete session");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.sessions.queries.list, {});
                sessions.value = data.map((s) => ({
                  id: s._id,
                  shortName: s.shortName,
                  fullName: s.fullName,
                  startDate: s.startDate,
                  endDate: s.endDate,
                  academicYearId: s.academicYearId,
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
      sessions.value = [...DEFAULT_SESSIONS];
      loading.value = false;
      error.value = null;
    }

    // Migration function to port old session data from semesterStore
    function migrateOldSessionData() {
      let hasChanges = false;

      sessions.value = sessions.value.map((session) => {
        const oldSession = session as any;
        if (oldSession.name && (!session.shortName || !session.fullName)) {
          hasChanges = true;
          return {
            ...session,
            shortName: oldSession.name,
            fullName: oldSession.name,
            name: undefined,
          };
        }
        return session;
      });

      if (hasChanges) {
        console.log(
          "Migrated old session name fields to shortName/fullName structure"
        );
      }
    }

    // Function to handle legacy session data migration
    function handleLegacySessionData(legacySessions: any[]) {
      if (legacySessions.length > 0 && sessions.value.length === 0) {
        sessions.value = legacySessions;
        console.log(
          `Migrated ${legacySessions.length} sessions to session store`
        );
      }
    }

    return {
      sessions,
      loading,
      error,
      getSessionById,
      sortedSessions,
      getSessionsByAcademicYear,
      addSession,
      updateSession,
      deleteSession,
      clearError,
      reset,
      migrateOldSessionData,
      handleLegacySessionData,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
