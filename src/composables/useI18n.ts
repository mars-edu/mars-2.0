import { storeToRefs } from "pinia";
import { useLocaleStore } from "@/stores/localeStore";
import type { LocaleCode } from "@/stores/localeStore";

export function useI18n() {
  const store = useLocaleStore();
  const { locale } = storeToRefs(store);

  return {
    locale,
    setLocale: (code: LocaleCode) => store.setLocale(code),
    availableLocales: store.availableLocales,
  };
}
