

export interface MakeupDateEntry {
  existingDate: string;
  newDate: string;
  startScheduleId: string;
  endScheduleId: string;
}

export interface MakeupHoursData {
  reason: string;
  dates: MakeupDateEntry[];
}
