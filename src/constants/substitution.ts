/**
 * Single source of truth for substitution statuses.
 *
 * NOTE: The Convex schema (convex/schema.ts) defines the same statuses as union
 * literals but cannot import from src/ due to build boundaries.
 * Keep convex/schema.ts in sync manually when adding new statuses here.
 */

export const SUBSTITUTION_STATUSES = [
  "pending",
  "accepted",
  "rejected",
  "completed",
  "cancelled",
] as const;

export type SubstitutionStatus = (typeof SUBSTITUTION_STATUSES)[number];

export const SUBSTITUTION_STATUS_LABELS: Record<SubstitutionStatus, string> = {
  pending: "Ожидает",
  accepted: "Принята",
  rejected: "Отклонена",
  completed: "Завершена",
  cancelled: "Отменена",
};
