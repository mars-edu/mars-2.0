import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Language {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useLanguageStore = defineStore(
  "language",
  () => {
    const languages = ref<Language[]>([
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
    ]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getLanguageById = computed(() => {
      return (id: string) => languages.value.find((l) => l.id === id);
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function fetchLanguages() {
      loading.value = true;
      try {
        // Data will be automatically loaded by Pinia persistence
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to load languages";
      } finally {
        loading.value = false;
      }
    }

    async function addLanguage(
      languageData: Omit<Language, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newLanguage: Language = {
          ...languageData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        languages.value.push(newLanguage);
        error.value = null;
        return newLanguage;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add language";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateLanguage(
      id: string,
      languageData: Partial<Omit<Language, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
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
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update language";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteLanguage(id: string) {
      loading.value = true;
      try {
        languages.value = languages.value.filter((l) => l.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete language";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    return {
      languages,
      loading,
      error,
      getLanguageById,
      isLoading,
      getError,
      fetchLanguages,
      addLanguage,
      updateLanguage,
      deleteLanguage,
      clearError,
    };
  },
  {
    persist: true,
  }
);
