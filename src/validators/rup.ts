import { z } from "zod";
import { isHours } from "@/lib/rupHours";

export const distributionEntrySchema = z.object({
  academicYearId: z.string().min(1, "Учебный год обязателен"),
  semesterId: z.string().min(1, "Семестр обязателен"),
  hours: z
    .string()
    .refine(isHours, {
      message: "Объем часов должен быть положительным числом",
    })
    .optional(),
  finalControlId: z.string().nullable().optional(),
  examEnabled: z.boolean().optional(),
  creditEnabled: z.boolean().optional(),
  controlLessonEnabled: z.boolean().optional(),
});

export const rupEntrySchema = z.object({
  moduleIndex: z.string().min(1, "Индекс модуля обязателен"),
  moduleName: z.string().min(1, "Наименование модуля обязательно"),
  learningOutcome: z
    .string()
    .min(1, "Наименование результата обучения/дисциплина обязательно"),
  totalCredits: z
    .string()
    .refine(isHours, {
      message: "Кредиты должны быть положительным числом",
    })
    .optional(),
  totalHours: z
    .string()
    .refine(isHours, {
      message: "Общие часы должны быть положительным числом",
    })
    .optional(),
  groupHours: z
    .string()
    .refine(isHours, {
      message: "Групповые часы должны быть числом ≥ 0",
    })
    .optional(),
  theoreticalHours: z
    .string()
    .refine(isHours, {
      message: "Теоретические часы должны быть положительным числом",
    })
    .optional(),
  labPracticalHours: z
    .string()
    .refine(isHours, {
      message: "Лабораторно-практические часы должны быть положительным числом",
    })
    .optional(),
  field3Value: z
    .string()
    .refine(isHours, {
      message: "Поле 3 должно быть положительным числом",
    })
    .optional(),
  srspHours: z
    .string()
    .refine(isHours, {
      message: "Часы СРСП должны быть положительным числом",
    })
    .optional(),
  srsHours: z
    .string()
    .refine(isHours, {
      message: "Часы СРС должны быть положительным числом",
    })
    .optional(),
  trainingPracticeHours: z
    .string()
    .refine(isHours, {
      message: "Часы практики должны быть положительным числом",
    })
    .optional(),
  individualHours: z
    .string()
    .refine(isHours, {
      message: "Индивидуальные часы должны быть положительным числом",
    })
    .optional(),
  individualAdditionalHours: z
    .string()
    .refine(isHours, {
      message: "Индивидуальные (дополнительно) должны быть положительным числом",
    })
    .optional(),
  distributionEntries: z.array(distributionEntrySchema),
});
