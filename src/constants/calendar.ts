import {
  f7_day_sun, f7_day_mon, f7_day_tue, f7_day_wed,
  f7_day_thu, f7_day_fri, f7_day_sat,
  f7_week_abbr_mon, f7_week_abbr_tue, f7_week_abbr_wed, f7_week_abbr_thu,
  f7_week_abbr_fri, f7_week_abbr_sat, f7_week_abbr_sun,
} from "@/paraglide/messages";

export function getWeekDays() {
  return [
    { weekId: 0, abbreviation: f7_week_abbr_mon(), name: f7_day_mon() },
    { weekId: 1, abbreviation: f7_week_abbr_tue(), name: f7_day_tue() },
    { weekId: 2, abbreviation: f7_week_abbr_wed(), name: f7_day_wed() },
    { weekId: 3, abbreviation: f7_week_abbr_thu(), name: f7_day_thu() },
    { weekId: 4, abbreviation: f7_week_abbr_fri(), name: f7_day_fri() },
    { weekId: 5, abbreviation: f7_week_abbr_sat(), name: f7_day_sat() },
    { weekId: 6, abbreviation: f7_week_abbr_sun(), name: f7_day_sun() },
  ];
}

export const DATE_UI_FORMAT = "DD.MM.YYYY"; // visible to users (Russian convention)
export const DATE_STORAGE_FORMAT = "YYYY-MM-DD"; // persisted/ISO-like
export const DATE_DAY_MONTH_FORMAT = "DD.MM"; // for compact table labels
export const DATE_YEAR_FORMAT = "YYYY"; // for compact table labels
