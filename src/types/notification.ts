import type { Id } from "@convex/_generated/dataModel";

export type NotificationType = "substitution" | "journal_closure" | "system";
export type NotificationStatus = "unread" | "read" | "archived";

export interface Notification {
  _id: Id<"notifications">;
  userId: Id<"users">;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  message: string;
  metadata?: {
    substitutionId?: Id<"substitutions">;
    journalId?: Id<"journals">;
    deadline?: string;
  };
  createdAt: number;
  readAt?: number;
}


export interface Substitution {
  _id: Id<"substitutions">;
  journalId: Id<"journals">;
  fromTeacherId: string;
  toTeacherId: string;
  toUserId: Id<"users">;
  startDate: string;
  endDate: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  reason?: string;
  serviceLetterNumber?: string;
  journalSnapshot?: {
    disciplineName: string;
    groupName?: string;
    course?: string;
    semester?: string;
  };
  createdBy: Id<"users">;
  acceptedAt?: number;
  rejectedAt?: number;
  createdAt: number;
  updatedAt: number;
}
