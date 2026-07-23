

export interface DistributionEntry {
  id: string;
  academicYearId: string;
  semesterId: string;
  hours: string;
  srsHours?: string;
  srspHours?: string;
  individualHours?: string;
  intermediateControlId?: string | null;
  finalControlId?: string | null;
  examEnabled?: boolean;
  creditEnabled?: boolean;
  controlLessonEnabled?: boolean;
}


export interface RupEntry {
  id: string;
  specialtyIds: string[]; // Changed from specialtyId to specialtyIds array
  academicYearId: string;
  baseClass: number[]; // e.g. [9], [11], or [9, 11]
  language: string;
  groupId?: string;
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
  totalCredits: string;
  totalHours: string;
  groupHours: string;
  theoreticalHours: string;
  labPracticalHours: string;
  field3Value: string;
  srspHours: string;
  srsHours: string;
  trainingPracticeHours: string;
  individualHours: string;
  individualAdditionalHours: string;
  distributionEntries: DistributionEntry[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
}
