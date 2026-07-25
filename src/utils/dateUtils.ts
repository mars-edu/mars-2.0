import dayjs from 'dayjs';
import { DATE_UI_FORMAT } from '@/constants/calendar';

// Date and time format constants
export const DATE_FORMAT = DATE_UI_FORMAT; // DD.MM.YYYY
export const DATE_TIME_FORMAT = `${DATE_UI_FORMAT} HH:mm`; // DD.MM.YYYY HH:mm

export const formatDateTime = (timestamp: string | number): string => {
  return dayjs(timestamp).format(DATE_TIME_FORMAT);
};

export const formatDate = (date: string | number): string => {
  return dayjs(date).format(DATE_FORMAT);
};