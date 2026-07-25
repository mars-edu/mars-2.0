import type { Id } from "@convex/_generated/dataModel";


export interface Discipline {
  _id: Id<"disciplines">;
  _creationTime: number;
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
  createdAt: string;
  updatedAt: string;
  isHighlighted?: boolean;
}


export interface AddDisciplinePayload {
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
}
