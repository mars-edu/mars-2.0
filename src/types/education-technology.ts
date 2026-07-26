// Re-export the shared default (already lives in academic-year.ts — kept
// there so existing calculator imports don't need to change).
export { DEFAULT_ACADEMIC_HOUR_MINUTES } from "@/types/academic-year";

export interface EducationTechnology {
  id: string;
  name: string;
  shortName?: string;
  /** Length of one academic hour in minutes for this technology (45 / 40 / 60...). */
  academicHourMinutes: number;
  /** Exactly one technology should have this set — the legacy fallback. */
  isDefault: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
