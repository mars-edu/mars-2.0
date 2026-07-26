import { z } from "zod";

export const studentSchema = z.object({
  surname: z.string().min(1, "Пожалуйста, введите фамилию студента"),
  firstName: z.string().min(1, "Пожалуйста, введите имя студента"),
  patronymic: z.string().min(1, "Пожалуйста, введите отчество студента"),
  academicYear: z.string().min(1, "Пожалуйста, выберите год поступления"),
  specialty: z.string().min(1, "Пожалуйста, выберите специальность"),
  language: z.string().min(1, "Пожалуйста, выберите язык обучения"),
  base: z.string().min(1, "Пожалуйста, введите базу"),
  gender: z.enum(["male", "female"], {
    error: "Пожалуйста, выберите пол",
  }),
});

export const studentCreateSchema = studentSchema.extend({
  orderNumber: z.string().min(1, "Пожалуйста, введите номер приказа"),
  orderDate: z.string().min(1, "Пожалуйста, выберите дату приказа"),
});
