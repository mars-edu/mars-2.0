import { ref, computed, type Ref } from "vue";
import { rupEntrySchema } from "@/validators/rup";
import type { LanguageTexts } from "@/composables/useLanguageVariants";

/**
 * Owns the RUP-entry form's coordination bits (extracted from RupEntryPopup,
 * spec P3 composables step 3):
 *
 * - the edited `editedEntry` ref (created via a caller-supplied factory so the store
 *   dependency stays with the popup, not the composable);
 * - per-language zod validation (all selected tabs, not just active), with
 *   `[<lang>]` error-message prefixing;
 * - dirty-tracking baseline + comparison helpers.
 *
 * Language/specialty state is READ through getters so the popup keeps a
 * single source of truth (useLanguageVariants + local selectedSpecialtyIds).
 */
export interface UseRupEntryFormOptions<Entry> {
  createEmpty: () => Entry;
  selectedSpecialtyIds: Ref<string[]>;
  selectedLanguages: Ref<string[]>;
  languageTexts: Ref<LanguageTexts>;
  getLanguageName: (code: string) => string;
}

export function useRupEntryForm<Entry extends Record<string, unknown> & {
  distributionEntries?: unknown[];
}>(opts: UseRupEntryFormOptions<Entry>) {
  const editedEntry = ref<Entry>(opts.createEmpty()) as Ref<Entry>;

  // --- Validation: iterate every selected language tab; first failing wins.
  const validationResult = computed(() => {
    const s = editedEntry.value;
    if (!s) {
      return { success: false, error: { issues: [{ message: "Нет данных" }] } };
    }
    for (const lang of opts.selectedLanguages.value) {
      const texts =
        opts.languageTexts.value[lang] ?? {
          moduleIndex: "",
          moduleName: "",
          learningOutcome: "",
        };
      const parsed = rupEntrySchema.safeParse({
        moduleIndex: texts.moduleIndex,
        moduleName: texts.moduleName,
        learningOutcome: texts.learningOutcome,
        totalCredits: String(s["totalCredits"] ?? ""),
        totalHours: String(s["totalHours"] ?? ""),
        groupHours: String(s["groupHours"] ?? ""),
        theoreticalHours: String(s["theoreticalHours"] ?? ""),
        labPracticalHours: String(s["labPracticalHours"] ?? ""),
        field3Value: String(s["field3Value"] ?? ""),
        srspHours: String(s["srspHours"] ?? ""),
        srsHours: String(s["srsHours"] ?? ""),
        trainingPracticeHours: String(s["trainingPracticeHours"] ?? ""),
        individualHours: String(s["individualHours"] ?? ""),
        individualAdditionalHours: String(s["individualAdditionalHours"] ?? ""),
        distributionEntries: s.distributionEntries,
      });
      if (!parsed.success) {
        const langLabel = opts.getLanguageName(lang);
        const issues = parsed.error.issues.map((i) => ({
          ...i,
          message: `[${langLabel}] ${i.message}`,
        }));
        return { success: false, error: { issues } } as typeof parsed;
      }
    }
    return { success: true } as { success: true };
  });

  const formError = computed(() => {
    if (validationResult.value.success) return "";
    const issues = validationResult.value.error.issues;
    return issues.length > 0 ? issues[0].message : "";
  });

  const isFormValid = computed(() => validationResult.value.success);

  // --- Dirty-tracking: JSON snapshot of everything the user could edit.
  let dirtyBaseline = "";

  function serializeFormState(): string {
    return JSON.stringify({
      editedEntry: editedEntry.value,
      selectedSpecialtyIds: opts.selectedSpecialtyIds.value,
      selectedLanguages: [...opts.selectedLanguages.value].sort(),
      languageTexts: opts.languageTexts.value,
    });
  }
  function captureBaseline() {
    dirtyBaseline = serializeFormState();
  }
  function isFormDirty(): boolean {
    return serializeFormState() !== dirtyBaseline;
  }

  return {
    editedEntry,
    validationResult,
    formError,
    isFormValid,
    captureBaseline,
    isFormDirty,
  };
}
