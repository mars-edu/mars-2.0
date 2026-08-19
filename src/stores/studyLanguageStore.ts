import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { ConvexError } from "convex/values";
import { withLoading } from "@/utils/storeAction";
import type { StudyLanguage } from "@/types/study-language";
import { DEFAULT_STUDY_LANGUAGE_CODE } from "@/types/study-language";

const DEFAULT_LANGUAGES: StudyLanguage[] = [];

export const useStudyLanguageStore = defineStore(
  "studyLanguage",
  () => {
    const languages = ref<StudyLanguage[]>([...DEFAULT_LANGUAGES]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexLanguages } = useConvexQuery(
      api.studyLanguages.queries.list,
      ref({})
    );

    watch(convexLanguages, (newData) => {
      if (newData) {
        languages.value = newData.map((lang) => ({
          id: lang._id,
          code: lang.code,
          name: lang.name,
          shortName: lang.shortName,
          color: lang.color,
          isDefault: lang.isDefault,
          order: lang.order,
          createdAt: new Date(lang.createdAt),
          updatedAt: new Date(lang.updatedAt),
        }));
      }
    });

    // Kept as `getLanguageById` (not `getById`) — matches the retired
    // languageStore.ts API so consumers don't churn.
    const getLanguageById = computed(() => {
      return (id: string) => languages.value.find((l) => l.id === id);
    });

    const getByCode = computed(() => {
      return (code: string) => languages.value.find((l) => l.code === code);
    });

    const getDefaultLanguage = computed(() => {
      return languages.value.find((l) => l.isDefault) || null;
    });

    // Same `{value, text}` shape the old store exposed so consumers
    // (AddStudentButton, EditStudentButton, StudentSelectionPopup, AddEventWizard…)
    // don't need to change.
    const languageOptions = computed(() =>
      languages.value.map((l) => ({
        value: l.code,
        text: l.name,
      }))
    );

    // Translate the server's ConvexError codes into localized human messages.
    function rethrowDeleteError(err: unknown): never {
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string; references?: Record<string, number> } | undefined;
        if (data?.code === "CANNOT_DELETE_DEFAULT_LANGUAGE") {
          throw new Error(
            "Нельзя удалить язык по умолчанию — сначала назначьте другой язык по умолчанию."
          );
        }
        if (data?.code === "STUDY_LANGUAGE_IN_USE") {
          const refs = data.references ?? {};
          const parts = Object.entries(refs).map(([k, n]) => `${k}: ${n}`);
          throw new Error(
            `Язык используется и не может быть удалён (${parts.join(", ") || "есть ссылки"}).`
          );
        }
      }
      throw err;
    }

    async function addStudyLanguage(
      data: Omit<StudyLanguage, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        const id = await convex.mutation(api.studyLanguages.mutations.create, {
          code: data.code,
          name: data.name,
          shortName: data.shortName,
          color: data.color,
          isDefault: data.isDefault,
          order: data.order,
        });
        const created = await convex.query(api.studyLanguages.queries.getById, { id });
        if (created) {
          error.value = null;
          return {
            id: created._id,
            code: created.code,
            name: created.name,
            shortName: created.shortName,
            color: created.color,
            isDefault: created.isDefault,
            order: created.order,
            createdAt: new Date(created.createdAt),
            updatedAt: new Date(created.updatedAt),
          } satisfies StudyLanguage;
        }
      }, "Failed to add study language");
    }

    async function updateStudyLanguage(
      id: string,
      data: Partial<Omit<StudyLanguage, "id" | "createdAt" | "updatedAt">>
    ) {
      return await withLoading(loading, error, async () => {
        const updated = await convex.mutation(api.studyLanguages.mutations.update, {
          id: id as any,
          code: data.code,
          name: data.name,
          shortName: data.shortName,
          color: data.color,
          isDefault: data.isDefault,
          order: data.order,
        });

        if (updated) {
          error.value = null;
          return {
            id: updated._id,
            code: updated.code,
            name: updated.name,
            shortName: updated.shortName,
            color: updated.color,
            isDefault: updated.isDefault,
            order: updated.order,
            createdAt: new Date(updated.createdAt),
            updatedAt: new Date(updated.updatedAt),
          } satisfies StudyLanguage;
        }
      }, "Failed to update study language");
    }

    async function deleteStudyLanguage(id: string) {
      return await withLoading(loading, error, async () => {
        try {
          await convex.mutation(api.studyLanguages.mutations.remove, {
            id: id as any,
          });
        } catch (err) {
          rethrowDeleteError(err);
        }
        error.value = null;
      }, "Failed to delete study language");
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      languages.value = [...DEFAULT_LANGUAGES];
      loading.value = false;
      error.value = null;
    }

    return {
      languages,
      loading,
      error,
      getLanguageById,
      getByCode,
      getDefaultLanguage,
      languageOptions,
      addStudyLanguage,
      updateStudyLanguage,
      deleteStudyLanguage,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);

export { DEFAULT_STUDY_LANGUAGE_CODE };
