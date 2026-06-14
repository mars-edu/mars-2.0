import type { Id } from "@convex/_generated/dataModel";


export interface SubstitutionEntry {
  type: "substitution";
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
  journal?: any;
  fromTeacher?: { _id: string; firstName: string; surname: string; patronymic: string };
  toTeacher?: { _id: string; firstName: string; surname: string; patronymic: string };
  disciplineName?: string;
}


export interface MakeupRequestEntry {
  type: "makeup_request";
  _id: Id<"makeupRequests">;
  journalId: Id<"journals">;
  teacherId: string;
  createdBy: Id<"users">;
  reason?: string;
  dates: Array<{
    existingDate: string;
    newDate: string;
    startScheduleId: string;
    endScheduleId: string;
  }>;
  status: "pending" | "accepted" | "rejected";
  rejectionReason?: string;
  journalSnapshot?: { disciplineName: string; groupName?: string };
  teacher?: { _id: string; firstName: string; surname: string; patronymic: string };
  createdAt: number;
  updatedAt: number;
}
