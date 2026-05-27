import { defineStore } from "pinia";
import { ref } from "vue";
import { setLocale as setParaglideLocale } from "@/paraglide/runtime";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useUserStore } from "@/stores/userStore";
import type { Id } from "@convex/_generated/dataModel";

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
      setParaglideLocale(code, { reload: false });
      locale.value = code;
      // Sync to backend (fire-and-forget)
      syncLocaleToBackend(code);
    }

    function initialize() {
      setParaglideLocale(locale.value, { reload: false });
    }

    async function syncLocaleToBackend(code: LocaleCode) {
      try {
        const userStore = useUserStore();
        const userId = userStore.currentUser?.userId;
        if (!userId) return;
        await convex.mutation(api.users.mutations.updateLocale, {
          userId: userId as Id<"users">,
          locale: code,
        });
      } catch (err) {
        console.warn("[localeStore] Failed to sync locale to backend:", err);
      }
    }

    return {
      locale,
      setLocale,
      initialize,
      syncLocaleToBackend,
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
