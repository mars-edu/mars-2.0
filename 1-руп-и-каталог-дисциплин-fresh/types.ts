import { LucideIcon } from "lucide-react";
import React from 'react';

// --- New Types (RUP/Disciplines) ---

export interface SidebarItem {
  id: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  type?: 'link' | 'spacer';
}

export interface Semester {
  id: number;
  year: string;
  semester: string;
  hours: string;
  groupHours: string;
  srsHours: string;
  srspHours: string;
  practiceHours: string;
  individualHours: string;
  control: string;
}

export interface LocalizedSubjectInfo {
  code: string;
  title: string;
  subtitle: string;
}

export interface Subject {
  id: number;
  // Display fields (fallback or primary language)
  code: string;
  title: string;
  subtitle: string;
  
  semesters?: Semester[];
  
  // New fields for "Connect" functionality and data persistence
  base?: '9' | '11';
  
  // Multilingual support
  languages?: ('kz' | 'ru' | 'en')[]; 
  localizedInfo?: Record<string, LocalizedSubjectInfo>;
  
  creationYear?: string; // Год поступления/создания
  selectedSpecialties?: string[];
  isFreeFilter?: boolean; // Свободный фильтр
  
  // Saved form data
  credits?: string;
  totalHours?: string;
  theoretical?: string;
  labPractice?: string;
  three?: string;
  srsp?: string;
  srs?: string;
  practice?: string;
  individual?: string;
  individualMain?: string;
}

export interface Specialty {
  id: string;
  label: string;
  code?: string;
  name?: string;
  hasInfo: boolean;
}

// --- Old Types (Restored) ---

export type Gender = 'male' | 'female';

export type StudentStatus = 'active' | 'expelled' | 'academic_leave' | 'graduated' | 'debt';

export interface MovementHistory {
  date: string;
  type: 'enrollment' | 'transfer' | 'promotion' | 'expulsion' | 'status_change';
  orderNumber: string; // Номер приказа
  description: string; // Детали (например, "с ВТ на ИС")
}

export interface Student {
  id: number;
  fullName: string; // ФИО
  specialty: string; // Специальность code (e.g., P, B, T)
  language: string; // ru, kz
  course: number;
  gender: Gender;
  status: StudentStatus;
  history: MovementHistory[];
  
  // Additional fields for the form/details
  surname?: string;
  name?: string;
  patronymic?: string;
  admissionYear?: number;
  base?: string;
}

export interface ProtocolEvent {
  id: number;
  date: string; // ISO Date YYYY-MM-DD
  formattedDate: string; // Display string like "Суббота, 3 января 2026 года"
  title: string;
  description: string;
  source?: string;
  type: 'info' | 'request' | 'appeal' | 'system';
  status: 'pending' | 'approved' | 'rejected' | 'info';
  timestamp: string; // HH:MM (Submission time)
  processedAt?: string; // HH:MM (Admin action time)
  metadata?: {
    studentIds: number[];
    retakeType: string; // 'rk1', 'rk2', 'exam'
  };
}

export interface StudentInfo {
  id: string | number;
  name: string;
  fullName?: string;
  specialty: string;
  course: string | number;
  status?: StudentStatus;
  score?: number;
}

export interface Journal {
    id: number;
    title: string;
    description: string;
    type: 'course' | 'mixed' | 'individual';
    courseNumber?: number; // 1, 2, 3, 4
    studentCount: number;
    color: string;
    icon?: React.ReactNode; // Optional because we can't easily serialize it, but for now it's fine
}

export interface Rup {
  id: number;
  specialty: string;
  course: number;
  semester: number;
  discipline: string;
  lectureHours: number;
  practiceHours: number;
  labHours: number;
  credits: number;
  controlForm: 'exam' | 'credit' | 'diff_credit';
}

export enum DayOfWeek {
  MON = 'ПН',
  TUE = 'ВТ',
  WED = 'СР',
  THU = 'ЧТ',
  FRI = 'ПТ',
  SAT = 'СБ',
  SUN = 'ВС'
}

export interface DayTime {
  start: string;
  end: string;
}

export interface IndividualJournal {
  id: string;
  studentIds: string[];
  days: DayOfWeek[];
  dayTimes: Record<string, DayTime[]>;
  rupKtp: string;
}

export interface ScheduleFormData {
  discipline: string;
  course: string;
  group: string;
  customPeriod: boolean;
  customPeriodValue: string;
  period: string;
  semester: string;
  students: string[]; // List of student IDs
  color: string;
  days: DayOfWeek[];
  dayTimes: Record<string, DayTime[]>;
  rupKtp: string;
  useIndividualJournals: boolean;
  individualJournals: IndividualJournal[];
  gradingType: 'combined' | 'separate' | '';
}
