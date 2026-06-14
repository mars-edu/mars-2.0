import { computed, type ComputedRef, type Ref } from "vue";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/ru";

import {
  DATE_STORAGE_FORMAT,
  DATE_UI_FORMAT,
} from "@/constants/calendar";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { computeWeeklySlotHours } from "./scheduleHours";

dayjs.extend(customParseFormat);
dayjs.locale("ru");

export type WeekDaySchedule = {
  weekId: number;
  russianWeekDay: string;
  startId: string;
  endId: string;
};

export type SemesterDates = {
  startDate: string;
  endDate: string;
  semesterText?: string;
};

export function useEventFormDerived(args: {
  rupEntryId: Ref<string>;
  useCustomPeriod: Ref<boolean>;
  customStartDate: Ref<string>;
  customEndDate: Ref<string>;
  selectedWeekDays: Ref<WeekDaySchedule[]>;
  semesterId: Ref<string> | ComputedRef<string>;
}) {
  const academicYearSemesterStore = useAcademicYearSemesterStore();
  const rupEntryStore = useRupEntryStore();
  const educationScheduleStore = useEducationScheduleStore();

  const semester = computed(() => {
    const id = args.semesterId.value;
    if (!id) return null;
    return academicYearSemesterStore.getAcademicYearSemesterById(id) || null;
  });

  const semesterDates = computed<SemesterDates | null>(() => {
    if (!semester.value) return null;
    return {
      startDate: dayjs(semester.value.startDate, DATE_STORAGE_FORMAT).format(
        DATE_UI_FORMAT
      ),
      endDate: dayjs(semester.value.endDate, DATE_STORAGE_FORMAT).format(
        DATE_UI_FORMAT
      ),
      semesterText: `Семестр ${semester.value.semesterNumber}`,
    };
  });

  const effectiveStartDate = computed(() => {
    if (args.useCustomPeriod.value) {
      return args.customStartDate.value || null;
    }
    return semesterDates.value?.startDate ?? null;
  });

  const effectiveEndDate = computed(() => {
    if (args.useCustomPeriod.value) {
      return args.customEndDate.value || null;
    }
    return semesterDates.value?.endDate ?? null;
  });

  const dateValidationError = computed(() => {
    if (!args.useCustomPeriod.value) return null;

    if (!args.customStartDate.value || !args.customEndDate.value) return null;
    const start = dayjs(args.customStartDate.value, DATE_UI_FORMAT, true);
    const end = dayjs(args.customEndDate.value, DATE_UI_FORMAT, true);
    if (!start.isValid() || !end.isValid()) return null;

    if (!end.isAfter(start, "day")) {
      return "Дата окончания должна быть как минимум на один день позже даты начала";
    }

    return null;
  });

  const totalPlannedHours = computed(() => {
    const item = rupEntryStore.getRupEntryById(args.rupEntryId.value);
    return item?.totalHours || "0";
  });

  const semesterPlannedHours = computed(() => {
    const item = rupEntryStore.getRupEntryById(args.rupEntryId.value);
    if (!item || !semester.value) return "0";

    const semesterNumber = String(semester.value.semesterNumber ?? "");
    const activeYearId = semester.value.academicYearId;

    const matchedEntry = item.distributionEntries.find((entry: any) => {
      const entrySemesterId = String((entry as any).semesterId ?? "");
      const matchesSemester =
        entrySemesterId === String(semester.value?.id ?? "") ||
        entrySemesterId === semesterNumber;
      const matchesYear =
        !entry.academicYearId || !activeYearId
          ? matchesSemester
          : entry.academicYearId === activeYearId && matchesSemester;
      return matchesYear;
    });

    if (!matchedEntry?.hours) return "0";
    return String(matchedEntry.hours);
  });

  const weekCount = computed(() => {
    const startUi = effectiveStartDate.value;
    const endUi = effectiveEndDate.value;
    if (!startUi || !endUi) return 0;

    const start = dayjs(startUi, DATE_UI_FORMAT, true);
    const end = dayjs(endUi, DATE_UI_FORMAT, true);
    if (!start.isValid() || !end.isValid()) return 0;

    const daysDiff = end.diff(start, "day") + 1;
    return daysDiff > 0 ? Math.ceil(daysDiff / 7) : 0;
  });

  const selectedHours = computed(() => {
    if (weekCount.value <= 0) return "0";
    const scheduleIds = educationScheduleStore.getActiveYearSchedules.map(
      (s) => s.id
    );
    const hoursPerWeek = computeWeeklySlotHours(
      args.selectedWeekDays.value,
      scheduleIds
    );
    return String(hoursPerWeek * weekCount.value);
  });

  const isSelectedHoursExceeded = computed(() => {
    return Number(selectedHours.value) > Number(semesterPlannedHours.value);
  });

  const hoursExceededError = computed(() => {
    if (!isSelectedHoursExceeded.value) return null;
    return `Выбранное количество часов (${selectedHours.value}) превышает запланированное на семестр (${semesterPlannedHours.value})`;
  });

  const slotTimeError = computed(() => {
    const schedules = educationScheduleStore.getActiveYearSchedules;
    for (const day of args.selectedWeekDays.value) {
      if (!day.startId || !day.endId) continue;
      const startIndex = schedules.findIndex((s) => s.id === day.startId);
      const endIndex = schedules.findIndex((s) => s.id === day.endId);
      if (startIndex !== -1 && endIndex !== -1 && endIndex < startIndex) {
        return `Время окончания в ${day.russianWeekDay} должно быть позже времени начала`;
      }
    }
    return null;
  });

  const isValid = computed(() => {
    if (!args.semesterId.value) return false;
    if (!args.rupEntryId.value) return false;
    if (!effectiveStartDate.value || !effectiveEndDate.value) return false;
    if (isSelectedHoursExceeded.value) return false;
    if (slotTimeError.value) return false;

    if (!args.useCustomPeriod.value) {
      return !!semesterDates.value;
    }

    const start = dayjs(args.customStartDate.value, DATE_UI_FORMAT, true);
    const end = dayjs(args.customEndDate.value, DATE_UI_FORMAT, true);
    return start.isValid() && end.isValid() && end.isAfter(start, "day");
  });

  return {
    semester,
    semesterDates,
    effectiveStartDate,
    effectiveEndDate,
    dateValidationError,
    totalPlannedHours,
    semesterPlannedHours,
    weekCount,
    selectedHours,
    isSelectedHoursExceeded,
    hoursExceededError,
    slotTimeError,
    isValid,
  };
}

