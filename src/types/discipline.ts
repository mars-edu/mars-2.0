import type { Id } from "@convex/_generated/dataModel";


export interface Discipline {
  _id: Id<"disciplines">;
  _creationTime: number;
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
  createdAt: number;
  updatedAt: number;
  isHighlighted?: boolean;
}


export interface AddDisciplinePayload {
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
}
