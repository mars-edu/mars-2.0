import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";

export const isFutureDate = (isoDate: string | undefined): boolean => {
  if (!isoDate) return false;
  return dayjs(isoDate, DATE_STORAGE_FORMAT).isAfter(dayjs().startOf('day'));
};

export const isPastDate = (isoDate: string | undefined): boolean => {
  if (!isoDate) return false;
  const today = dayjs().startOf('day');
  const cellDate = dayjs(isoDate, DATE_STORAGE_FORMAT);
  return cellDate.isValid() && cellDate.isBefore(today);
};
