
export interface ParsedLesson {
  lessonNumber: string;
  topic: string;
  hours: number;
  subject?: string;
  lessonType?: string;
  homework?: string;
  notes?: string;
}


export interface Ktp {
  id: string;
  rupEntryId: string;
  academicYearId: string;
  semesterId: string;
  eventId?: string; // Back-reference to the calendar event (if KTP is event-specific)
  name?: string; // Optional custom name for the KTP
  color?: string; // hex, e.g. '#FACC15'
  languages?: string[]; // subset of ['KZ','RU','EN']
  createdAt: Date;
  updatedAt: Date;
}


export interface KtpDetail {
  id: string;
  ktpId: string;
  position: number;
  theme: string;
  totalHours: number | null;
  srsp: number | null;
  srs: number | null;
  theoretical: number | null;
  practical: number | null;
  individual: number | null;
  homework: string;
  notes: string;
}
