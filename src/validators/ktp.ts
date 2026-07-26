import { z } from "zod";

export const ktpDetailFormSchema = z.object({
  theme: z.string().min(1, "Тема не может быть пустой."),
  totalHours: z.number().nullable(),
  srsp: z.number().nullable(),
  srs: z.number().nullable(),
  theoretical: z.number().nullable(),
  practical: z.number().nullable(),
  individual: z.number().nullable(),
  homework: z.string().nullable(),
  notes: z.string().nullable(),
});
