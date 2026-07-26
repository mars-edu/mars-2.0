import { z } from "zod";

export const sessionSchema = z
  .object({
    shortName: z.string().min(1, "Пожалуйста, введите краткое название сессии"),
    fullName: z.string().min(1, "Пожалуйста, введите полное название сессии"),
    startDate: z.array(z.date()).min(1, "Пожалуйста, укажите дату начала"),
    endDate: z.array(z.date()).min(1, "Пожалуйста, укажите дату окончания"),
  })
  .refine(
    (data) =>
      data.startDate.length > 0 &&
      data.endDate.length > 0 &&
      data.endDate[0] >= data.startDate[0],
    {
      message: "Дата окончания должна быть позже даты начала",
      path: ["endDate"],
    }
  );

export const vacationSchema = z
  .object({
    shortName: z.string().min(1, "Пожалуйста, введите краткое название каникул"),
    fullName: z.string().min(1, "Пожалуйста, введите полное название каникул"),
    startDate: z.array(z.date()).min(1, "Пожалуйста, укажите дату начала"),
    endDate: z.array(z.date()).min(1, "Пожалуйста, укажите дату окончания"),
  })
  .refine(
    (data) =>
      data.startDate.length > 0 &&
      data.endDate.length > 0 &&
      data.endDate[0] >= data.startDate[0],
    {
      message: "Дата окончания должна быть позже даты начала",
      path: ["endDate"],
    }
  );
