import { z } from "zod";

export const educationTechnologySchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите название технологии"),
  shortName: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
  academicHourMinutes: z.coerce
    .number({ error: "Длительность академ. часа должна быть числом" })
    .int("Длительность академ. часа должна быть целым числом")
    .positive("Длительность академ. часа должна быть > 0")
    .max(180, "Длительность академ. часа не может быть больше 180 мин"),
  isDefault: z.boolean(),
  description: z.string().optional().or(z.literal("")).transform((v) => (v ? v : undefined)),
});
