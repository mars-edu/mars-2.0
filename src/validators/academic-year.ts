import { z } from "zod";

export const academicYearSchema = z
  .object({
    startYear: z
      .number({
        error: "Пожалуйста, введите год начала",
      })
      .int()
      .positive("Год начала должен быть положительным числом"),
    endYear: z
      .number({
        error: "Пожалуйста, введите год окончания",
      })
      .int()
      .positive("Год окончания должен быть положительным числом"),
    isActive: z.boolean(),
  })
  .refine((data) => data.endYear > data.startYear, {
    message: "Год окончания должен быть больше года начала",
    path: ["endYear"],
  });

export const academicYearSemesterSchema = z
  .object({
    semesterId: z
      .string()
      .min(1, "Пожалуйста, выберите семестр"),
    startDate: z
      .array(z.date())
      .min(1, "Пожалуйста, укажите дату начала")
      .refine(
        (dates) => dates.length > 0 && !isNaN(dates[0].getTime()),
        "Дата начала указана некорректно"
      ),
    endDate: z
      .array(z.date())
      .min(1, "Пожалуйста, укажите дату окончания")
      .refine(
        (dates) => dates.length > 0 && !isNaN(dates[0].getTime()),
        "Дата окончания указана некорректно"
      ),
  })
  .refine(
    (data) =>
      data.startDate.length > 0 &&
      data.endDate.length > 0 &&
      !isNaN(data.startDate[0].getTime()) &&
      !isNaN(data.endDate[0].getTime()) &&
      data.endDate[0] >= data.startDate[0],
    {
      message: "Дата окончания должна быть позже даты начала",
      path: ["endDate"],
    }
  );
