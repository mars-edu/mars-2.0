import { z } from "zod";

export const academicYearSchema = z
  .object({
    // Coerce so empty/null callers get the friendly "введите год" message
    // instead of Zod's generic "Expected number, received null" (raw z.number
    // rejects null and gives the ugly built-in error).
    startYear: z.coerce
      .number({ error: "Пожалуйста, введите год начала" })
      .int()
      .positive("Год начала должен быть положительным числом"),
    endYear: z.coerce
      .number({ error: "Пожалуйста, введите год окончания" })
      .int()
      .positive("Год окончания должен быть положительным числом"),
    isActive: z.boolean(),
    // Length of one academic hour in minutes. Optional (default 45 applied
    // at read-side via DEFAULT_ACADEMIC_HOUR_MINUTES). .catch(undefined)
    // turns blank/NaN/negative into "not set" without preprocess boilerplate.
    academicHourMinutes: z.coerce
      .number({ error: "Длительность академ. часа должна быть числом" })
      .int("Длительность академ. часа должна быть целым числом")
      .positive("Длительность академ. часа должна быть > 0")
      .max(180, "Длительность академ. часа не может быть больше 180 мин")
      .optional()
      .catch(undefined),
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
