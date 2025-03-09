import { ref, computed } from "vue";

export interface Language {
  code: string;
  name: string;
}

export function useLanguage(initialLanguage: string = "ru") {
  const activeLanguage = ref(initialLanguage);
  const availableLanguages = ref<Language[]>([
    { code: "kz", name: "Kazakh" },
    { code: "ru", name: "Russian" },
  ]);

  const setLanguage = (code: string) => {
    if (availableLanguages.value.some((lang) => lang.code === code)) {
      activeLanguage.value = code;
    }
  };

  const currentLanguage = computed(() =>
    availableLanguages.value.find((lang) => lang.code === activeLanguage.value)
  );

  const addLanguage = (language: Language) => {
    if (!availableLanguages.value.some((lang) => lang.code === language.code)) {
      availableLanguages.value.push(language);
    }
  };

  return {
    activeLanguage,
    availableLanguages,
    currentLanguage,
    setLanguage,
    addLanguage,
  };
}
