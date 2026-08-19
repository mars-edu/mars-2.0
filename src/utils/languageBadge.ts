import { useStudyLanguageStore } from "@/stores/studyLanguageStore";

const FALLBACK_BADGE_STYLES: Record<string, string> = {
  ru: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400",
  kk: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400",
  en: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400",
};

/**
 * Returns formatted label for a language code (e.g. shortName if present, or "KZ", "RU", etc.)
 */
export function getLanguageLabel(code?: string | null): string {
  if (!code) return "—";
  const languageStore = useStudyLanguageStore();
  const lang = languageStore.getByCode(code);
  if (lang?.shortName) return lang.shortName;
  if (lang?.name) return lang.name;
  if (code.toLowerCase() === "kk") return "KZ";
  return code.toUpperCase();
}

/**
 * Returns badge class or fallback styling for a language code.
 */
export function getLanguageBadgeClass(code?: string | null): string {
  if (!code) return "bg-muted text-muted-foreground";
  const lower = code.toLowerCase();
  return (
    FALLBACK_BADGE_STYLES[lower] ??
    "bg-muted text-muted-foreground dark:bg-muted/40"
  );
}
