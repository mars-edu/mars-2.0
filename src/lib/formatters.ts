/**
 * Canonical name and date formatting utilities.
 */

export interface PersonNameLike {
  surname?: string;
  lastName?: string;
  firstName?: string;
  patronymic?: string;
  middleName?: string;
}

/**
 * Formats full name: "Фамилия Имя Отчество"
 */
export function formatFullName(
  person: PersonNameLike | null | undefined,
  fallback = ""
): string {
  if (!person) return fallback;

  const last = person.surname ?? person.lastName ?? "";
  const first = person.firstName ?? "";
  const mid = person.patronymic ?? person.middleName ?? "";

  const formatted = [last, first, mid].map((s) => s.trim()).filter(Boolean).join(" ");
  return formatted || fallback;
}

/**
 * Formats name with initials: "Фамилия И. О."
 */
export function formatNameWithInitials(
  person: PersonNameLike | null | undefined,
  fallback = ""
): string {
  if (!person) return fallback;

  const last = (person.surname ?? person.lastName ?? "").trim();
  const first = (person.firstName ?? "").trim();
  const mid = (person.patronymic ?? person.middleName ?? "").trim();

  if (!last) return first || fallback;

  const firstInit = first ? `${first.charAt(0)}.` : "";
  const midInit = mid ? `${mid.charAt(0)}.` : "";
  const initials = [firstInit, midInit].filter(Boolean).join(" ");

  return initials ? `${last} ${initials}` : last;
}
