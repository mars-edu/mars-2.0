import {
  f7_month_jan, f7_month_feb, f7_month_mar, f7_month_apr,
  f7_month_may, f7_month_jun, f7_month_jul, f7_month_aug,
  f7_month_sep, f7_month_oct, f7_month_nov, f7_month_dec,
  f7_month_jan_short, f7_month_feb_short, f7_month_mar_short, f7_month_apr_short,
  f7_month_may_short, f7_month_jun_short, f7_month_jul_short, f7_month_aug_short,
  f7_month_sep_short, f7_month_oct_short, f7_month_nov_short, f7_month_dec_short,
  f7_day_sun, f7_day_mon, f7_day_tue, f7_day_wed,
  f7_day_thu, f7_day_fri, f7_day_sat,
  f7_day_sun_short, f7_day_mon_short, f7_day_tue_short, f7_day_wed_short,
  f7_day_thu_short, f7_day_fri_short, f7_day_sat_short,
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

export const DATE_UI_FORMAT = "DD/MM/YYYY"; // visible to users
export const DATE_STORAGE_FORMAT = "YYYY-MM-DD"; // persisted/ISO-like
export const DATE_DAY_MONTH_FORMAT = "DD.MM"; // for compact table labels
export const DATE_YEAR_FORMAT = "YYYY"; // for compact table labels
export const DATE_PICKER_VALUE_FORMAT = "dd/mm/yyyy"; // Framework7 calendar format (numeric month)

const DATE_PICKER_PARAMS_BASE = {
  closeOnSelect: true,
  dateFormat: DATE_PICKER_VALUE_FORMAT,
  rangePicker: false,
  multiple: false,
  firstDay: 1,
};

export function getDatePickerParams() {
  return {
    ...DATE_PICKER_PARAMS_BASE,
    monthNames: [
      f7_month_jan(), f7_month_feb(), f7_month_mar(), f7_month_apr(),
      f7_month_may(), f7_month_jun(), f7_month_jul(), f7_month_aug(),
      f7_month_sep(), f7_month_oct(), f7_month_nov(), f7_month_dec(),
    ],
    monthNamesShort: [
      f7_month_jan_short(), f7_month_feb_short(), f7_month_mar_short(), f7_month_apr_short(),
      f7_month_may_short(), f7_month_jun_short(), f7_month_jul_short(), f7_month_aug_short(),
      f7_month_sep_short(), f7_month_oct_short(), f7_month_nov_short(), f7_month_dec_short(),
    ],
    dayNames: [
      f7_day_sun(), f7_day_mon(), f7_day_tue(), f7_day_wed(),
      f7_day_thu(), f7_day_fri(), f7_day_sat(),
    ],
    dayNamesShort: [
      f7_day_sun_short(), f7_day_mon_short(), f7_day_tue_short(), f7_day_wed_short(),
      f7_day_thu_short(), f7_day_fri_short(), f7_day_sat_short(),
    ],
  };
}
