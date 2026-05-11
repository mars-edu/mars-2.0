import * as m from "@/paraglide/messages";

/**
 * Returns the full name of the user or a localized fallback.
 */
export const getUserFullName = (user: { firstName?: string; lastName?: string } | null | undefined): string => {
  const first = user?.firstName || m.home_welcome_fallback_name();
  const last = user?.lastName || "";
  return last ? `${first} ${last}` : first;
};

/**
 * Returns a localized greeting based on the current hour.
 */
export const getGreeting = (date: Date): string => {
  const hour = date.getHours();
  if (hour < 12) return m.home_welcome_morning();
  if (hour < 17) return m.home_welcome_afternoon();
  return m.home_welcome_evening();
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
    return `${m.home_welcome_today_prefix()} ${capitalized.replace(" г.", "")} ${m.home_welcome_today_suffix()}`;
  }
  
  return `${m.home_welcome_today_prefix()} ${capitalized}`;
};

/**
 * Returns a localized semester label or a "no semester" fallback.
 */
export const getSemesterLabel = (semester: any | null | undefined): string => {
  return semester ? m.home_stats_semester() : m.home_stats_no_semester();
};

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
