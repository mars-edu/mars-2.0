import { ref, computed, type Ref, type ComputedRef } from "vue";
import type { ZodSchema } from "zod";

export function useFormValidation<T>(schema: ZodSchema<T>, data: Ref<any> | (() => any)) {
  const validationResult = computed(() => {
    return schema.safeParse(typeof data === 'function' ? data() : data.value);
  });

  const formError = computed(() => {
    if (validationResult.value.success) return "";
    const issues = validationResult.value.error.issues;
    if (issues.length > 0) return issues[0].message;
    return "";
  });

  const isFormValid = computed(() => validationResult.value.success);

  return { formError, isFormValid, validationResult };
}
