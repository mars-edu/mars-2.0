import { readonly } from "vue";
import { useLocaleStore } from "@/stores/localeStore";
import type { LocaleCode } from "@/stores/localeStore";

export function useI18n() {
  const store = useLocaleStore();

  return {
    locale: readonly(store.locale),
    setLocale: (code: LocaleCode) => store.setLocale(code),
    availableLocales: store.availableLocales,
  };
}
