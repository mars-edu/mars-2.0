import { z } from "zod";

export const courseSchema = z.object({
  number: z.string().min(1, "Пожалуйста, введите номер курса"),
  semesters: z.array(z.string()).optional(),
});
