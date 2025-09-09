import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Session {
  id: string;
  shortName: string;
  fullName: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SESSIONS: Session[] = [];

export const useSessionStore = defineStore(
  "session",
  () => {
    const sessions = ref<Session[]>([...DEFAULT_SESSIONS]);
    const loading = ref(false);
    const error = ref<string | null>(null);

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

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addSession(
      sessionData: Omit<Session, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newSession: Session = {
          ...sessionData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        sessions.value.push(newSession);
        error.value = null;
        return newSession;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add session";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateSession(
      id: string,
      sessionData: Partial<Omit<Session, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        const index = sessions.value.findIndex((s) => s.id === id);
        if (index === -1) {
          throw new Error("Session not found");
        }

        const updatedSession = {
          ...sessions.value[index],
          ...sessionData,
          updatedAt: new Date(),
        };

        sessions.value[index] = updatedSession;
        error.value = null;
        return updatedSession;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update session";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteSession(id: string) {
      loading.value = true;
      try {
        sessions.value = sessions.value.filter((s) => s.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete session";
        throw err;
      } finally {
        loading.value = false;
      }
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
      isLoading,
      getError,
      addSession,
      updateSession,
      deleteSession,
      clearError,
      reset,
      migrateOldSessionData,
      handleLegacySessionData,
    };
  },
  {
    persist: true,
  }
);
