import { ref } from "vue";
import { useStudyLanguageStore } from "@/stores/studyLanguageStore";
import { DEFAULT_STUDY_LANGUAGE_CODE } from "@/types/study-language";

/** Per-language text fields keyed by language code. */
export type LanguageTexts = Record<
  string,
  { moduleIndex: string; moduleName: string; learningOutcome: string }
>;

interface VariantLike {
  id: string;
  language?: string;
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
}

interface SaveVariant {
  id?: string;
  language: string;
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
}

/**
 * Owns the RUP-entry language-variants state (extracted from RupEntryPopup,
 * spec P3 composables). Handles selection, per-language texts, the map of
 * existing variant ids (for update vs insert), plus the load/reset/build
 * helpers that used to sit inline in the popup's watch + submit.
 *
 * Kept as a plain composable (not tied to a store) so tests can drive it
 * directly and future callers (RupEntryForm.vue eventually) don't have to
 * hand-thread four refs + four helpers.
 */
export function useLanguageVariants() {
  const languageStore = useStudyLanguageStore();

  function defaultLanguageCode(): string {
    return languageStore.getDefaultLanguage?.code ?? DEFAULT_STUDY_LANGUAGE_CODE;
  }

  const selectedLanguages = ref<string[]>([defaultLanguageCode()]);
  const activeLanguageTab = ref(defaultLanguageCode());
  const languageTexts = ref<LanguageTexts>({
    [defaultLanguageCode()]: { moduleIndex: "", moduleName: "", learningOutcome: "" },
  });
  const editVariantIds = ref<Record<string, string>>({});

  function getLanguageName(code: string): string {
    return languageStore.languages.find((l) => l.code === code)?.name ?? code;
  }

  /** Reset to the create-mode default (single default-language variant, no ids). */
  function reset() {
    const code = defaultLanguageCode();
    selectedLanguages.value = [code];
    activeLanguageTab.value = code;
    languageTexts.value = { [code]: { moduleIndex: "", moduleName: "", learningOutcome: "" } };
    editVariantIds.value = {};
  }

  /**
   * Populate state from a group of existing variants loaded for edit.
   * `primaryLanguage` is the clicked variant's language (drives active tab).
   */
  function loadFromVariants(variants: VariantLike[], primaryLanguage?: string) {
    if (variants.length === 0) return;
    const langs = variants.map((v) => v.language || "ru");
    selectedLanguages.value = [...new Set(langs)];
    activeLanguageTab.value = primaryLanguage || langs[0];

    const texts: LanguageTexts = {};
    const ids: Record<string, string> = {};
    for (const v of variants) {
      const lang = v.language || "ru";
      texts[lang] = {
        moduleIndex: v.moduleIndex,
        moduleName: v.moduleName,
        learningOutcome: v.learningOutcome,
      };
      ids[lang] = v.id;
    }
    languageTexts.value = texts;
    editVariantIds.value = ids;
  }

  /** Build the `variants[]` payload for `saveRupEntryGroup`. */
  function buildSaveVariants(): SaveVariant[] {
    return selectedLanguages.value.map((lang) => {
      const texts = languageTexts.value[lang] ?? { moduleIndex: "", moduleName: "", learningOutcome: "" };
      const id = editVariantIds.value[lang];
      return {
        ...(id ? { id } : {}),
        language: lang,
        moduleIndex: texts.moduleIndex,
        moduleName: texts.moduleName,
        learningOutcome: texts.learningOutcome,
      };
    });
  }

  /** Variant ids of languages the user deselected during edit → to be deleted. */
  function buildRemovedVariantIds(): string[] {
    return Object.entries(editVariantIds.value)
      .filter(([lang]) => !selectedLanguages.value.includes(lang))
      .map(([, id]) => id);
  }

  return {
    selectedLanguages,
    activeLanguageTab,
    languageTexts,
    editVariantIds,
    getLanguageName,
    reset,
    loadFromVariants,
    buildSaveVariants,
    buildRemovedVariantIds,
  };
}
