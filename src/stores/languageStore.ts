import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Language {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
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
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "2",
        name: "English",
        code: "en",
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "3",
        name: "Қазақша",
        code: "kk",
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getLanguageById = computed(() => {
      return (id: string) => languages.value.find((l) => l.id === id);
    });

    const getDefaultLanguage = computed(() => {
      return languages.value.find((l) => l.isDefault) || languages.value[0];
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
        // If the new language is default, update all others
        if (languageData.isDefault) {
          languages.value = languages.value.map((lang) => ({
            ...lang,
            isDefault: false,
          }));
        }

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

        // If updating to make this language default
        if (languageData.isDefault) {
          languages.value = languages.value.map((lang) => ({
            ...lang,
            isDefault: lang.id === id,
          }));
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
        const languageToDelete = languages.value.find((l) => l.id === id);
        if (languageToDelete?.isDefault) {
          throw new Error("Cannot delete default language");
        }
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

    async function setDefaultLanguage(id: string) {
      loading.value = true;
      try {
        languages.value = languages.value.map((lang) => ({
          ...lang,
          isDefault: lang.id === id,
          updatedAt: lang.id === id ? new Date() : lang.updatedAt,
        }));
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to set default language";
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
      getDefaultLanguage,
      isLoading,
      getError,
      fetchLanguages,
      addLanguage,
      updateLanguage,
      deleteLanguage,
      setDefaultLanguage,
      clearError,
    };
  },
  {
    persist: true,
  }
);
