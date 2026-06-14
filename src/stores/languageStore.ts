import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { withLoading } from "@/utils/storeAction";
import type { Language } from "@/types/language";

const DEFAULT_LANGUAGES: Language[] = [
  {
    id: "1",
    name: "Русский",
    code: "ru",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "English",
    code: "en",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "Қазақша",
    code: "kk",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useLanguageStore = defineStore(
  "language",
  () => {
    const languages = ref<Language[]>([...DEFAULT_LANGUAGES]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getLanguageById = computed(() => {
      return (id: string) => languages.value.find((l) => l.id === id);
    });

    const languageOptions = computed(() =>
      languages.value.map((l) => ({
        value: l.code,
        text: l.name,
      }))
    );

    async function addLanguage(
      languageData: Omit<Language, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        const newLanguage: Language = {
                  ...languageData,
                  id: crypto.randomUUID(),
                  createdAt: new Date(),
                  updatedAt: new Date(),
                };
                languages.value.push(newLanguage);
                error.value = null;
                return newLanguage;
        }, "Failed to add language");
    }

    async function updateLanguage(
      id: string,
      languageData: Partial<Omit<Language, "id" | "createdAt" | "updatedAt">>
    ) {
      return await withLoading(loading, error, async () => {
        const index = languages.value.findIndex((l) => l.id === id);
                if (index === -1) {
                  throw new Error("Language not found");
                }

                const updatedLanguage = {
                  ...languages.value[index],
                  ...languageData,
                  updatedAt: new Date(),
                };

                languages.value[index] = updatedLanguage;
                error.value = null;
                return updatedLanguage;
        }, "Failed to update language");
    }

    async function deleteLanguage(id: string) {
      return await withLoading(loading, error, async () => {
        languages.value = languages.value.filter((l) => l.id !== id);
                error.value = null;
        }, "Failed to delete language");
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
      languageOptions,
      addLanguage,
      updateLanguage,
      deleteLanguage,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
