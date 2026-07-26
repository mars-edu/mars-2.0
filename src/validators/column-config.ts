import { z } from "zod";

export const columnConfigSchema = z.object({
  columns: z
    .array(
      z.object({
        name: z.string(),
        width: z.number().min(1).max(3),
      })
    )
    .refine(
      (columns) => columns.some((col) => col.name.trim() !== ""),
      "Пожалуйста, укажите название хотя бы для одного столбца"
    ),
});
