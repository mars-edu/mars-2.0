import { z } from "zod";

export const finalControlSchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите полное название"),
  shortName: z.string().min(1, "Пожалуйста, введите краткое название"),
});

export const intermediateControlSchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите полное название"),
  shortName: z.string().min(1, "Пожалуйста, введите краткое название"),
});

const dateRangeRefine = (data: { startDate: Date[]; endDate: Date[] }) =>
  data.startDate.length > 0 &&
  data.endDate.length > 0 &&
  data.endDate[0] >= data.startDate[0];

const dateRangeRefineMessage = {
  message: "Дата окончания должна быть позже даты начала",
  path: ["endDate"] as string[],
};

export const scheduledControlSchema = z
  .object({
    controlId: z.string().min(1, "Пожалуйста, выберите форму контроля"),
    shortName: z.string().min(1, "Пожалуйста, введите название"),
    startDate: z.array(z.date()).min(1, "Пожалуйста, укажите дату начала"),
    endDate: z.array(z.date()).min(1, "Пожалуйста, укажите дату окончания"),
  })
  .refine(dateRangeRefine, dateRangeRefineMessage);
