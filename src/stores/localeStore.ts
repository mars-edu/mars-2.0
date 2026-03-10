import { defineStore } from "pinia";
import { ref } from "vue";
import { setLocale as setParaglideLocale } from "@/paraglide/runtime";

export type LocaleCode = "ru" | "kk" | "en";

export interface AvailableLocale {
  code: LocaleCode;
  name: string;
}

export const AVAILABLE_LOCALES: AvailableLocale[] = [
  { code: "ru", name: "Русский" },
  { code: "kk", name: "Қазақша" },
  { code: "en", name: "English" },
];

export const useLocaleStore = defineStore(
  "locale",
  () => {
    const locale = ref<LocaleCode>("ru");

    function setLocale(code: LocaleCode) {
      locale.value = code;
      setParaglideLocale(code, { reload: false });
    }

    function initialize() {
      setParaglideLocale(locale.value, { reload: false });
    }

    return {
      locale,
      setLocale,
      initialize,
      availableLocales: AVAILABLE_LOCALES,
    };
  },
  {
    persist: {
      storage: localStorage,
      key: "mars-locale",
    },
  }
);
