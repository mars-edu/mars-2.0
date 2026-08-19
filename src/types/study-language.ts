/** Last-resort constant for the (rare) case the store hasn't loaded yet. */
export const DEFAULT_STUDY_LANGUAGE_CODE = "ru";

export interface StudyLanguage {
  id: string;
  code: string;
  name: string;
  shortName?: string;
  /** Hex/tailwind token for the pill in RupLanguageTabs. */
  color?: string;
  /** Exactly one language should have this set — the legacy fallback. */
  isDefault: boolean;
  /** Display ordering. */
  order?: number;
  createdAt: Date;
  updatedAt: Date;
}
