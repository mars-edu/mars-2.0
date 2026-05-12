import {
  home_welcome_fallback_name,
  home_welcome_morning,
  home_welcome_afternoon,
  home_welcome_evening,
  home_welcome_today_prefix,
  home_welcome_today_suffix,
  home_stats_semester,
  home_stats_no_semester,
  home_announcements_badge_info,
  home_announcements_badge_alert,
  home_announcements_badge_system,
  home_announcements_filter_all,
  home_announcements_filter_academic,
  home_announcements_filter_contests,
  home_announcements_filter_events,
  home_announcements_filter_system,
} from "@/paraglide/messages";

/**
 * Returns the full name of the user or a localized fallback.
 * The _locale parameter ensures Vue reactivity when used in computed properties.
 */
export const getUserFullName = (user: { firstName?: string; lastName?: string } | null | undefined, _locale: string): string => {
  const first = user?.firstName || home_welcome_fallback_name();
  const last = user?.lastName || "";
  return last ? `${first} ${last}` : first;
};

/**
 * Returns a localized greeting based on the current hour.
 */
export const getGreeting = (date: Date, _locale: string): string => {
  const hour = date.getHours();
  if (hour < 12) return home_welcome_morning();
  if (hour < 17) return home_welcome_afternoon();
  return home_welcome_evening();
};

/**
 * Returns a localized and formatted date string for the welcome section.
 */
export const formatWelcomeDate = (date: Date, locale: string): string => {
  const dateStr = date.toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  
  // Capitalize first letter of the day
  const capitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
  
  if (locale === 'ru') {
    return `${home_welcome_today_prefix()} ${capitalized.replace(" г.", "")} ${home_welcome_today_suffix()}`;
  }
  
  return `${home_welcome_today_prefix()} ${capitalized}`;
};

/**
 * Returns a localized semester label or a "no semester" fallback.
 */
export const getSemesterLabel = (semester: any | null | undefined, _locale: string): string => {
  return semester ? home_stats_semester() : home_stats_no_semester();
};

/**
 * Returns localized announcement types for the add modal.
 */
export const getAnnouncementTypes = (_locale: string) => [
  { id: 'info', label: home_announcements_badge_info() },
  { id: 'alert', label: home_announcements_badge_alert() },
  { id: 'system', label: home_announcements_badge_system() },
];

/**
 * Returns localized announcement filters.
 */
export const getAnnouncementFilters = (_locale: string) => [
  { id: "all", label: home_announcements_filter_all() },
  { id: "academic", label: home_announcements_filter_academic() },
  { id: "contests", label: home_announcements_filter_contests() },
  { id: "events", label: home_announcements_filter_events() },
  { id: "system", label: home_announcements_filter_system() },
];

/**
 * Calculates the current academic week number from a start date.
 */
export const getCurrentWeekNumber = (startDate: string | Date | null | undefined): number => {
  if (!startDate) return 0;
  const start = new Date(startDate);
  const today = new Date();
  const diff = today.getTime() - start.getTime();
  return Math.max(1, Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1);
};
