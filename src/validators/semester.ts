import { z } from "zod";

export const semesterCreateSchema = z.object({
  number: z.coerce.number().min(1, "Пожалуйста, введите номер семестра"),
  shortName: z.string().min(1, "Пожалуйста, введите название семестра"),
});

export const semesterEditSchema = z.object({
  shortName: z.string().min(1, "Пожалуйста, введите название семестра"),
});
