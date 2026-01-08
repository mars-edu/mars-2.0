import dayjs from 'dayjs';
import { DATE_DAY_MONTH_FORMAT } from '@/constants/calendar';

// Date and time format constants
export const DATE_TIME_FORMAT = `${DATE_DAY_MONTH_FORMAT}.YYYY HH:mm`; // DD.MM.YYYY HH:mm

export const formatDateTime = (timestamp: number): string => {
  return dayjs(timestamp).format(DATE_TIME_FORMAT);
};