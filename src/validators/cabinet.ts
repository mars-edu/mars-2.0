import { z } from "zod";

export const cabinetSchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите название кабинета"),
  capacity: z.number().min(1, "Вместимость должна быть больше 0"),
  type: z.string().min(1, "Пожалуйста, выберите тип кабинета"),
  description: z.string().optional().default(""),
});
