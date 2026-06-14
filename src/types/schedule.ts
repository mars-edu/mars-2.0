

export interface Lesson {
  id?: string | number;
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
  group: string;
  type: 'lecture' | 'seminar' | 'lab';
  color: string;
}


export interface ScheduleState {
  selectedDate: Date;
  scheduleData: Record<string, Lesson[]>;
}
