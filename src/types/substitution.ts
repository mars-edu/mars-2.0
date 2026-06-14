import type { Id } from "@convex/_generated/dataModel";
import type { SubstitutionStatus } from "@/constants/substitution";

export interface EnrichedSubstitution {
  _id: Id<"substitutions">;
  journalId: Id<"journals">;
  fromTeacherId: string;
  toTeacherId: string;
  toUserId: Id<"users">;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  isPrimary?: boolean;
  status: SubstitutionStatus;
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
  journal: { _id: Id<"journals">; calendarEventId?: string; [key: string]: any } | null;
  fromTeacher: { _id: string; surname: string; firstName: string; patronymic?: string; [key: string]: any } | undefined;
  toTeacher: { _id: string; surname: string; firstName: string; patronymic?: string; [key: string]: any } | undefined;
}
